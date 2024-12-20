import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";
import { FileEditorAgent } from "../agents/FileEditorAgent";
import { MessageBroker } from "../services/MessageBroker";
import { MessageType } from "../types/types";
import { OllamaAPI } from '../services/OllamaAPI';
import { GeminiAPI } from '../services/GeminiAPI';

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiChat.chatView";
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _ollamaService: OllamaService;
  private _messageBroker: MessageBroker;
  private _ollamaAPI: OllamaAPI;
  private _geminiAPI: GeminiAPI;

  constructor(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._extensionUri = extensionUri;
    this._ollamaService = new OllamaService(context);
    this._messageBroker = MessageBroker.getInstance();
    this._ollamaAPI = new OllamaAPI();
    this._geminiAPI = new GeminiAPI();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Manejar mensajes enviados
    this._messageBroker.subscribe(MessageType.SEND_MESSAGE, async (payload) => {
      await this._ollamaService.sendToOllama(
        payload.message,
        payload.selectedFiles,
        this._view
      );
    });

    // Manejar carga de chat
    this._messageBroker.subscribe(MessageType.LOAD_CHAT, async (payload) => {
      await this._ollamaService.loadChat(payload.chatId);
    });

    // Manejar carga de historial
    this._messageBroker.subscribe(MessageType.LOAD_HISTORY, async () => {
      await this._ollamaService.loadChatHistory();
    });

    // Manejar limpieza de conversación
    this._messageBroker.subscribe(MessageType.CLEAR_CONVERSATION, async () => {
      this._ollamaService.clearConversation();
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext
  ) {
    this._view = webviewView;
    this._messageBroker.setView(webviewView);

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = getHtmlForWebview(
      webviewView.webview,
      this._extensionUri
    );

    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this.handleMessage(data);
    });
  }

  private async handleMessage(message: any) {
    try {
      console.log('Received message in provider:', message);

      if (message.command === 'sendMessage') {
        console.log('AIChatViewProvider: Processing sendMessage command with model:', message.model);
        const messageWithContext = await this._ollamaService.prepareMessageWithContext(
          message.text,
          message.attachedFiles || []
        );

        // Guardar el mensaje del usuario
        await this._ollamaService.saveUserMessage(messageWithContext);

        // Generar y guardar la respuesta
        const api = message.model === 'gemini' ? this._geminiAPI : this._ollamaAPI;
        try {
          const response = await api.generateResponse(messageWithContext);
          console.log('AIChatViewProvider: Got response from model');
          
          // Guardar la respuesta del asistente
          await this._ollamaService.saveAssistantMessage(response);
          
          // Enviar la respuesta al webview
          this._view?.webview.postMessage({
            type: 'response',
            content: response
          });
        } catch (error: any) {
          console.error('AIChatViewProvider: Error generating response:', error);
          vscode.window.showErrorMessage(`Error: ${error.message}`);
          this._view?.webview.postMessage({
            type: 'error',
            content: error.message
          });
        }
        return;
      }

      switch (message.type) {
        case MessageType.SEND_MESSAGE:
          await this._messageBroker.emit(MessageType.SEND_MESSAGE, {
            message: message.message,
            selectedFiles: message.selectedFiles || []
          });
          break;

        case MessageType.LOAD_CHAT:
          await this._messageBroker.emit(MessageType.LOAD_CHAT, {
            chatId: message.chatId
          });
          break;

        case MessageType.LOAD_HISTORY:
          await this._messageBroker.emit(MessageType.LOAD_HISTORY, {});
          break;

        case MessageType.CLEAR_CONVERSATION:
          await this._messageBroker.emit(MessageType.CLEAR_CONVERSATION, {});
          break;

        case "closePanel":
          vscode.commands.executeCommand("workbench.action.closeSidebar");
          break;

        case "applyChanges":
          const fileEditor = new FileEditorAgent();
          await fileEditor.applyChanges(
            message.payload.filename,
            message.payload.content,
            false
          );
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      await this._messageBroker.sendError(
        "Error procesando el mensaje",
        "MESSAGE_HANDLING_ERROR",
        error
      );
    }
  }
}
