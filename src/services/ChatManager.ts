import { Message } from "../types/types";
import { IdGenerator } from "../utils/IdGenerator";
import { AppConfig } from "../config/AppConfig";

export class ChatManager {
  private _conversationHistory: Message[] = [];
  private _currentChatId: string;
  private _lock: Promise<void> = Promise.resolve();
  private readonly PAGE_SIZE = AppConfig.chat.pageSize;

  constructor() {
    this._currentChatId = IdGenerator.generate();
  }

  private async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const release = await this.acquireLock();
    try {
      return await operation();
    } finally {
      release();
    }
  }

  private acquireLock(): Promise<() => void> {
    let release: () => void;
    const newLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousLock = this._lock;
    this._lock = newLock;

    return previousLock.then(() => release!);
  }

  async addMessage(message: Message): Promise<void> {
    await this.withLock(async () => {
      const tempMessage = {
        ...message,
        tempId: IdGenerator.generate()
      };
      this._conversationHistory.push(tempMessage);
    });
  }

  async clearMessages(): Promise<void> {
    await this.withLock(async () => {
      this._conversationHistory = [];
    });
  }

  async clearConversation(): Promise<void> {
    await this.withLock(async () => {
      this._conversationHistory = [];
      this._currentChatId = IdGenerator.generate();
    });
  }

  async setConversation(messages: Message[]): Promise<void> {
    await this.withLock(async () => {
      this._conversationHistory = messages.map(msg => ({
        ...msg,
        tempId: IdGenerator.generate()
      }));
    });
  }

  async getCurrentMessages(page: number = 0): Promise<{
    messages: Message[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  }> {
    return await this.withLock(async () => {
      const totalMessages = this._conversationHistory.length;
      const totalPages = Math.ceil(totalMessages / AppConfig.chat.pageSize);
      
      const end = totalMessages - (page * AppConfig.chat.pageSize);
      const start = Math.max(end - AppConfig.chat.pageSize, 0);
      
      const pageMessages = this._conversationHistory.slice(start, end);
      
      return {
        messages: pageMessages,
        totalPages,
        currentPage: page,
        hasMore: start > 0
      };
    });
  }

  async getAllMessages(): Promise<Message[]> {
    return await this.withLock(async () => {
      return [...this._conversationHistory];
    });
  }

  getCurrentChatId(): string {
    return this._currentChatId;
  }

  setCurrentChatId(id: string): void {
    this._currentChatId = id;
  }

  async formatConversation(): Promise<string> {
    return await this.withLock(async () => {
      return this._conversationHistory
        .map((msg) => {
          const escapedContent = msg.content
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/"/g, '\\"');
          
          return `${msg.role}: ${escapedContent}`;
        })
        .join("\n\n");
    });
  }

  async truncateConversationAtIndex(index: number): Promise<void> {
    await this.withLock(async () => {
      this._conversationHistory = this._conversationHistory.slice(0, index);
    });
  }

  async editMessage(index: number, newMessage: Message): Promise<void> {
    await this.withLock(async () => {
      if (index >= 0 && index < this._conversationHistory.length) {
        const tempId = this._conversationHistory[index].tempId;
        this._conversationHistory[index] = {
          ...newMessage,
          tempId: tempId || IdGenerator.generate()
        };
      }
    });
  }

  getMessageCount(): Promise<number> {
    return this.withLock(async () => {
      return this._conversationHistory.length;
    });
  }
}
