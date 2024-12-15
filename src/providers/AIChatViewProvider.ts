import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";
import { AgenteDeInteraccion } from "../Agents/agenteDeInteraccion";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "aiChatSidebar";
  private _view?: vscode.WebviewView;
  private _ollamaService: OllamaService;
  private _agenteInteraccion: AgenteDeInteraccion;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    agenteInteraccion: AgenteDeInteraccion
  ) {
    this._ollamaService = new OllamaService(this._context);
    this._agenteInteraccion = agenteInteraccion;
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
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
      switch (data.type) {
        case "sendMessage":
          const response = await this._agenteInteraccion.recibirPrompt(
            data.message,
            []
          );
          if (response) {
            this._ollamaService.sendToOllama(response, this._view);
          }
          break;
        case "clearConversation":
          this._ollamaService.clearConversation();
          this._view?.webview.postMessage({ type: "conversationCleared" });
          break;
        case "closePanel":
          this._agenteInteraccion.ocultarPanel();
          break;
        case "loadHistory":
          this.loadHistory();
          break;
        case "loadChat":
          this.loadChat(data.chatId);
          break;
        case "showHistory":
          this.loadHistory();
          this._view?.webview.postMessage({ type: "showFullHistory" });
          break;
      }
    });

    console.log("AI Chat webview has been resolved!");
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
