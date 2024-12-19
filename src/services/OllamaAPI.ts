import * as vscode from "vscode";
import { AppConfig } from "../config/AppConfig";
import { MessageBroker } from "./MessageBroker";

export class OllamaAPI {
  private _controller: AbortController | null = null;
  private _messageBroker: MessageBroker;

  constructor() {
    this._messageBroker = MessageBroker.getInstance();
  }

  async generateResponse(prompt: string): Promise<string> {
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
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            currentChunk += data.response;

            if (currentChunk.length >= AppConfig.chat.chunkSize) {
              buffer += currentChunk;
              await this._messageBroker.sendResponse(currentChunk, false);
              currentChunk = '';
            }
          } catch (error) {
            console.error("Error parsing JSON response:", error);
            if (error instanceof Error) {
              await this._messageBroker.sendError(
                error.message,
                "OLLAMA_RESPONSE_ERROR",
                error
              );
            }
            continue;
          }
        }
      }

      if (currentChunk.length > 0) {
        buffer += currentChunk;
        await this._messageBroker.sendResponse(currentChunk, true);
      }

      return buffer;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Request aborted:", error.message);
          await this._messageBroker.sendError(
            "La solicitud fue cancelada",
            "REQUEST_ABORTED",
            error
          );
          return "";
        }
        console.error("Error in generateResponse:", error);
        await this._messageBroker.sendError(
          error.message,
          "OLLAMA_API_ERROR",
          error
        );
      } else {
        await this._messageBroker.sendError(
          "Error desconocido al generar respuesta",
          "UNKNOWN_ERROR",
          error
        );
      }
      return "";
    } finally {
      clearTimeout(timeoutId);
      if (this._controller) {
        this._controller.abort();
        this._controller = null;
      }
    }
  }
}