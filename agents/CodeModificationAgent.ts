import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as path from 'path';
import { StructuralCodeAnalyzer, SafeCodeTransformer, CodeModification, ValidationResult } from './CodeTransformAgents';

export class CodeModificationAgent {
  private context: vscode.ExtensionContext;
  private structuralAnalyzer: StructuralCodeAnalyzer;
  private codeTransformer: SafeCodeTransformer;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.structuralAnalyzer = new StructuralCodeAnalyzer();
    this.codeTransformer = new SafeCodeTransformer();
  }

  async modifyCode(fileUri: vscode.Uri, modifications: CodeModification[]): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(fileUri);
      let fileContent = document.getText();

      const structure = this.structuralAnalyzer.analyzeCodeStructure(fileContent, 'typescript');
      const validation = this.structuralAnalyzer.validateModification(structure, modifications);

      if (validation.isValid) {
        const updatedContent = this.codeTransformer.transform(fileContent, modifications, 'typescript').code;
        await this.writeToFile(fileUri, updatedContent, document);
      } else {
        throw new Error(validation.errors.join('\n'));
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error modifying code: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async writeToFile(fileUri: vscode.Uri, content: string, document: vscode.TextDocument): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      fileUri, 
      new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end), 
      content
    );
    await vscode.workspace.applyEdit(edit);
    await document.save();
  }
}
