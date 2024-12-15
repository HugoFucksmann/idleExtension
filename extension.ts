import * as vscode from "vscode";
import { AIChatViewProvider } from "./src/providers/AIChatViewProvider";
import { OllamaService } from "./src/services/OllamaService";
import { UserInterfaceService } from "./src/services/UserInterfaceService";
import { AgenteDeInteraccion } from "./src/Agents/agenteDeInteraccion";

export function activate(context: vscode.ExtensionContext) {
  // Inicializar servicios
  const ollamaService = new OllamaService(context);
  const uiService = new UserInterfaceService(context);

  // Inicializar agente de interacción
  const agenteInteraccion = new AgenteDeInteraccion(ollamaService, uiService);

  // Inicializar provider con las dependencias
  const provider = new AIChatViewProvider(
    context.extensionUri,
    context,
    agenteInteraccion // Pasar el agente al provider
  );

  // Registrar el provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIChatViewProvider.viewType,
      provider
    )
  );

  // Registrar comandos si son necesarios
  context.subscriptions.push(
    vscode.commands.registerCommand("aiChat.iniciarChat", () => {
      agenteInteraccion.mostrarPanel();
    }),
    vscode.commands.registerCommand("aiChat.cerrarChat", () => {
      agenteInteraccion.ocultarPanel();
    })
  );
}
