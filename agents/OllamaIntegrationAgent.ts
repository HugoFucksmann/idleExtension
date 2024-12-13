import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as vscode from 'vscode';
import * as EventEmitter from 'events';

export class OllamaIntegrationAgent extends EventEmitter {
  private currentProcess: ChildProcessWithoutNullStreams | null = null;
  private model: string;
  private config: OllamaConfig;

  constructor(model: string = 'qwen2.5-coder:7b', config: OllamaConfig = {}) {
    super();
    this.model = model;
    this.config = {
      timeout: 60000,
      temperature: 0.7,
      maxTokens: 4096,
      ...config
    };
  }

  async sendToOllama(
    userMessage: string, 
    context?: CodeContext
  ): Promise<OllamaResponse> {
    return new Promise((resolve, reject) => {
      // Terminate any existing process
      this.killCurrentProcess();

      // Prepare full prompt with context
      const fullPrompt = this.preparePrompt(userMessage, context);

      // Spawn new Ollama process
      this.currentProcess = spawn('ollama', ['run', this.model], { 
        shell: true,
        env: { ...process.env, OLLAMA_MAX_TOKENS: this.config.maxTokens.toString() }
      });

      let fullResponse = '';
      let buffer = '';
      const startTime = Date.now();

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.killCurrentProcess();
        reject(new Error('Ollama request timed out'));
      }, this.config.timeout);

      // Send prepared prompt
      this.currentProcess.stdin.write(fullPrompt + '\n');
      this.currentProcess.stdin.end();

      // Handle stdout
      this.currentProcess.stdout.on('data', (data) => {
        const text = data.toString();
        buffer += text;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (line.trim()) {
            fullResponse += line + '\n';
            this.emit('messageChunk', { 
              message: line, 
              isPartial: true 
            });
          }
        });
      });

      // Handle stderr
      this.currentProcess.stderr.on('data', (data) => {
        console.error(`Ollama stderr: ${data}`);
        this.emit('error', { 
          type: 'stderr', 
          message: data.toString() 
        });
      });

      // Process completion
      this.currentProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        const response: OllamaResponse = {
          content: fullResponse.trim(),
          metadata: {
            model: this.model,
            duration,
            statusCode: code || 0
          }
        };

        if (code === 0) {
          this.emit('complete', response);
          resolve(response);
        } else {
          const error = new Error(`Ollama process exited with code ${code}`);
          this.emit('error', { 
            type: 'process', 
            message: error.message 
          });
          reject(error);
        }
      });

      // Handle process errors
      this.currentProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        this.emit('error', { 
          type: 'spawn', 
          message: error.message 
        });
        reject(error);
      });
    });
  }

  // Prepare prompt with optional context
  private preparePrompt(
    userMessage: string, 
    context?: CodeContext
  ): string {
    let fullPrompt = userMessage;

    if (context) {
      const contextStr = JSON.stringify(context, null, 2);
      fullPrompt = `Context:\n${contextStr}\n\nUser Prompt:\n${userMessage}`;
    }

    return fullPrompt;
  }

  // Terminate current Ollama process
  private killCurrentProcess(): void {
    if (this.currentProcess) {
      try {
        this.currentProcess.kill();
        this.currentProcess = null;
      } catch (error) {
        console.error('Error killing Ollama process:', error);
      }
    }
  }

  // Change model dynamically
  setModel(newModel: string): void {
    this.model = newModel;
  }
}

// Type definitions for Ollama integration
interface OllamaConfig {
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}

interface CodeContext {
  files?: string[];
  codeSnippets?: string[];
  projectStructure?: string;
  previousContext?: string;
}

interface OllamaResponse {
  content: string;
  metadata: {
    model: string;
    duration: number;
    statusCode: number;
  };
}

export { 
  OllamaConfig, 
  CodeContext, 
  OllamaResponse 
};