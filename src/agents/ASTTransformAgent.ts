/* import * as recast from "recast";
import * as parser from "recast/parsers/babel";
import { FileEditorAgent } from "./FileEditorAgent";
import { Options } from "recast/lib/options";

interface CodeDiff {
  type: "add" | "remove" | "unchanged";
  content: string;
  lineNumber: number;
}

export class ASTTransformAgent {
  constructor(private fileEditor: FileEditorAgent) {}

  async analyzeChanges(filePath: string, newCode: string): Promise<CodeDiff[]> {
    try {
      // Obtener el código actual del archivo
      const currentCode = await this.fileEditor.getFileContent(filePath);

      // Configuración del parser para soportar JSX/TSX
      const parseOptions = {
        parser: {
          ...parser,
          parse(source: string) {
            return parser.parse(source, {
              sourceType: "module",
              strictMode: false,
            });
          },
        },
      };

      // Parsear ambos códigos con recast usando el parser configurado
      const currentAST = recast.parse(currentCode, parseOptions);
      const newAST = recast.parse(newCode, parseOptions);

      // Generar el diff línea por línea
      const diffs = this.generateDiff(
        currentAST.program.body,
        newAST.program.body
      );

      return diffs;
    } catch (error) {
      console.error("Error analyzing AST changes:", error);
      throw error;
    }
  }

  private generateDiff(currentNodes: any[], newNodes: any[]): CodeDiff[] {
    const diffs: CodeDiff[] = [];

    try {
      // Corregimos los tipos de las opciones de impresión
      const printOptions: Options = {
        quote: "single" as const,
        tabWidth: 2,
        trailingComma: true as const,
      };

      const currentLines = currentNodes.map((node) =>
        recast.print(node, printOptions).code.trim()
      );
      const newLines = newNodes.map((node) =>
        recast.print(node, printOptions).code.trim()
      );

      // Algoritmo mejorado de diff
      let lineNumber = 1;
      const maxLength = Math.max(currentLines.length, newLines.length);

      for (let i = 0; i < maxLength; i++) {
        const currentLine = currentLines[i];
        const newLine = newLines[i];

        if (!currentLine && newLine) {
          diffs.push({
            type: "add",
            content: newLine,
            lineNumber: lineNumber++,
          });
        } else if (currentLine && !newLine) {
          diffs.push({
            type: "remove",
            content: currentLine,
            lineNumber: lineNumber++,
          });
        } else if (currentLine !== newLine) {
          if (currentLine) {
            diffs.push({
              type: "remove",
              content: currentLine,
              lineNumber: lineNumber++,
            });
          }
          if (newLine) {
            diffs.push({
              type: "add",
              content: newLine,
              lineNumber: lineNumber++,
            });
          }
        } else {
          diffs.push({
            type: "unchanged",
            content: currentLine,
            lineNumber: lineNumber++,
          });
        }
      }

      return diffs;
    } catch (error) {
      console.error("Error generating diff:", error);
      return [];
    }
  }
} */