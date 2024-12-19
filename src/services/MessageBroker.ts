import * as vscode from 'vscode';
import { ChatHistory, MessageType, EventPayload, EventHandler, EventSubscription } from '../types/types';

export class MessageBroker {
  private static instance: MessageBroker;
  private view: vscode.WebviewView | undefined;
  private handlers: Map<MessageType, Set<EventHandler<any>>> = new Map();

  private constructor() {}

  static getInstance(): MessageBroker {
    if (!MessageBroker.instance) {
      MessageBroker.instance = new MessageBroker();
    }
    return MessageBroker.instance;
  }

  setView(view: vscode.WebviewView | undefined) {
    this.view = view;
  }

  subscribe<T extends MessageType>(
    type: T,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlers = this.handlers.get(type)!;
    handlers.add(handler);

    return {
      unsubscribe: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  async emit<T extends MessageType>(
    type: T,
    payload: EventPayload[T]
  ): Promise<void> {
    const handlers = this.handlers.get(type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(handler => handler(payload))
      );
    }
    
    // También enviamos al webview si está disponible
    if (this.view?.webview) {
      this.view.webview.postMessage({
        type,
        ...payload
      });
    }
  }

  async sendResponse(content: string, done: boolean = false) {
    await this.emit(MessageType.RESPONSE, { message: content, done });
  }

  async sendError(message: string, code?: string, details?: any) {
    await this.emit(MessageType.ERROR, { message, code, details });
  }

  async sendHistoryLoaded(history: ChatHistory[]) {
    await this.emit(MessageType.HISTORY_LOADED, { history });
  }

  async sendChatLoaded(
    messages: any[],
    currentPage: number,
    totalPages: number,
    hasMore: boolean
  ) {
    await this.emit(MessageType.CHAT_LOADED, {
      messages,
      currentPage,
      totalPages,
      hasMore
    });
  }

  async sendMessagesLoaded(
    messages: any[],
    totalPages: number,
    currentPage: number,
    hasMore: boolean
  ) {
    await this.emit(MessageType.MESSAGES_LOADED, {
      messages,
      totalPages,
      currentPage,
      hasMore
    });
  }

  async sendConversationCleared() {
    await this.emit(MessageType.CONVERSATION_CLEARED, {});
  }

  async sendProjectFiles(files: string[]) {
    await this.emit(MessageType.PROJECT_FILES, { files });
  }
}
