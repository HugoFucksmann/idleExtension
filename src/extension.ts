import * as vscode from "vscode";
import { AIChatViewProvider } from "./providers/AIChatViewProvider";

export function activate(context: vscode.ExtensionContext) {
  try {
    const provider = new AIChatViewProvider(context.extensionUri, context);
    
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("aiChat.chatView", provider)
    );
    
   
  } catch (error: any) {
    console.error('Error activating AI Chat Extension:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    vscode.window.showErrorMessage(`AI Chat Extension activation failed: ${errorMessage}`);
  }
}

export function deactivate() {}
