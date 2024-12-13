import { spawn, ChildProcess } from "child_process";
import * as vscode from "vscode";

export class OllamaService {
  private _currentProcess: ChildProcess | null = null;

  async sendToOllama(
    userMessage: string,
    view: vscode.WebviewView | undefined
  ): Promise<void> {
    if (this._currentProcess) {
      this._currentProcess.kill();
    }

    this._currentProcess = spawn("ollama", ["run", "qwen2.5-coder:7b"], {
      shell: true,
    });

    let buffer = "";

    try {
      if (!this._currentProcess?.stdin) {
        throw new Error("No se pudo iniciar el proceso de Ollama");
      }

      this._currentProcess.stdin.write(userMessage + "\n");
      this._currentProcess.stdin.end();

      this._currentProcess.stdout?.on("data", (data) => {
        const text = data.toString();
        buffer += text;
      });

      this._currentProcess.on("close", (code) => {
        console.log(`Ollama finalizó con código ${code}`);

        if (code === 0 && view) {
          view.webview.postMessage({
            type: "response",
            message: buffer,
          });
        } else if (view) {
          view.webview.postMessage({
            type: "error",
            message:
              "El modelo no pudo procesar el mensaje. Intenta nuevamente más tarde.",
          });
        }

        this._currentProcess = null;
      });

      this._currentProcess.stderr?.on("data", (data) => {
        console.error(`Ollama stderr: ${data}`);
      });

      this._currentProcess.on("error", (error) => {
        console.error("Error al iniciar Ollama:", error);
        if (view) {
          view.webview.postMessage({
            type: "error",
            message: "Error al iniciar Ollama. Verifica que esté instalado.",
          });
        }
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      if (view) {
        view.webview.postMessage({
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
}
