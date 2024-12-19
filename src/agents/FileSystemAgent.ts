import * as vscode from "vscode";
import * as path from "path";

export class FileSystemAgent {
  constructor(
    private workspaceRoot: string | undefined = vscode.workspace
      .workspaceFolders?.[0].uri.fsPath
  ) {}

  async getProjectFiles(): Promise<string[]> {
    console.log("[FileSystemAgent] Starting getProjectFiles");
    console.log("[FileSystemAgent] Workspace root:", this.workspaceRoot);

    if (!this.workspaceRoot) {
      console.log("[FileSystemAgent] No workspace root found");
      return [];
    }

    const files: string[] = [];

    const getFiles = async (dirPath: string) => {
      console.log("[FileSystemAgent] Scanning directory:", dirPath);
      const entries = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(dirPath)
      );

      for (const [name, type] of entries) {
        const fullPath = path.join(dirPath, name);

        // Ignorar carpetas node_modules y .git
        if (name === "node_modules" || name === ".git"|| name === "build" || name === "dist" || name === "out") {
          console.log("[FileSystemAgent] Skipping directory:", name);
          continue;
        }

        if (type === vscode.FileType.Directory) {
          await getFiles(fullPath);
        } else {
          // Convertir path absoluto a relativo
          const relativePath = path.relative(this.workspaceRoot!, fullPath);
          files.push(relativePath);
          console.log("[FileSystemAgent] Added file:", relativePath);
        }
      }
    };

    await getFiles(this.workspaceRoot);
    console.log("[FileSystemAgent] Total files found:", files.length);
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
    if (!selectedFiles.length) {
      return message;
    }

    try {
      const filesContent = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await this.getFileContent(file);
          // Escapar los backticks en el contenido
          const escapedContent = content.replace(/`/g, '\\`');
          // Obtener la extensión del archivo
          const ext = path.extname(file).slice(1);
          return `File: ${file}\n\`\`\`${ext}\n${escapedContent}\n\`\`\`\n`;
        })
      );

      return `${message}\n\nContext Files:\n${filesContent.join("\n")}`;
    } catch (error) {
      console.error("Error preparing message with context:", error);
      return message;
    }
  }
}
