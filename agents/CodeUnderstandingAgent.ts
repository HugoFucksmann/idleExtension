import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as path from 'path';

export class CodeUnderstandingAgent {
  async analyzeCodeStructure(fileUri: vscode.Uri): Promise<CodeAnalysis> {
    try {
      // Read the file content
      const document = await vscode.workspace.openTextDocument(fileUri);
      const fileContent = document.getText();
      const fileName = path.basename(fileUri.fsPath);

      // Create source file using TypeScript compiler
      const sourceFile = ts.createSourceFile(
        fileName, 
        fileContent, 
        ts.ScriptTarget.Latest, 
        true
      );

      // Analyze the source file
      const analysis: CodeAnalysis = {
        fileName,
        fileType: this.getFileType(fileUri),
        imports: [],
        exports: [],
        classes: [],
        functions: [],
        interfaces: [],
        dependencies: []
      };

      // Traverse the AST
      this.traverseSourceFile(sourceFile, analysis);

      return analysis;
    } catch (error) {
      vscode.window.showErrorMessage(`Error analyzing code structure: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private traverseSourceFile(sourceFile: ts.SourceFile, analysis: CodeAnalysis): void {
    const visit = (node: ts.Node) => {
      // Analyze imports
      if (ts.isImportDeclaration(node)) {
        this.analyzeImport(node, analysis);
      }

      // Analyze exports
      if (ts.isExportDeclaration(node)) {
        this.analyzeExport(node, analysis);
      }

      // Analyze classes
      if (ts.isClassDeclaration(node)) {
        this.analyzeClass(node, analysis);
      }

      // Analyze functions
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        this.analyzeFunction(node, analysis);
      }

      // Analyze interfaces
      if (ts.isInterfaceDeclaration(node)) {
        this.analyzeInterface(node, analysis);
      }

      // Continue traversing
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private analyzeImport(node: ts.ImportDeclaration, analysis: CodeAnalysis): void {
    const moduleSpecifier = node.moduleSpecifier;
    if (ts.isStringLiteral(moduleSpecifier)) {
      analysis.imports.push({
        module: moduleSpecifier.text,
        namedImports: this.extractNamedImports(node)
      });
    }
  }

  private extractNamedImports(node: ts.ImportDeclaration): string[] {
    const importClause = node.importClause;
    if (importClause && ts.isImportClause(importClause)) {
      const namedBindings = importClause.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        return namedBindings.elements.map(elem => elem.name.getText());
      }
    }
    return [];
  }

  private analyzeExport(node: ts.ExportDeclaration, analysis: CodeAnalysis): void {
    const moduleSpecifier = node.moduleSpecifier;
    if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
      analysis.exports.push({
        module: moduleSpecifier.text,
        namedExports: this.extractNamedExports(node)
      });
    }
  }

  private extractNamedExports(node: ts.ExportDeclaration): string[] {
    const exportClause = node.exportClause;
    if (exportClause && ts.isNamedExports(exportClause)) {
      return exportClause.elements.map(elem => elem.name.getText());
    }
    return [];
  }

  private analyzeClass(node: ts.ClassDeclaration, analysis: CodeAnalysis): void {
    if (node.name) {
      analysis.classes.push({
        name: node.name.getText(),
        methods: this.extractClassMethods(node)
      });
    }
  }

  private extractClassMethods(node: ts.ClassDeclaration): string[] {
    return node.members
      .filter(member => ts.isMethodDeclaration(member))
      .map(method => (method as ts.MethodDeclaration).name.getText());
  }

  private analyzeFunction(node: ts.FunctionDeclaration | ts.ArrowFunction, analysis: CodeAnalysis): void {
    const functionName = ts.isFunctionDeclaration(node) && node.name 
      ? node.name.getText() 
      : 'Anonymous Function';
    
    analysis.functions.push({
      name: functionName,
      parameters: this.extractFunctionParameters(node)
    });
  }

  private extractFunctionParameters(node: ts.FunctionDeclaration | ts.ArrowFunction): string[] {
    return node.parameters.map(param => param.name.getText());
  }

  private analyzeInterface(node: ts.InterfaceDeclaration, analysis: CodeAnalysis): void {
    if (node.name) {
      analysis.interfaces.push({
        name: node.name.getText(),
        properties: this.extractInterfaceProperties(node)
      });
    }
  }

  private extractInterfaceProperties(node: ts.InterfaceDeclaration): string[] {
    return node.members
      .filter(member => ts.isPropertySignature(member))
      .map(prop => (prop as ts.PropertySignature).name.getText());
  }

  private getFileType(fileUri: vscode.Uri): string {
    const ext = path.extname(fileUri.fsPath).toLowerCase();
    const fileTypeMap: {[key: string]: string} = {
      '.ts': 'TypeScript',
      '.js': 'JavaScript',
      '.tsx': 'TypeScript React',
      '.jsx': 'JavaScript React',
      '.json': 'JSON',
      '.md': 'Markdown'
    };
    return fileTypeMap[ext] || 'Unknown';
  }
}

// Type definitions for code analysis
interface CodeAnalysis {
  fileName: string;
  fileType: string;
  imports: {
    module: string;
    namedImports: string[];
  }[];
  exports: {
    module: string;
    namedExports: string[];
  }[];
  classes: {
    name: string;
    methods: string[];
  }[];
  functions: {
    name: string;
    parameters: string[];
  }[];
  interfaces: {
    name: string;
    properties: string[];
  }[];
  dependencies: string[];
}

export { CodeAnalysis };