import * as vscode from 'vscode';
import { ChatHistory, MessageType } from '../types/types';

export class MessageBroker {
  private static instance: MessageBroker;
  private view: vscode.WebviewView | undefined;

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

  sendResponse(content: string, done: boolean = false) {
    this.view?.webview.postMessage({
      type: MessageType.RESPONSE,
      message: content,
      done
    });
  }

  sendError(message: string) {
    this.view?.webview.postMessage({
      type: MessageType.ERROR,
      message
    });
  }

  sendHistoryLoaded(history: ChatHistory[]) {
    this.view?.webview.postMessage({
      type: MessageType.HISTORY_LOADED,
      history
    });
  }

  sendChatLoaded(messages: any[]) {
    this.view?.webview.postMessage({
      type: MessageType.CHAT_LOADED,
      messages
    });
  }

  sendMessagesLoaded(messages: any[], totalPages: number, currentPage: number) {
    this.view?.webview.postMessage({
      type: MessageType.MESSAGES_LOADED,
      messages,
      totalPages,
      currentPage
    });
  }

  sendConversationCleared() {
    this.view?.webview.postMessage({
      type: MessageType.CONVERSATION_CLEARED
    });
  }

  sendProjectFiles(files: string[]) {
    this.view?.webview.postMessage({
      type: MessageType.PROJECT_FILES,
      files
    });
  }
}
