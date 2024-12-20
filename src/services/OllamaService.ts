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
    this._chatManager = new ChatManager(context);
    this._api = new OllamaAPI();
    this._fileSystemAgent = new FileSystemAgent();
    this._messageBroker = MessageBroker.getInstance();
  }

  async sendToOllama(
    userMessage: string,
    selectedFiles: string[] = [],
    view: vscode.WebviewView | undefined
  ): Promise<void> {
    try {
      console.log('OllamaService: Starting new message processing');
      this._messageBroker.setView(view);

      const messageWithContext = await this.prepareMessageWithContext(
        userMessage,
        selectedFiles
      );

      await this.saveUserMessage(messageWithContext);

      const conversationText = await this._chatManager.formatConversation();
      const response = await this._api.generateResponse(conversationText);

      if (response) {
        await this.saveAssistantMessage(response);
      }
    } catch (error) {
      console.error("OllamaService: Error in sendToOllama:", error);
      this._messageBroker.sendError(
        "Error al procesar el mensaje. Por favor, intente de nuevo.",
        "OLLAMA_SERVICE_ERROR",
        error
      );
    }
  }

  async prepareMessageWithContext(
    userMessage: string,
    selectedFiles: string[] = []
  ): Promise<string> {
    return await this._fileSystemAgent.prepareMessageWithContext(
      userMessage,
      selectedFiles
    );
  }

  async saveUserMessage(content: string): Promise<void> {
    console.log('OllamaService: Saving user message');
    const currentMessagesResponse = await this._chatManager.getCurrentMessages();
    const isNewConversation = currentMessagesResponse.messages.length === 0;
    
    if (isNewConversation && !this._isHistoryChat) {
      console.log('OllamaService: Initializing new chat');
      const chatId = this._chatManager.getCurrentChatId();
      console.log('OllamaService: New chat ID:', chatId);
      await this._storage.saveChat(chatId, []);
    }

    await this._chatManager.addMessage({
      role: "user",
      content: content,
    });

    const currentMessages = await this._chatManager.getAllMessages();
    const chatId = this._chatManager.getCurrentChatId();
    await this._storage.saveChat(chatId, currentMessages);
  }

  async saveAssistantMessage(content: string): Promise<void> {
    console.log('OllamaService: Saving assistant message');
    await this._chatManager.addMessage({
      role: "assistant",
      content: content,
    });

    const updatedMessages = await this._chatManager.getAllMessages();
    const chatId = this._chatManager.getCurrentChatId();
    await this._storage.saveChat(chatId, updatedMessages);
  }

  async loadChatHistory(): Promise<ChatHistory[]> {
    try {
      const history = await this._storage.loadHistory();
      await this._messageBroker.sendHistoryLoaded(history);
      return history;
    } catch (error) {
      console.error("Error loading chat history:", error);
      await this._messageBroker.sendError(
        "Error al cargar el historial",
        "HISTORY_LOAD_ERROR",
        error
      );
      return [];
    }
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
        
        await this._messageBroker.sendChatLoaded(
          chat.messages,
          0, // currentPage
          1, // totalPages
          false // hasMore
        );
        
        return true;
      }
      
      await this._messageBroker.sendError(
        "Chat no encontrado",
        "CHAT_NOT_FOUND"
      );
      return false;
    } catch (error) {
      console.error("Error loading chat:", error);
      await this._messageBroker.sendError(
        "Error al cargar el chat",
        "CHAT_LOAD_ERROR",
        error
      );
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
      await this._chatManager.truncateConversationAtIndex(messageIndex);

      await this.sendToOllama(userMessage, selectedFiles, view);

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