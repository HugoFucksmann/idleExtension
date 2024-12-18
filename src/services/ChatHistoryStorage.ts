import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChatHistory, Message } from "../types/chatTypes";

export class ChatHistoryStorage {
  private _historyPath: string;

  constructor(context: vscode.ExtensionContext) {
    try {
      // Try multiple storage options in order of preference
      const storageUri = context.storageUri || context.globalStorageUri;
      
      if (storageUri) {
        // Use VSCode's storage if available
        this._historyPath = path.join(storageUri.fsPath, "chat-history.json");
      } else {
        // Fallback to user's home directory
        const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
        const storageDir = path.join(homeDir, '.vscode-ai-chat');
        
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        
        this._historyPath = path.join(storageDir, "chat-history.json");
      }
      
      this.initializeStorage();
    } catch (error) {
      console.error('Error initializing storage:', error);
      // Last resort: use temporary directory
      const tmpDir = path.join('/tmp', '.vscode-ai-chat');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      this._historyPath = path.join(tmpDir, "chat-history.json");
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
      // Don't throw, just log the error and continue
      // The chat will still work but won't persist
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
      // Don't throw, just log the error
      // Allow the chat to continue even if saving fails
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
      // Don't throw, just log the error
    }
  }

  getHistoryPath(): string {
    return this._historyPath;
  }
}
