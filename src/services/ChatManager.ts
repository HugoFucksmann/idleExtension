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
      // Asignar un ID temporal único al mensaje
      const tempMessage = {
        ...message,
        tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
      this._currentChatId = this.generateChatId();
    });
  }

  async setConversation(messages: Message[]): Promise<void> {
    await this.withLock(async () => {
      // Asignar IDs temporales a los mensajes existentes
      this._conversationHistory = messages.map(msg => ({
        ...msg,
        tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
      const totalPages = Math.ceil(totalMessages / this.PAGE_SIZE);
      
      // Calcular índices para la paginación desde el final
      const end = totalMessages - (page * this.PAGE_SIZE);
      const start = Math.max(end - this.PAGE_SIZE, 0);
      
      // Obtener los mensajes en el orden correcto
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
        // Mantener el tempId si existe
        const tempId = this._conversationHistory[index].tempId;
        this._conversationHistory[index] = {
          ...newMessage,
          tempId: tempId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
