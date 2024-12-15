import * as vscode from "vscode";
import { AIChatViewProvider } from "./src/providers/AIChatViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new AIChatViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("aiChat.chatView", provider)
  );
}
