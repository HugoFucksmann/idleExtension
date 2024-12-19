import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { getHtmlForWebview } from "../utils/webviewUtils";
import { FileEditorAgent } from "../agents/FileEditorAgent";
import { MessageBroker } from "../services/MessageBroker";
import { MessageType } from "../types/types";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiChat.chatView";
  private _view?: vscode.WebviewView;
  private _ollamaService: OllamaService;
  private _messageBroker: MessageBroker;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._ollamaService = new OllamaService(context);
    this._messageBroker = MessageBroker.getInstance();
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
      console.log('Received message in provider:', message); // Debug log

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
