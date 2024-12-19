import * as vscode from "vscode";
import { AppConfig } from "../config/AppConfig";

export class OllamaAPI {
  private _controller: AbortController | null = null;

  async generateResponse(
    prompt: string,
    view: vscode.WebviewView  | undefined
  ): Promise<string> {
    if (this._controller) {
      this._controller.abort();
    }

    this._controller = new AbortController();
    const signal = this._controller.signal;
    const timeoutId = setTimeout(() => {
      if (this._controller) {
        this._controller.abort();
      }
    }, AppConfig.chat.timeoutMs);

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5-coder:7b",
          prompt,
          stream: true,
        }, (key, value) => {
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
      let buffer = '';
      let currentChunk = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            currentChunk += data.response;

            if (currentChunk.length >= AppConfig.chat.chunkSize) {
              buffer += currentChunk;
              if (view) {
                view.webview.postMessage({
                  type: "response",
                  message: buffer,
                  done: false,
                });
              }
              currentChunk = '';
            }
          } catch (error) {
            console.error("Error parsing JSON response:", error);
            continue;
          }
        }
      }

      if (currentChunk.length > 0) {
        buffer += currentChunk;
        if (view) {
          view.webview.postMessage({
            type: "response",
            message: buffer,
            done: true,
          });
        }
      }

      return buffer;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Request aborted:", error.message);
          return "";
        }
        console.error("Error in generateResponse:", error);
        throw error;
      }
      return "";
    } finally {
      clearTimeout(timeoutId);
      this._controller = null;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries exceeded");
  }
}