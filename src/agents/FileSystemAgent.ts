import * as vscode from "vscode";
import * as path from "path";

export class FileSystemAgent {
  constructor(
    private workspaceRoot: string | undefined = vscode.workspace
      .workspaceFolders?.[0].uri.fsPath
  ) {}

  async getProjectFiles(): Promise<string[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    const files: string[] = [];

    const getFiles = async (dirPath: string) => {
      const entries = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(dirPath)
      );

      for (const [name, type] of entries) {
        const fullPath = path.join(dirPath, name);

        // Ignorar carpetas node_modules y .git
        if (name === "node_modules" || name === ".git") {
          continue;
        }

        if (type === vscode.FileType.Directory) {
          await getFiles(fullPath);
        } else {
          // Convertir path absoluto a relativo
          const relativePath = path.relative(this.workspaceRoot!, fullPath);
          files.push(relativePath);
        }
      }
    };

    await getFiles(this.workspaceRoot);
    return files;
  }
}
