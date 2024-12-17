import * as vscode from "vscode";
import * as path from "path";

export class FileEditorAgent {
  constructor(
    private workspaceRoot: string | undefined = vscode.workspace
      .workspaceFolders?.[0].uri.fsPath
  ) {}

  async applyChanges(
    filePath: string,
    newContent: string,
    isPartialChange: boolean = false
  ): Promise<boolean> {
    if (!this.workspaceRoot) {
      return false;
    }

    try {
      const fullPath = path.join(this.workspaceRoot, filePath);
      const fileUri = vscode.Uri.file(fullPath);

      if (isPartialChange) {
        // Leer el contenido actual del archivo
        const currentContent = await vscode.workspace.fs.readFile(fileUri);
        const currentText = Buffer.from(currentContent).toString("utf8");

        // Aquí implementaremos la lógica para fusionar los cambios
        const updatedContent = this.mergeChanges(currentText, newContent);
        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(updatedContent, "utf8")
        );
      } else {
        // Reemplazar el archivo completo
        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(newContent, "utf8")
        );
      }

      // Mostrar mensaje de éxito
      vscode.window.showInformationMessage(`Cambios aplicados en ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error applying changes to ${filePath}:`, error);
      vscode.window.showErrorMessage(`Error al aplicar cambios en ${filePath}`);
      return false;
    }
  }

  private mergeChanges(currentContent: string, newContent: string): string {
    // Por ahora, una implementación simple que reemplaza todo
    // Aquí podríamos implementar una lógica más sofisticada para detectar y aplicar cambios parciales
    return newContent;
  }
}
