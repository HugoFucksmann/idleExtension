import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";
import { FileEditorAgent } from "../agents/FileEditorAgent";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiChat.chatView";
  private _view?: vscode.WebviewView;
  private _ollamaService: OllamaService;

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
      this.handleMessage(data);
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "sendMessage":
        this._ollamaService.sendToOllama(
          message.message,
          message.selectedFiles || [],
          this._view
        );
        break;
      case "editMessage":
        this._ollamaService.editAndResendMessage(
          message.messageIndex,
          message.message,
          message.selectedFiles || [],
          this._view
        );
        break;
      case "clearConversation":
        this._ollamaService.clearConversation();
        this._view?.webview.postMessage({ type: "conversationCleared" });
        break;
      case "closePanel":
        vscode.commands.executeCommand("workbench.action.closeSidebar");
        break;
      case "loadHistory":
        this.loadHistory();
        break;
      case "loadChat":
        this.loadChat(message.chatId);
        break;
      case "showHistory":
        this.loadHistory();
        this._view?.webview.postMessage({ type: "showFullHistory" });
        break;
      case "getProjectFiles":
        this._ollamaService.getProjectFiles().then((files) => {
          this._view?.webview.postMessage({
            type: "projectFiles",
            files,
          });
        });
        break;
      case "applyChanges":
        const fileEditor = new FileEditorAgent();
        fileEditor.applyChanges(
          message.payload.filename,
          message.payload.content,
          false // Por ahora asumimos que es un reemplazo completo
        );
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

  private loadChat(chatId: string) {
    if (this._ollamaService.loadChat(chatId)) {
      const messages = this._ollamaService.getCurrentMessages();
      this._view?.webview.postMessage({
        type: "chatLoaded",
        messages,
      });
    }
  }
}
