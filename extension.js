const vscode = require("vscode");
const path = require("path");
const { spawn } = require("child_process");

function activate(context) {
  const provider = new AIChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIChatViewProvider.viewType,
      provider
    )
  );

  console.log("AI Chat extension is now active!");
}

class AIChatViewProvider {
  static viewType = "aiChatSidebar";

  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    this._currentProcess = null;
  }

  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "sendMessage":
          await this.sendToOllama(data.message);
          break;
      }
    });

    console.log("AI Chat webview has been resolved!");
  }

  async sendToOllama(userMessage) {
    // Termina cualquier proceso existente antes de iniciar uno nuevo
    if (this._currentProcess) {
      this._currentProcess.kill();
    }

    // Inicia un nuevo proceso
    this._currentProcess = spawn("ollama", ["run", "qwen2.5-coder:7b"], {
      shell: true,
    });

    let fullResponse = ""; // Almacena la respuesta completa
    let buffer = ""; // Almacena datos parciales

    try {
      this._currentProcess.stdin.write(userMessage + "\n");
      this._currentProcess.stdin.end();

      // Maneja la salida estándar
      this._currentProcess.stdout.on("data", (data) => {
        const text = data.toString();
        buffer += text;

        // Procesa líneas completas
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // La última línea puede estar incompleta

        if (lines.length > 0) {
          fullResponse += lines.join("\n") + "\n";
          this._view.webview.postMessage({
            type: "response",
            message: fullResponse,
          });
        }
      });

      // Maneja errores del proceso
      this._currentProcess.stderr.on("data", (data) => {
        console.error(`Ollama stderr: ${data}`);
      });

      // Maneja errores al iniciar el proceso
      this._currentProcess.on("error", (error) => {
        console.error("Error al iniciar Ollama:", error);
        this._view.webview.postMessage({
          type: "error",
          message: "Error al iniciar Ollama. Verifica que esté instalado.",
        });
      });

      // Maneja el cierre del proceso
      this._currentProcess.on("close", (code) => {
        console.log(`Ollama finalizó con código ${code}`);
        if (buffer) {
          fullResponse += buffer; // Agrega cualquier dato restante
        }

        if (code !== 0) {
          this._view.webview.postMessage({
            type: "error",
            message:
              "El modelo no pudo procesar el mensaje. Intenta nuevamente más tarde.",
          });
        } else {
          this._view.webview.postMessage({
            type: "response",
            message: fullResponse,
          });
        }

        this._currentProcess = null;
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      this._view.webview.postMessage({
        type: "error",
        message: "Ocurrió un error inesperado. Intenta más tarde.",
      });

      // Asegúrate de finalizar el proceso si ocurre un error
      if (this._currentProcess) {
        this._currentProcess.kill();
        this._currentProcess = null;
      }
    }
  }

  _getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview.js")
    );

    return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>AI Chat</title>
              <style>
                  body {
                      padding: 0;
                      margin: 0;
                      font-family: var(--vscode-font-family);
                      font-size: var(--vscode-font-size);
                  }
              </style>
          </head>
          <body>
              <div id="root"></div>
              <script src="${scriptUri}"></script>
          </body>
          </html>
        `;
  }
}

module.exports = {
  activate,
};
