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

      this._chatManager.addMessage({
        role: "user",
        content: messageWithContext,
      });

      const response = await this._api.generateResponse(
        this._chatManager.formatConversation(),
        view
      );

      if (response) {
        this._chatManager.addMessage({ role: "assistant", content: response });
        await this._storage.saveChat(
          this._chatManager.getCurrentChatId(),
          this._chatManager.getCurrentMessages()
        );
      }
    } catch (error) {
      console.error("Error:", error);
      if (view) {
        view.webview.postMessage({
          type: "error",
          message:
            "Error al comunicarse con Ollama. Verifica que esté ejecutándose.",
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
        return true;
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
    return false;
  }

  clearConversation(): void {
    this._chatManager.clearConversation();
  }

  getCurrentMessages(): Message[] {
    return this._chatManager.getCurrentMessages();
  }

  async getProjectFiles(): Promise<string[]> {
    return await this._fileSystemAgent.getProjectFiles();
  }
}
