import * as vscode from "vscode";
export class OllamaAPI {
  private _controller: AbortController | null = null;

  async generateResponse(
    prompt: string,
    view: vscode.WebviewView | undefined
  ): Promise<string> {
    if (this._controller) {
      this._controller.abort();
    }

    this._controller = new AbortController();
    const signal = this._controller.signal;
    let buffer = "";

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5-coder:7b",
          prompt,
          stream: true,
        }, (key, value) => {
          // Asegurar que los valores string estén correctamente escapados
          if (typeof value === 'string') {
            return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          }
          return value;
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Error en la respuesta: ${response.statusText}`);
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            buffer += data.response;

            if (view) {
              view.webview.postMessage({
                type: "response",
                message: buffer,
                done: data.done,
              });
            }
          } catch (error) {
            console.error("Error parsing JSON response:", error);
            continue;
          }
        }
      }

      return buffer;
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== "AbortError") {
        throw error;
      }
      return "";
    } finally {
      this._controller = null;
    }
  }
}