import * as vscode from "vscode";
import { AIChatViewProvider } from "./src/providers/AIChatViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new AIChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIChatViewProvider.viewType,
      provider
    )
  );
}
