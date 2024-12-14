import { spawn, ChildProcess } from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

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

interface ChatHistory {
  id: string;
  timestamp: string;
  messages: Message[];
  summary?: string;
}

export class OllamaService {
  private _controller: AbortController | null = null;
  private _conversationHistory: Message[] = [];
  private readonly MAX_TOKENS = 12000;
  private _totalTokens = 0;
  private _historyPath: string;
  private _currentChatId: string;

  constructor(context: vscode.ExtensionContext) {
    if (!fs.existsSync(context.globalStoragePath)) {
      fs.mkdirSync(context.globalStoragePath, { recursive: true });
    }

    this._historyPath = path.join(
      context.globalStoragePath,
      "chat-history.json"
    );
    this._currentChatId = this.generateChatId();
    this.ensureHistoryFileExists();
  }

  private generateChatId(): string {
    return Date.now().toString();
  }

  private ensureHistoryFileExists() {
    try {
      if (!fs.existsSync(this._historyPath)) {
        fs.writeFileSync(
          this._historyPath,
          JSON.stringify([], null, 2),
          "utf-8"
        );
      }
    } catch (error) {
      console.error("Error creating history file:", error);
      fs.writeFileSync(this._historyPath, "[]", "utf-8");
    }
  }

  private async saveToHistory() {
    try {
      let history: ChatHistory[] = [];
      if (fs.existsSync(this._historyPath)) {
        const content = fs.readFileSync(this._historyPath, "utf-8");
        history = JSON.parse(content);
      }

      // Buscar chat existente o crear uno nuevo
      const existingChatIndex = history.findIndex(
        (chat) => chat.id === this._currentChatId
      );
      const chatHistory: ChatHistory = {
        id: this._currentChatId,
        timestamp: new Date().toISOString(),
        messages: this._conversationHistory,
        summary: this.generateSummary(),
      };

      if (existingChatIndex >= 0) {
        history[existingChatIndex] = chatHistory;
      } else {
        history.push(chatHistory);
      }

      fs.writeFileSync(this._historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  private generateSummary(): string {
    // Tomar el primer mensaje del usuario como resumen
    const firstUserMessage = this._conversationHistory.find(
      (msg) => msg.role === "user"
    );
    if (firstUserMessage) {
      // Limitar a 50 caracteres
      return (
        firstUserMessage.content.slice(0, 50) +
        (firstUserMessage.content.length > 50 ? "..." : "")
      );
    }
    return "Nueva conversación";
  }

  async loadChatHistory(): Promise<ChatHistory[]> {
    try {
      if (fs.existsSync(this._historyPath)) {
        const content = fs.readFileSync(this._historyPath, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [];
  }

  loadChat(chatId: string) {
    try {
      const history = fs.readFileSync(this._historyPath, "utf-8");
      const chats: ChatHistory[] = JSON.parse(history);
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        this._currentChatId = chatId;
        this._conversationHistory = chat.messages;
        this._totalTokens = chat.messages.reduce(
          (total, msg) => total + (msg.tokens || 0),
          0
        );
        return true;
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
    return false;
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
    this.saveToHistory();
  }

  clearConversation() {
    this._conversationHistory = [];
    this._totalTokens = 0;
    this._currentChatId = this.generateChatId();
  }

  private formatConversation(): string {
    return this._conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
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

  getCurrentMessages(): Message[] {
    return this._conversationHistory;
  }
}
