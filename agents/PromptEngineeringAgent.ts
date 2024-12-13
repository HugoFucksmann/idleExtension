import * as vscode from 'vscode';
import { OllamaIntegrationAgent } from './OllamaIntegrationAgent';

export class PromptEngineeringAgent {
  private ollamaAgent: OllamaIntegrationAgent;

  constructor(ollamaAgent: OllamaIntegrationAgent) {
    this.ollamaAgent = ollamaAgent;
  }

  async classifyPrompt(userPrompt: string): Promise<PromptClassification> {
    const systemPrompt = `
    You are an expert code analysis assistant. Classify the user's intent precisely.
    
    Output JSON with these fields:
    - intent: (modify, fix, refactor, explain, other)
    - relevantFileTypes: string[] (e.g. ['.ts', '.js', '.tsx'])
    - searchKeywords: string[]
    - complexity: (low, medium, high)
    `;

    const fullPrompt = `${systemPrompt}\n\nUser Prompt: ${userPrompt}`;

    try {
      const response = await this.ollamaAgent.sendToOllama(fullPrompt);
      
      // Extract JSON from response
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      // Fallback classification
      return {
        intent: 'other',
        relevantFileTypes: ['.ts', '.js'],
        searchKeywords: userPrompt.split(/\s+/),
        complexity: 'low'
      };
    }
  }

  async generateSearchQuery(classification: PromptClassification): Promise<string> {
    const systemPrompt = `
    Generate a precise file search query based on the prompt classification.
    Consider file types, keywords, and intent.
    
    Output a glob pattern and search keywords.
    `;

    const fullPrompt = `
    Prompt Classification:
    ${JSON.stringify(classification, null, 2)}
    
    Generate search query:
    `;

    const response = await this.ollamaAgent.sendToOllama(fullPrompt);
    
    // Parse response or fallback
    const searchQuery = response.content.trim() || 
      `**/*{${classification.relevantFileTypes.join(',')}}`;

    return searchQuery;
  }
}

interface PromptClassification {
  intent: 'modify' | 'fix' | 'refactor' | 'explain' | 'other';
  relevantFileTypes: string[];
  searchKeywords: string[];
  complexity: 'low' | 'medium' | 'high';
}

export { PromptClassification };