import { Message } from "../types/chatTypes";

export class ChatManager {
  private _conversationHistory: Message[] = [];
  private _currentChatId: string;

  constructor() {
    this._currentChatId = Date.now().toString();
  }

  addMessage(message: Message): void {
    this._conversationHistory.push(message);
  }

  clearConversation(): void {
    this._conversationHistory = [];
    this._currentChatId = Date.now().toString();
  }

  setConversation(messages: Message[]): void {
    this._conversationHistory = messages;
  }

  getCurrentMessages(): Message[] {
    return this._conversationHistory;
  }

  getCurrentChatId(): string {
    return this._currentChatId;
  }

  setCurrentChatId(id: string): void {
    this._currentChatId = id;
  }

  formatConversation(): string {
    return this._conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
  }

  truncateConversationAtIndex(index: number): void {
    this._conversationHistory = this._conversationHistory.slice(0, index);
  }

  editMessage(index: number, newMessage: Message): void {
    this.truncateConversationAtIndex(index);
    this.addMessage(newMessage);
  }
}
