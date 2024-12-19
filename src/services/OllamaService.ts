import * as vscode from "vscode";
import * as fs from "fs";
import { ChatHistory, Message } from "../types/chatTypes";
import { ChatHistoryStorage } from "./ChatHistoryStorage";
import { ChatManager } from "./ChatManager";
import { OllamaAPI } from "./OllamaAPI";
import { FileSystemAgent } from "../agents/FileSystemAgent";

export class OllamaService {
  private _storage: ChatHistoryStorage;
  private _chatManager: ChatManager;
  private _api: OllamaAPI;
  private _fileSystemAgent: FileSystemAgent;
  private _isHistoryChat: boolean = false;

  constructor(context: vscode.ExtensionContext) {
    this._storage = new ChatHistoryStorage(context);
    this._chatManager = new ChatManager();
    this._api = new OllamaAPI();
    this._fileSystemAgent = new FileSystemAgent();
  }

  async sendToOllama(
    userMessage: string,
    selectedFiles: string[] = [],
    view: vscode.WebviewView | undefined
  ): Promise<void> {
    try {
      const messageWithContext =
        await this._fileSystemAgent.prepareMessageWithContext(
          userMessage,
          selectedFiles
        );

      // Si es una conversación nueva (sin mensajes), guardar inmediatamente
      const isNewConversation = this._chatManager.getCurrentMessages().length === 0;
      if (isNewConversation && !this._isHistoryChat) {
        await this._storage.saveChat(
          this._chatManager.getCurrentChatId(),
          []
        );
      }

      // Agregar mensaje del usuario
      this._chatManager.addMessage({
        role: "user",
        content: messageWithContext,
      });

      // Guardar después del mensaje del usuario
      await this._storage.saveChat(
        this._chatManager.getCurrentChatId(),
        this._chatManager.getCurrentMessages()
      );

      const response = await this._api.generateResponse(
        this._chatManager.formatConversation(),
        view
      );

      if (response) {
        // Agregar respuesta del asistente
        this._chatManager.addMessage({ role: "assistant", content: response });
        // Guardar después de la respuesta del asistente
        await this._storage.saveChat(
          this._chatManager.getCurrentChatId(),
          this._chatManager.getCurrentMessages()
        );
      }
    } catch (error) {
      console.error("Error in sendToOllama:", error);
      if (view) {
        view.webview.postMessage({
          type: "error",
          message: "Error al procesar el mensaje. Por favor, intente de nuevo.",
        });
      }
    }
  }

  async loadChatHistory(): Promise<ChatHistory[]> {
    return this._storage.loadHistory();
  }

  loadChat(chatId: string): boolean {
    try {
      const chats = JSON.parse(
        fs.readFileSync(this._storage.getHistoryPath(), "utf-8")
      );
      const chat = chats.find((c: ChatHistory) => c.id === chatId);
      if (chat) {
        this._chatManager.setCurrentChatId(chatId);
        this._chatManager.setConversation(chat.messages);
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
    // Si NO es un chat del historial y hay mensajes, guardar antes de limpiar
    if (!this._isHistoryChat) {
      const currentMessages = this._chatManager.getCurrentMessages();
      if (currentMessages.length > 0) {
        const oldChatId = Date.now().toString();
        await this._storage.saveChat(oldChatId, currentMessages);
      }
      // Limpiar la conversación solo si no es del historial
      this._chatManager.clearConversation();
    }
    // Si es del historial, solo resetear los mensajes pero mantener el mismo ID
    else {
      this._chatManager.clearMessages();
    }
  }

  getCurrentMessages(): Message[] {
    return this._chatManager.getCurrentMessages();
  }

  async getProjectFiles(): Promise<string[]> {
    return await this._fileSystemAgent.getProjectFiles();
  }

  async editAndResendMessage(
    messageIndex: number,
    userMessage: string,
    selectedFiles: string[],
    view: vscode.WebviewView | undefined
  ): Promise<void> {
    try {
      // Truncar la conversación hasta el mensaje editado
      this._chatManager.truncateConversationAtIndex(messageIndex);

      // Enviar el mensaje editado
      await this.sendToOllama(userMessage, selectedFiles, view);

      // Guardar la conversación actualizada
      await this._storage.saveChat(
        this._chatManager.getCurrentChatId(),
        this._chatManager.getCurrentMessages()
      );
    } catch (error) {
      console.error("Error editing message:", error);
      if (view) {
        view.webview.postMessage({
          type: "error",
          message: "Error al editar el mensaje",
        });
      }
    }
  }
}
