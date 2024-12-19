import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChatHistory, Message } from "../types/types";
import { AppConfig } from "../config/AppConfig";

export class ChatHistoryStorage {
  private _historyPath: string;

  constructor(context: vscode.ExtensionContext) {
    try {
      const storageUri = context.storageUri || context.globalStorageUri;
      
      if (storageUri) {
        this._historyPath = path.join(storageUri.fsPath, AppConfig.storage.filename);
      } else {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
        const storageDir = path.join(homeDir, '.vscode-ai-chat');
        
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        
        this._historyPath = path.join(storageDir, AppConfig.storage.filename);
      }
      
      this.initializeStorage();
    } catch (error) {
      console.error('Error initializing storage:', error);
      const tmpDir = path.join('/tmp', '.vscode-ai-chat');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      this._historyPath = path.join(tmpDir, AppConfig.storage.filename);
      this.initializeStorage();
    }
  }

  private initializeStorage() {
    try {
      const storageDir = path.dirname(this._historyPath);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      if (!fs.existsSync(this._historyPath)) {
        fs.writeFileSync(this._historyPath, "[]", "utf-8");
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
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
      if (existingChatIndex >= 0) {
        history[existingChatIndex] = chatHistory;
      } else {
        history.push(chatHistory);
      }

      await fs.promises.writeFile(this._historyPath, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  private generateSummary(messages: Message[]): string {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");
    return lastUserMessage ? lastUserMessage.content.slice(0, 100) + "..." : "";
  }

  async loadHistory(): Promise<ChatHistory[]> {
    try {
      if (!fs.existsSync(this._historyPath)) {
        return [];
      }
      const data = await fs.promises.readFile(this._historyPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const history = await this.loadHistory();
      const updatedHistory = history.filter((chat) => chat.id !== chatId);
      await fs.promises.writeFile(
        this._historyPath,
        JSON.stringify(updatedHistory, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }

  getHistoryPath(): string {
    return this._historyPath;
  }
}
