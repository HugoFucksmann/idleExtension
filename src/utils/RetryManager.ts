export class RetryManager {
  private readonly maxRetries: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;

  constructor(
    maxRetries: number = 3,
    initialDelay: number = 1000,
    maxDelay: number = 5000
  ) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
  }

  async retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let currentDelay = this.initialDelay;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, this.maxDelay);
        }
      }
    }

    throw lastError || new Error('Operation failed after all retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
