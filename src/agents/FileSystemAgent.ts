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

  async getFileContent(filePath: string): Promise<string> {
    if (!this.workspaceRoot) {
      return "";
    }

    const fullPath = path.join(this.workspaceRoot, filePath);
    const fileUri = vscode.Uri.file(fullPath);

    try {
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      return Buffer.from(fileContent).toString("utf8");
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return "";
    }
  }

  async prepareMessageWithContext(
    message: string,
    selectedFiles: string[] = []
  ): Promise<string> {
    // Si no hay archivos seleccionados, retornar el mensaje original
    if (!selectedFiles.length) {
      return message;
    }

    try {
      // Obtener el contenido de los archivos seleccionados
      const filesContent = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await this.getFileContent(file);
          return `File: ${file}\n\`\`\`\n${content}\n\`\`\`\n`;
        })
      );

      // Combinar el mensaje del usuario con el contenido de los archivos
      return `${message}\n\nContext Files:\n${filesContent.join("\n")}`;
    } catch (error) {
      console.error("Error preparing message with context:", error);
      return message; // En caso de error, retornar el mensaje original
    }
  }
}
