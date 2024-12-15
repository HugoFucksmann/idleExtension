import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChatHistory, Message } from "../types/chatTypes";

export class ChatHistoryStorage {
  private _historyPath: string;

  constructor(context: vscode.ExtensionContext) {
    if (!context.storageUri) {
      throw new Error("No se pudo acceder al almacenamiento de la extensión");
    }
    this._historyPath = path.join(
      context.storageUri.fsPath,
      "chat-history.json"
    );
    this.initializeStorage(context);
  }

  private initializeStorage(context: vscode.ExtensionContext) {
    if (!context.storageUri) {
      throw new Error("No se pudo acceder al almacenamiento de la extensión");
    }

    if (!fs.existsSync(context.storageUri.fsPath)) {
      fs.mkdirSync(context.storageUri.fsPath, { recursive: true });
    }
    if (!fs.existsSync(this._historyPath)) {
      fs.writeFileSync(this._historyPath, "[]", "utf-8");
    }
  }

  async saveChat(chatId: string, messages: Message[]): Promise<void> {
    try {
      const history = await this.loadHistory();
      const chatHistory: ChatHistory = {
        id: chatId,
        timestamp: new Date().toISOString(),
        messages,
        summary: this.generateSummary(messages),
      };

      const existingChatIndex = history.findIndex((chat) => chat.id === chatId);
      existingChatIndex >= 0
        ? (history[existingChatIndex] = chatHistory)
        : history.push(chatHistory);

      fs.writeFileSync(this._historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  async loadHistory(): Promise<ChatHistory[]> {
    try {
      return fs.existsSync(this._historyPath)
        ? JSON.parse(fs.readFileSync(this._historyPath, "utf-8"))
        : [];
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  }

  getHistoryPath(): string {
    return this._historyPath;
  }

  private generateSummary(messages: Message[]): string {
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    return firstUserMessage
      ? `${firstUserMessage.content.slice(0, 30)}${
          firstUserMessage.content.length > 30 ? "..." : ""
        }`
      : "Nueva conversación";
  }
}
