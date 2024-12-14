import { spawn, ChildProcess } from "child_process";
import * as vscode from "vscode";

interface Message {
  role: "user" | "assistant";
  content: string;
  tokens?: number;
}

interface TokenResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  eval_count: number;
  eval_duration: number;
  total_duration: number;
}

interface ResponseMetrics {
  tokensGenerated: number;
  totalTokens: number;
  duration: string;
}

export class OllamaService {
  private _controller: AbortController | null = null;
  private _conversationHistory: Message[] = [];
  private readonly MAX_TOKENS = 12000;
  private _totalTokens = 0;

  private formatConversation(): string {
    return this._conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
  }

  private addToHistory(
    role: "user" | "assistant",
    content: string,
    tokens?: number
  ) {
    this._conversationHistory.push({ role, content, tokens });
    if (tokens) {
      this._totalTokens += tokens;
    }
  }

  private trimConversationHistory() {
    while (
      this._conversationHistory.length > 2 &&
      this._totalTokens > this.MAX_TOKENS
    ) {
      const removed = this._conversationHistory.shift();
      if (removed?.tokens) {
        this._totalTokens -= removed.tokens;
      }
    }
  }

  async sendToOllama(
    userMessage: string,
    view: vscode.WebviewView | undefined
  ): Promise<void> {
    if (this._controller) {
      this._controller.abort();
    }

    this._controller = new AbortController();
    const signal = this._controller.signal;

    try {
      // Primero obtenemos los tokens del mensaje del usuario
      const tokenCountResponse = await fetch(
        "http://localhost:11434/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen2.5-coder:7b",
            prompt: userMessage,
            stream: false,
          }),
          signal,
        }
      );

      const tokenData = (await tokenCountResponse.json()) as TokenResponse;
      const userTokens = tokenData.eval_count;

      // Agregamos el mensaje del usuario con sus tokens
      this.addToHistory("user", userMessage, userTokens);
      this.trimConversationHistory();

      const fullPrompt = this.formatConversation();

      // Resto de la lógica para obtener la respuesta del modelo
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen2.5-coder:7b",
          prompt: fullPrompt,
          stream: true,
          context_length: this.MAX_TOKENS,
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Error en la respuesta: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      let buffer = "";
      let metrics: ResponseMetrics = {
        tokensGenerated: 0,
        totalTokens: this._totalTokens,
        duration: "0",
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          const data = JSON.parse(line);
          buffer += data.response;

          if (data.done) {
            metrics = {
              tokensGenerated: data.eval_count,
              totalTokens: this._totalTokens + data.eval_count,
              duration: (data.total_duration / 1000000000).toFixed(2),
            };

            console.log(`Tokens del usuario: ${userTokens}`);
            console.log(
              `Tokens generados en la respuesta: ${metrics.tokensGenerated}`
            );
            console.log(
              `Tokens totales en la conversación: ${metrics.totalTokens}`
            );
            console.log(`Duración: ${metrics.duration}s`);
          }

          if (view) {
            view.webview.postMessage({
              type: "response",
              message: data.response,
              done: data.done,
              metrics: data.done ? metrics : undefined,
            });
          }

          if (data.done) {
            this.addToHistory("assistant", buffer, data.eval_count);
            this.trimConversationHistory();
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      if (view && error instanceof Error && error.name !== "AbortError") {
        view.webview.postMessage({
          type: "error",
          message:
            "Error al comunicarse con Ollama. Verifica que esté ejecutándose.",
        });
      }
    } finally {
      this._controller = null;
    }
  }

  clearConversation() {
    this._conversationHistory = [];
    this._totalTokens = 0;
  }
}
