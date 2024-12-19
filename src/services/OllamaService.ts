import * as vscode from "vscode";
import * as fs from "fs";
import { ChatHistory, Message } from "../types/types";
import { ChatHistoryStorage } from "./ChatHistoryStorage";
import { ChatManager } from "./ChatManager";
import { OllamaAPI } from "./OllamaAPI";
import { FileSystemAgent } from "../agents/FileSystemAgent";
import { MessageBroker } from "./MessageBroker";
import { MessageType } from "../types/types";


export class OllamaService {
  private _storage: ChatHistoryStorage;
  private _chatManager: ChatManager;
  private _api: OllamaAPI;
  private _fileSystemAgent: FileSystemAgent;
  private _messageBroker: MessageBroker;
  private _isHistoryChat: boolean = false;

  constructor(context: vscode.ExtensionContext) {
    this._storage = new ChatHistoryStorage(context);
    this._chatManager = new ChatManager();
    this._api = new OllamaAPI();
    this._fileSystemAgent = new FileSystemAgent();
    this._messageBroker = MessageBroker.getInstance();
  }

  async sendToOllama(
    userMessage: string,
    selectedFiles: string[] = [],
    view: vscode.WebviewView  | undefined
  ): Promise<void> {
    try {
      this._messageBroker.setView(view);
      const messageWithContext = await this._fileSystemAgent.prepareMessageWithContext(
        userMessage,
        selectedFiles
      );

      const currentMessagesResponse = await this._chatManager.getCurrentMessages();
      const isNewConversation = currentMessagesResponse.messages.length === 0;
      
      if (isNewConversation && !this._isHistoryChat) {
        await this._storage.saveChat(
          this._chatManager.getCurrentChatId(),
          []
        );
      }

      await this._chatManager.addMessage({
        role: "user",
        content: messageWithContext,
      });

      const currentMessages = await this._chatManager.getAllMessages();
      await this._storage.saveChat(
        this._chatManager.getCurrentChatId(),
        currentMessages
      );

      const conversationText = await this._chatManager.formatConversation();
      const response = await this._api.generateResponse(
        conversationText,
        view
      );

      if (response) {
        await this._chatManager.addMessage({ role: "assistant", content: response });
        const updatedMessages = await this._chatManager.getAllMessages();
        await this._storage.saveChat(
          this._chatManager.getCurrentChatId(),
          updatedMessages
        );
      }
    } catch (error) {
      console.error("Error in sendToOllama:", error);
      this._messageBroker.sendError("Error al procesar el mensaje. Por favor, intente de nuevo.");
    }
  }

  async loadChatHistory(): Promise<ChatHistory[]> {
    const history = await this._storage.loadHistory();
    this._messageBroker.sendHistoryLoaded(history);
    return history;
  }

  async loadChat(chatId: string): Promise<boolean> {
    try {
      const chats = JSON.parse(
        fs.readFileSync(this._storage.getHistoryPath(), "utf-8")
      );
      const chat = chats.find((c: ChatHistory) => c.id === chatId);
      if (chat) {
        this._chatManager.setCurrentChatId(chatId);
        await this._chatManager.setConversation(chat.messages);
        this._isHistoryChat = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading chat:", error);
      return false;
    }
  }

  async clearConversation(): Promise<void> {
    if (!this._isHistoryChat) {
      const currentMessages = await this._chatManager.getAllMessages();
      if (currentMessages.length > 0) {
        const oldChatId = Date.now().toString();
        await this._storage.saveChat(oldChatId, currentMessages);
      }
      await this._chatManager.clearConversation();
    } else {
      await this._chatManager.clearMessages();
    }
  }

  async getCurrentMessages(page: number = 0): Promise<{
    messages: Message[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  }> {
    return await this._chatManager.getCurrentMessages(page);
  }

  async getProjectFiles(): Promise<string[]> {
    return await this._fileSystemAgent.getProjectFiles();
  }

  async editAndResendMessage(
    messageIndex: number,
    userMessage: string,
    selectedFiles: string[],
    view: vscode.WebviewView  | undefined
  ): Promise<void> {
    try {
      // Truncar la conversación hasta el mensaje editado
      await this._chatManager.truncateConversationAtIndex(messageIndex);

      // Enviar el mensaje editado
      await this.sendToOllama(userMessage, selectedFiles, view);

      // Guardar la conversación actualizada
      const currentMessages = await this._chatManager.getAllMessages();
      await this._storage.saveChat(
        this._chatManager.getCurrentChatId(),
        currentMessages
      );
    } catch (error) {
      console.error("Error editing message:", error);
      this._messageBroker.sendError("Error al editar el mensaje");
    }
  }
}