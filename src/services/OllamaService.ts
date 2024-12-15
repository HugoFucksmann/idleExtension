import { spawn, ChildProcess } from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { modelConfig } from "../config/modelConfig";

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
  private readonly MAX_TOKENS = modelConfig.maxTokens;
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
      this.addToHistory("user", userMessage);
      this.trimConversationHistory();

      const fullPrompt = this.formatConversation();

      const response = await fetch(
        `${modelConfig.baseUrl}${modelConfig.apiEndpoint}`,
        {
          method: "POST",
          headers: modelConfig.defaultHeaders,
          body: JSON.stringify({
            model: modelConfig.name,
            prompt: fullPrompt,
            stream: true,
            context_length: modelConfig.contextLength,
          }),
          signal,
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Error en la respuesta: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          const data = JSON.parse(line);
          buffer += data.response;

          if (view) {
            view.webview.postMessage({
              type: "response",
              message: data.response,
              done: data.done,
            });
          }

          if (data.done) {
            this.addToHistory("assistant", buffer);
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
