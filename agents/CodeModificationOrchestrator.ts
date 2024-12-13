import * as vscode from 'vscode';
import { PromptEngineeringAgent, PromptClassification } from './PromptEngineeringAgent';
import { CodeSearchAgent } from './CodeSearchAgent';
import { CodeContextAgent, CodeContextResult } from './CodeContextAgent';
import { CodeModificationAgent } from './CodeModificationAgent';
import { CodeUnderstandingAgent } from './CodeUnderstandingAgent';
import { OllamaIntegrationAgent } from './OllamaIntegrationAgent';
import { IntentClassificationAgent } from './IntentClassificationAgent';
import { ContextMemoryManager } from './ContextMemoryManager';

export class CodeModificationOrchestrator {
  private agents: {
    promptEngineering: PromptEngineeringAgent;
    codeSearch: CodeSearchAgent;
    codeContext: CodeContextAgent;
    codeModification: CodeModificationAgent;
    codeUnderstanding: CodeUnderstandingAgent;
    ollamaIntegration: OllamaIntegrationAgent;
  };
  private intentClassifier: IntentClassificationAgent;
  private contextMemoryManager: ContextMemoryManager;

  constructor(dependencies: {
    ollamaIntegration: OllamaIntegrationAgent;
    fileAnalysisAgent: FileAnalysisAgent;
    codeUnderstandingAgent: CodeUnderstandingAgent;
    codeModificationAgent: CodeModificationAgent;
  }) {
    const { 
      ollamaIntegration, 
      fileAnalysisAgent, 
      codeUnderstandingAgent,
      codeModificationAgent 
    } = dependencies;

    this.intentClassifier = new IntentClassificationAgent(new EmbeddingModel(), new MachineLearningClassifier());
    this.contextMemoryManager = new ContextMemoryManager();

    this.agents = {
      ollamaIntegration,
      promptEngineering: new PromptEngineeringAgent(ollamaIntegration),
      codeSearch: new CodeSearchAgent(fileAnalysisAgent, ollamaIntegration),
      codeContext: new CodeContextAgent(codeUnderstandingAgent, ollamaIntegration),
      codeModification: codeModificationAgent,
      codeUnderstanding: codeUnderstandingAgent
    };
  }

  async processUserIntent(userPrompt: string): Promise<vscode.Uri[]> {
    try {
      const promptClassification = await this.intentClassifier.classifyPrompt(userPrompt);
      const searchQuery = await this.agents.promptEngineering.generateSearchQuery(promptClassification);
      const relevantFiles = await this.agents.codeSearch.findRelevantFiles(searchQuery, promptClassification);
      const codeContexts = await this.agents.codeContext.extractRelevantCodeContext(relevantFiles, userPrompt);
      const modifiedFiles = await this.generateCodeModifications(codeContexts, userPrompt, promptClassification);

      return modifiedFiles;
    } catch (error) {
      vscode.window.showErrorMessage(`Code modification failed: ${error}`);
      return [];
    }
  }

  private async generateCodeModifications(
    codeContexts: CodeContextResult[], 
    userPrompt: string,
    classification: PromptClassification
  ): Promise<vscode.Uri[]> {
    const modifiedFiles: vscode.Uri[] = [];

    for (const context of codeContexts) {
      const modificationInstructions = await this.generateModificationInstructions(context, userPrompt, classification);
      await this.agents.codeModification.modifyCode(vscode.Uri.file(context.filePath), modificationInstructions);
      modifiedFiles.push(vscode.Uri.file(context.filePath));
    }

    return modifiedFiles;
  }

  private async generateModificationInstructions(
    context: CodeContextResult, 
    userPrompt: string,
    classification: PromptClassification
  ): Promise<CodeModification[]> {
    const systemPrompt = `
    Generate precise code modification instructions.
    
    Context:
    - File: ${context.filePath}
    - Intent: ${classification.intent}
    - Relevant Code: ${context.relevantContext}
    
    Output JSON modifications:
    [{
      type: 'insert' | 'replace' | 'delete',
      location: { line: number, character?: number },
      content?: string
    }]
    `;

    const fullPrompt = `
    ${systemPrompt}

    User Prompt: ${userPrompt}
    `;

    try {
      const response = await this.agents.ollamaIntegration.sendToOllama(fullPrompt);
      const match = response.content.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }

      return [];
    } catch (error) {
      return [];
    }
  }
}

interface CodeModification {
  type: 'insert' | 'replace' | 'delete';
  location: {
    line: number;
    character?: number;
  };
  content?: string;
}

export { CodeModification };
