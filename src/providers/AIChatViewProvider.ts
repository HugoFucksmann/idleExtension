import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "aiChatSidebar";
  private _view?: vscode.WebviewView;
  private ollamaService: OllamaService;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.ollamaService = new OllamaService();
  }

  resolveWebviewView(
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
          await this.ollamaService.sendToOllama(data.message, this._view);
          break;
      }
    });

    console.log("AI Chat webview has been resolved!");
  }
}
