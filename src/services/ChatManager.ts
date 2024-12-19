import { Message } from "../types/chatTypes";

export class ChatManager {
  private _conversationHistory: Message[] = [];
  private _currentChatId: string;
  private _lock: Promise<void> = Promise.resolve();
  private readonly PAGE_SIZE = 50;

  constructor() {
    this._currentChatId = this.generateChatId();
  }

  private generateChatId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
      this._conversationHistory.push(message);
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
      this._currentChatId = this.generateChatId();
    });
  }

  async setConversation(messages: Message[]): Promise<void> {
    await this.withLock(async () => {
      this._conversationHistory = messages;
    });
  }

  async getCurrentMessages(page: number = 0): Promise<{
    messages: Message[];
    totalPages: number;
    currentPage: number;
  }> {
    return await this.withLock(async () => {
      const start = page * this.PAGE_SIZE;
      const end = start + this.PAGE_SIZE;
      const totalPages = Math.ceil(this._conversationHistory.length / this.PAGE_SIZE);
      
      return {
        messages: this._conversationHistory.slice(start, end),
        totalPages,
        currentPage: page,
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
      await this.truncateConversationAtIndex(index);
      await this.addMessage(newMessage);
    });
  }

  async getMessageCount(): Promise<number> {
    return await this.withLock(async () => {
      return this._conversationHistory.length;
    });
  }
}
