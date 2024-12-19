import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";
import { FileEditorAgent } from "../agents/FileEditorAgent";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiChat.chatView";
  private _view?: vscode.WebviewView;
  private _ollamaService: OllamaService;
  private _currentPage: number = 0;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._ollamaService = new OllamaService(context);
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = getHtmlForWebview(
      webviewView.webview,
      this._extensionUri
    );

    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this.handleMessage(data);
    });
  }

  private async handleMessage(message: any) {
    switch (message.type) {
      case "sendMessage":
        await this._ollamaService.sendToOllama(
          message.message,
          message.selectedFiles || [],
          this._view
        );
        break;
      case "editMessage":
        await this._ollamaService.editAndResendMessage(
          message.messageIndex,
          message.message,
          message.selectedFiles || [],
          this._view
        );
        break;
      case "clearConversation":
        await this._ollamaService.clearConversation();
        this._view?.webview.postMessage({ type: "conversationCleared" });
        // Cargar el historial actualizado después de limpiar
        await this.loadHistory();
        break;
      case "closePanel":
        vscode.commands.executeCommand("workbench.action.closeSidebar");
        break;
      case "loadHistory":
        await this.loadHistory();
        break;
      case "loadChat":
        await this.loadChat(message.chatId);
        break;
      case "showHistory":
        await this.loadHistory();
        this._view?.webview.postMessage({ type: "showFullHistory" });
        break;
      case "getProjectFiles":
        const files = await this._ollamaService.getProjectFiles();
        this._view?.webview.postMessage({
          type: "projectFiles",
          files,
        });
        break;
      case "applyChanges":
        const fileEditor = new FileEditorAgent();
        await fileEditor.applyChanges(
          message.payload.filename,
          message.payload.content,
          false // Por ahora asumimos que es un reemplazo completo
        );
        break;
      case "loadMoreMessages":
        await this.loadMoreMessages(message.page || 0);
        break;
    }
  }

  private async loadHistory() {
    const history = await this._ollamaService.loadChatHistory();
    this._view?.webview.postMessage({
      type: "historyLoaded",
      history,
    });
  }

  private async loadChat(chatId: string) {
    try {
      const success = await this._ollamaService.loadChat(chatId);
      if (success) {
        // Resetear a la primera página cuando se carga un nuevo chat
        this._currentPage = 0;
        const messageData = await this._ollamaService.getCurrentMessages(this._currentPage);
        this._view?.webview.postMessage({
          type: "chatLoaded",
          messages: messageData.messages,
          totalPages: messageData.totalPages,
          currentPage: messageData.currentPage,
        });
      } else {
        this._view?.webview.postMessage({
          type: "error",
          message: "No se pudo cargar el chat. Por favor, intente de nuevo.",
        });
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      this._view?.webview.postMessage({
        type: "error",
        message: "Error al cargar el chat",
      });
    }
  }

  private async loadMoreMessages(page: number) {
    try {
      const messageData = await this._ollamaService.getCurrentMessages(page);
      this._currentPage = page;
      this._view?.webview.postMessage({
        type: "messagesLoaded",
        messages: messageData.messages,
        totalPages: messageData.totalPages,
        currentPage: messageData.currentPage,
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
      this._view?.webview.postMessage({
        type: "error",
        message: "Error al cargar más mensajes",
      });
    }
  }
}
