import * as vscode from "vscode";
import { OllamaService } from "../services/OllamaService";
import { UserInterfaceService } from "../services/UserInterfaceService";

/**
 * Adaptador para OllamaService que implementa OllamaCommunicationAgent
 */
export class OllamaServiceAdapter implements OllamaCommunicationAgent {
  private _ollamaService: OllamaService;
  private _view: vscode.WebviewView | undefined;

  constructor(ollamaService: OllamaService) {
    this._ollamaService = ollamaService;
  }

  setView(view: vscode.WebviewView): void {
    this._view = view;
  }

  async enviarPrompt(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let respuestaCompleta = "";
      let timeoutId: NodeJS.Timeout;

      const tempView = {
        webview: {
          postMessage: (message: {
            type: string;
            message?: string;
            done?: boolean;
            error?: string;
          }) => {
            if (message.type === "response" && message.message) {
              respuestaCompleta += message.message;

              if (message.done) {
                clearTimeout(timeoutId);
                resolve(respuestaCompleta);
                return;
              }
            } else if (message.type === "error") {
              clearTimeout(timeoutId);
              reject(new Error(message.error || "Error desconocido"));
              return;
            }

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              reject(new Error("Timeout esperando respuesta de Ollama"));
            }, 30000);
          },
        },
      } as vscode.WebviewView;

      timeoutId = setTimeout(() => {
        reject(new Error("Timeout inicial esperando respuesta de Ollama"));
      }, 30000);

      this._ollamaService
        .sendToOllama(prompt, this._view || tempView)
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
}

/**
 * Interface para el agente de comunicación con Ollama
 */
interface OllamaCommunicationAgent {
  enviarPrompt(prompt: string): Promise<string>;

  setView?(view: vscode.WebviewView): void;
}

/**
 * Clase que maneja la interacción entre el usuario y la extensión de VS Code.
 * Gestiona la validación y mejora de prompts, y la generación de contexto inicial.
 */
export class AgenteDeInteraccion {
  private _agenteComunicacionOllama: OllamaCommunicationAgent;
  private _uiService: UserInterfaceService;

  /**
   * Constructor del Agente de Interacción
   * @param ollamaService - Instancia del servicio de Ollama
   * @param uiService - Instancia del servicio de interfaz de usuario
   */
  constructor(ollamaService: OllamaService, uiService: UserInterfaceService) {
    this._agenteComunicacionOllama = new OllamaServiceAdapter(ollamaService);
    this._uiService = uiService;
  }

  /**
   * Procesa y valida el prompt del usuario
   * @param prompt - El prompt original del usuario
   * @param archivosAdjuntos - Array de URIs de archivos adjuntos
   * @returns El prompt validado y mejorado, o null si hay errores
   */
  async recibirPrompt(
    prompt: string,
    archivosAdjuntos: vscode.Uri[]
  ): Promise<string | null> {
    try {
      this._uiService.mostrarEstadoCarga(true);

      const prePromptValidacion = `
        Evalúa el siguiente prompt del usuario para una herramienta de asistencia de código con IA 
        y determina si es claro, completo y no ambiguo. Si encuentras algún problema, 
        sugiere mejoras o pide aclaraciones al usuario.

        Prompt del usuario: ${prompt}

        Respuesta:
      `.trim();

      const resultadoValidacion =
        await this._agenteComunicacionOllama.enviarPrompt(prePromptValidacion);

      if (
        resultadoValidacion.toLowerCase().includes("problema") ||
        resultadoValidacion.toLowerCase().includes("aclaración") ||
        resultadoValidacion.toLowerCase().includes("mejorar")
      ) {
        this._uiService.mostrarError(resultadoValidacion);
        return null;
      }

      const prePromptContexto = `
        Genera un breve contexto inicial (máximo 50 palabras) que sirva como punto de partida 
        para una conversación con un modelo de lenguaje sobre la siguiente tarea de asistencia de código:

        Tarea: ${prompt}

        Contexto inicial:
      `.trim();

      const contextoInicial = await this._agenteComunicacionOllama.enviarPrompt(
        prePromptContexto
      );

      if (archivosAdjuntos.length > 0) {
        this._uiService.notificarArchivosSeleccionados(archivosAdjuntos);
      }

      this._uiService.actualizarContexto({
        prompt: prompt,
        contextoInicial: contextoInicial,
      });

      return `${contextoInicial}\n\n${prompt}`;
    } catch (error) {
      this._uiService.mostrarError(
        `Error al procesar el prompt: ${(error as Error).message}`
      );
      return null;
    } finally {
      this._uiService.mostrarEstadoCarga(false);
    }
  }

  /**
   * Muestra un mensaje al usuario
   * @param mensaje - El mensaje a mostrar
   */
  mostrarMensaje(mensaje: string): void {
    this._uiService.mostrarMensajeNativo(mensaje);
  }

  /**
   * Muestra el panel de la extensión
   */
  mostrarPanel(): void {
    this._uiService.inicializarPanel();
  }

  /**
   * Oculta el panel de la extensión
   */
  ocultarPanel(): void {
    this._uiService.cerrarPanel();
  }
}
