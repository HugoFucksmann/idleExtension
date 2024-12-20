import * as vscode from "vscode";
import { AppConfig } from "../config/AppConfig";
import { MessageBroker } from "./MessageBroker";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiAPI {
  private _controller: AbortController | null = null;
  private _messageBroker: MessageBroker;
  private _genAI: any;
  private _model: any;

  constructor() {
    this._messageBroker = MessageBroker.getInstance();
    const configApiKey = vscode.workspace.getConfiguration().get("idleExtension.geminiApiKey") as string;
    const apiKey = configApiKey || "AIzaSyDQm29NcL0tXzKsATv5nr-PuoYtDoNXVT8";
    
    this._genAI = new GoogleGenerativeAI(apiKey);
    this._model = this._genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
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
      const result = await this._model.generateContent(prompt);
      const response = result.response.text();

      clearTimeout(timeoutId);
      if (this._controller) {
        this._controller = null;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (this._controller) {
        this._controller = null;
      }
      
      if (error.name === "AbortError") {
        throw new Error("Request aborted");
      }
      throw new Error(`Error generating response: ${error.message}`);
    }
  }

  abortRequest() {
    if (this._controller) {
      this._controller.abort();
      this._controller = null;
    }
  }
}
