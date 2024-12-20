import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChatHistory, Message, ValidationResult } from "../types/types";
import { AppConfig } from "../config/AppConfig";
import { RetryManager } from "../utils/RetryManager";

export class ChatHistoryStorage {
  private _historyPath: string;
  private _retryManager: RetryManager = new RetryManager();

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
      
      console.log('ChatHistoryStorage: Initialized with path:', this._historyPath);
      this.initializeStorage();
    } catch (error) {
      console.error('ChatHistoryStorage: Error initializing storage:', error);
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
        console.log('ChatHistoryStorage: Creating storage directory:', storageDir);
        fs.mkdirSync(storageDir, { recursive: true });
      }
      if (!fs.existsSync(this._historyPath)) {
        console.log('ChatHistoryStorage: Initializing empty history file');
        fs.writeFileSync(this._historyPath, "[]", "utf-8");
      }
    } catch (error) {
      console.error("ChatHistoryStorage: Error initializing storage:", error);
    }
  }

  private validateChat(chatHistory: ChatHistory): ValidationResult {
    const errors: string[] = [];

    if (!chatHistory.id) errors.push("Chat ID is required");
    if (!chatHistory.timestamp) errors.push("Timestamp is required");
    if (!Array.isArray(chatHistory.messages)) errors.push("Messages must be an array");
    
    const isValid = errors.length === 0;
    if (!isValid) {
      console.error('ChatHistoryStorage: Chat validation failed:', errors);
    }
    return { isValid, errors };
  }

  private generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(msg => msg.role === "user");
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 50);
      return title.length < firstUserMessage.content.length ? `${title}...` : title;
    }
    return "New Chat";
  }

  private generatePreview(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const preview = lastMessage.content.slice(0, 100);
      return preview.length < lastMessage.content.length ? `${preview}...` : preview;
    }
    return "";
  }

  async saveChat(chatId: string, messages: Message[]): Promise<void> {
    console.log('ChatHistoryStorage: Attempting to save chat:', chatId);
    console.log('ChatHistoryStorage: Number of messages:', messages.length);
    
    return this._retryManager.retry(async () => {
      try {
        let history: ChatHistory[] = [];
        
        try {
          const data = await fs.promises.readFile(this._historyPath, "utf-8");
          history = JSON.parse(data);
          console.log('ChatHistoryStorage: Loaded existing history, current chats:', history.length);
        } catch (error) {
          console.error('ChatHistoryStorage: Error reading history file, starting fresh:', error);
          history = [];
        }

        const chatHistory: ChatHistory = {
          id: chatId,
          timestamp: new Date().toISOString(),
          title: this.generateTitle(messages),
          preview: this.generatePreview(messages),
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString()
          })),
          summary: this.generatePreview(messages)
        };

        const validation = this.validateChat(chatHistory);
        if (!validation.isValid) {
          throw new Error(`Invalid chat data: ${validation.errors.join(", ")}`);
        }

        const existingChatIndex = history.findIndex((chat) => chat.id === chatId);
        if (existingChatIndex >= 0) {
          console.log('ChatHistoryStorage: Updating existing chat:', chatId);
          history[existingChatIndex] = chatHistory;
        } else {
          console.log('ChatHistoryStorage: Adding new chat:', chatId);
          history.unshift(chatHistory);
        }

        await fs.promises.writeFile(this._historyPath, JSON.stringify(history, null, 2), 'utf-8');
        console.log('ChatHistoryStorage: Successfully saved chat:', chatId);
      } catch (error) {
        console.error("ChatHistoryStorage: Error saving chat history:", error);
        throw error;
      }
    });
  }

  async loadHistory(): Promise<ChatHistory[]> {
    try {
      console.log('ChatHistoryStorage: Loading history from:', this._historyPath);
      if (!fs.existsSync(this._historyPath)) {
        console.log('ChatHistoryStorage: History file does not exist, returning empty array');
        return [];
      }
      const data = await fs.promises.readFile(this._historyPath, "utf-8");
      const history = JSON.parse(data);
      console.log('ChatHistoryStorage: Loaded history, number of chats:', history.length);
      return history;
    } catch (error) {
      console.error("ChatHistoryStorage: Error loading chat history:", error);
      return [];
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      console.log('ChatHistoryStorage: Deleting chat:', chatId);
      const history = await this.loadHistory();
      const updatedHistory = history.filter((chat) => chat.id !== chatId);
      await fs.promises.writeFile(
        this._historyPath,
        JSON.stringify(updatedHistory, null, 2),
        "utf-8"
      );
      console.log('ChatHistoryStorage: Successfully deleted chat:', chatId);
    } catch (error) {
      console.error("ChatHistoryStorage: Error deleting chat:", error);
    }
  }

  getHistoryPath(): string {
    return this._historyPath;
  }
}
