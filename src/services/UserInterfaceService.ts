import * as vscode from "vscode";

/**
 * Servicio que maneja la comunicación con el webview de React
 * enviando eventos y mensajes para actualizar la interfaz.
 */
export class UserInterfaceService {
  private _panel: vscode.WebviewPanel | undefined;
  private readonly _extensionContext: vscode.ExtensionContext;

  constructor(contexto: vscode.ExtensionContext) {
    this._extensionContext = contexto;
  }

  /**
   * Inicializa y muestra el panel de webview
   */
  inicializarPanel() {
    if (!this._panel) {
      this._panel = vscode.window.createWebviewPanel(
        "asistenteCodigo",
        "Asistente de Código",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });
    }
    this._panel.reveal();
  }

  /**
   * Envía mensaje de inicio de procesamiento de prompt
   */
  mostrarProcesandoPrompt(prompt: string) {
    this.enviarMensaje({
      type: "procesandoPrompt",
      prompt,
    });
  }

  /**
   * Envía mensaje de respuesta del modelo
   */
  mostrarRespuestaModelo(respuesta: string, metricas?: any) {
    this.enviarMensaje({
      type: "respuestaModelo",
      respuesta,
      metricas,
    });
  }

  /**
   * Envía mensaje de error
   */
  mostrarError(mensaje: string) {
    this.enviarMensaje({
      type: "error",
      mensaje,
    });
  }

  /**
   * Envía mensaje de estado de carga
   */
  mostrarEstadoCarga(cargando: boolean) {
    this.enviarMensaje({
      type: "estadoCarga",
      cargando,
    });
  }

  /**
   * Envía mensaje de actualización del historial
   */
  actualizarHistorial(mensajes: any[]) {
    this.enviarMensaje({
      type: "actualizarHistorial",
      mensajes,
    });
  }

  /**
   * Envía mensaje de contexto actual
   */
  actualizarContexto(contexto: any) {
    this.enviarMensaje({
      type: "actualizarContexto",
      contexto,
    });
  }

  /**
   * Envía notificación de archivos seleccionados
   */
  notificarArchivosSeleccionados(archivos: vscode.Uri[]) {
    this.enviarMensaje({
      type: "archivosSeleccionados",
      archivos: archivos.map((uri) => uri.fsPath),
    });
  }

  /**
   * Envía mensaje de progreso
   */
  actualizarProgreso(porcentaje: number, mensaje: string) {
    this.enviarMensaje({
      type: "progreso",
      porcentaje,
      mensaje,
    });
  }

  /**
   * Método privado para enviar mensajes al webview
   */
  private enviarMensaje(mensaje: any) {
    if (this._panel) {
      this._panel.webview.postMessage(mensaje);
    }
  }

  /**
   * Cierra el panel
   */
  cerrarPanel() {
    if (this._panel) {
      this._panel.dispose();
      this._panel = undefined;
    }
  }

  /**
   * Muestra mensajes nativos de VS Code cuando sea necesario
   */
  async mostrarMensajeNativo(
    mensaje: string,
    tipo: "info" | "warning" | "error" = "info"
  ): Promise<void> {
    switch (tipo) {
      case "error":
        await vscode.window.showErrorMessage(mensaje);
        break;
      case "warning":
        await vscode.window.showWarningMessage(mensaje);
        break;
      default:
        await vscode.window.showInformationMessage(mensaje);
    }
  }
}
