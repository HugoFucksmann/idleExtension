import * as vscode from "vscode";
import * as path from "path";

export class FileSystemAgent {
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private fileCache: Map<string, { content: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB para lectura parcial

  constructor(
    private workspaceRoot: string | undefined = vscode.workspace
      .workspaceFolders?.[0].uri.fsPath
  ) {
    this.initializeFileWatcher();
  }

  private initializeFileWatcher() {
    if (!this.workspaceRoot) return;

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.workspaceRoot, "**/*")
    );

    this.fileWatcher.onDidChange((uri) => {
      const filePath = uri.fsPath;
      this.fileCache.delete(filePath);
    });

    this.fileWatcher.onDidDelete((uri) => {
      const filePath = uri.fsPath;
      this.fileCache.delete(filePath);
    });
  }

  async getProjectFiles(): Promise<string[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    const files: string[] = [];
    const processedDirs = new Set<string>();

    const getFiles = async (dirPath: string) => {
      if (processedDirs.has(dirPath)) return;
      processedDirs.add(dirPath);

      try {
        const entries = await vscode.workspace.fs.readDirectory(
          vscode.Uri.file(dirPath)
        );

        for (const [name, type] of entries) {
          const fullPath = path.join(dirPath, name);

          if (this.shouldIgnoreFile(name)) {
            continue;
          }

          if (type === vscode.FileType.Directory) {
            await getFiles(fullPath);
          } else {
            const relativePath = path.relative(this.workspaceRoot!, fullPath);
            files.push(relativePath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    };

    await getFiles(this.workspaceRoot);
    return files;
  }

  private shouldIgnoreFile(name: string): boolean {
    const ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'out'];
    return ignoreDirs.includes(name);
  }

  async getFileContent(filePath: string): Promise<string> {
    if (!this.workspaceRoot) {
      return "";
    }

    const fullPath = path.join(this.workspaceRoot, filePath);
    const fileUri = vscode.Uri.file(fullPath);

    // Verificar caché
    const cached = this.fileCache.get(fullPath);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.content;
    }

    try {
      const stat = await vscode.workspace.fs.stat(fileUri);
      
      // Si el archivo es muy grande, leer solo una parte
      if (stat.size > this.MAX_FILE_SIZE) {
        const partialContent = await this.readPartialFile(fileUri, this.MAX_FILE_SIZE);
        this.fileCache.set(fullPath, {
          content: partialContent,
          timestamp: Date.now(),
        });
        return partialContent;
      }

      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString("utf8");
      
      // Guardar en caché
      this.fileCache.set(fullPath, {
        content,
        timestamp: Date.now(),
      });
      
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return "";
    }
  }

  private async readPartialFile(
    fileUri: vscode.Uri,
    maxSize: number
  ): Promise<string> {
    try {
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent.slice(0, maxSize)).toString("utf8");
      return `${content}\n... (File truncated due to size)`;
    } catch (error) {
      console.error(`Error reading partial file:`, error);
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
          const escapedContent = content.replace(/`/g, '\\`');
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

  dispose() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    this.fileCache.clear();
  }
}
