import * as vscode from 'vscode';
import { CodeUnderstandingAgent, CodeAnalysis } from './CodeUnderstandingAgent';
import { OllamaIntegrationAgent } from './OllamaIntegrationAgent';
import { FileInfo } from './FileAnalysisAgent';
import { StructuralCodeAnalyzer, SafeCodeTransformer } from './CodeTransformAgents';

export class CodeContextAgent {
  private codeUnderstandingAgent: CodeUnderstandingAgent;
  private ollamaAgent: OllamaIntegrationAgent;
  private structuralAnalyzer: StructuralCodeAnalyzer;
  private codeTransformer: SafeCodeTransformer;

  constructor(
    codeUnderstandingAgent: CodeUnderstandingAgent,
    ollamaAgent: OllamaIntegrationAgent
  ) {
    this.codeUnderstandingAgent = codeUnderstandingAgent;
    this.ollamaAgent = ollamaAgent;
    this.structuralAnalyzer = new StructuralCodeAnalyzer();
    this.codeTransformer = new SafeCodeTransformer();
  }

  async extractRelevantCodeContext(
    files: FileInfo[], 
    userPrompt: string
  ): Promise<CodeContextResult[]> {
    const contextResults: CodeContextResult[] = [];

    for (const file of files) {
      const codeAnalysis = await this.codeUnderstandingAgent.analyzeCodeStructure(file.uri);
      const contextResult = await this.findMostRelevantContext(
        codeAnalysis, 
        file.content, 
        userPrompt
      );

      contextResults.push({
        filePath: file.filePath,
        codeAnalysis,
        relevantContext: contextResult
      });
    }

    return contextResults;
  }

  private async findMostRelevantContext(
    codeAnalysis: CodeAnalysis, 
    fileContent: string,
    userPrompt: string
  ): Promise<string> {
    const systemPrompt = `
    Find the most relevant code context based on the user's intent.
    
    Code Analysis:
    - Classes: ${codeAnalysis.classes.map(c => c.name).join(', ')}
    - Functions: ${codeAnalysis.functions.map(f => f.name).join(', ')}
    
    Provide:
    - Exact code snippet most relevant to the task
    - Explanation of why it's relevant
    `;

    const fullPrompt = `
    ${systemPrompt}

    User Prompt: ${userPrompt}
    File Content: ${fileContent}
    `;

    try {
      const response = await this.ollamaAgent.sendToOllama(fullPrompt);
      const codeMatch = response.content.match(/```[\s\S]*?```/);
      return codeMatch ? codeMatch[0].replace(/```/g, '').trim() : fileContent;
    } catch (error) {
      return fileContent;
    }
  }
}

interface CodeContextResult {
  filePath: string;
  codeAnalysis: CodeAnalysis;
  relevantContext: string;
}

export { CodeContextResult };
