import * as vscode from "vscode";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";

export function activate(context: vscode.ExtensionContext) {
  const provider = new AIChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIChatViewProvider.viewType,
      provider
    )
  );

  console.log("AI Chat extension is now active!");
}

class AIChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "aiChatSidebar";
  private _view?: vscode.WebviewView;
  private _currentProcess: ChildProcess | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      async (data: { type: string; message: string }) => {
        switch (data.type) {
          case "sendMessage":
            await this.sendToOllama(data.message);
            break;
        }
      }
    );

    console.log("AI Chat webview has been resolved!");
  }

  async sendToOllama(userMessage: string): Promise<void> {
    if (this._currentProcess) {
      this._currentProcess.kill();
    }

    this._currentProcess = spawn("ollama", ["run", "qwen2.5-coder:7b"], {
      shell: true,
    });

    let buffer = "";

    try {
      this._currentProcess.stdin.write(userMessage + "\n");
      this._currentProcess.stdin.end();

      this._currentProcess.stdout.on("data", (data: Buffer) => {
        const text = data.toString();
        buffer += text;
      });

      this._currentProcess.on("close", (code: number | null) => {
        console.log(`Ollama finalizó con código ${code}`);

        if (code === 0 && this._view) {
          this._view.webview.postMessage({
            type: "response",
            message: buffer,
          });
        } else if (this._view) {
          this._view.webview.postMessage({
            type: "error",
            message:
              "El modelo no pudo procesar el mensaje. Intenta nuevamente más tarde.",
          });
        }

        this._currentProcess = null;
      });

      this._currentProcess.stderr.on("data", (data: Buffer) => {
        console.error(`Ollama stderr: ${data}`);
      });

      this._currentProcess.on("error", (error: Error) => {
        console.error("Error al iniciar Ollama:", error);
        if (this._view) {
          this._view.webview.postMessage({
            type: "error",
            message: "Error al iniciar Ollama. Verifica que esté instalado.",
          });
        }
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      if (this._view) {
        this._view.webview.postMessage({
          type: "error",
          message: "Ocurrió un error inesperado. Intenta más tarde.",
        });
      }

      if (this._currentProcess) {
        this._currentProcess.kill();
        this._currentProcess = null;
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview.js")
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Chat</title>
          <script src="${scriptUri}"></script>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `;
  }
}
