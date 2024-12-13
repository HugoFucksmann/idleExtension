import * as vscode from 'vscode';
import { FileAnalysisAgent, FileInfo } from './FileAnalysisAgent';
import { OllamaIntegrationAgent } from './OllamaIntegrationAgent';
import { PromptClassification } from './PromptEngineeringAgent';

export class CodeSearchAgent {
  private fileAnalysisAgent: FileAnalysisAgent;
  private ollamaAgent: OllamaIntegrationAgent;

  constructor(
    fileAnalysisAgent: FileAnalysisAgent, 
    ollamaAgent: OllamaIntegrationAgent
  ) {
    this.fileAnalysisAgent = fileAnalysisAgent;
    this.ollamaAgent = ollamaAgent;
  }

  async findRelevantFiles(
    searchQuery: string,
    classification: PromptClassification
  ): Promise<FileInfo[]> {
    try {
      const options = {
        filePattern: `**/*{${classification.relevantFileTypes.join(',')}}`,
        contentFilter: (file: FileInfo) => {
          // Check if file content matches any search keywords
          return classification.searchKeywords.some(keyword => 
            file.content.toLowerCase().includes(keyword.toLowerCase())
          );
        }
      };

      const files = await this.fileAnalysisAgent.analyzeFiles(options);
      return this.rankFilesByRelevance(files, classification);
    } catch (error) {
      vscode.window.showErrorMessage(`Error finding relevant files: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  private rankFilesByRelevance(files: FileInfo[], classification: PromptClassification): FileInfo[] {
    return files.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, classification);
      const scoreB = this.calculateRelevanceScore(b, classification);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(file: FileInfo, classification: PromptClassification): number {
    let score = 0;

    // Score based on keyword matches
    classification.searchKeywords.forEach(keyword => {
      const matches = (file.content.match(new RegExp(keyword, 'gi')) || []).length;
      score += matches;
    });

    // Bonus for matching file type
    if (classification.relevantFileTypes.includes(file.fileExtension)) {
      score += 10;
    }

    return score;
  }
}