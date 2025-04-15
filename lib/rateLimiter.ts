"use client";

/**
 * A simple utility to manage request rate limiting
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private minInterval: number;
  private maxRetries: number;
  private retryBackoff: number;

  /**
   * Create a new rate limiter
   * @param minInterval Minimum time in ms between requests
   * @param maxRetries Maximum number of retries on rate limit errors
   * @param retryBackoff Multiplicative factor for retry delay
   */
  constructor(minInterval: number = 1000, maxRetries: number = 3, retryBackoff: number = 2) {
    this.minInterval = minInterval;
    this.maxRetries = maxRetries;
    this.retryBackoff = retryBackoff;
  }

  /**
   * Execute a function with rate limiting and automatic retry on 429 errors
   * @param fn Function to execute
   * @returns Result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Calculate time since last request
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Wait if needed to respect rate limits
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Try to execute the function with retries
    let retryCount = 0;
    let lastError: any;
    
    while (retryCount <= this.maxRetries) {
      try {
        // Update last request time and execute function
        this.lastRequestTime = Date.now();
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error (429)
        const isRateLimit = 
          error.message?.includes('429') || 
          error.status === 429 ||
          error.statusCode === 429;
          
        if (!isRateLimit || retryCount >= this.maxRetries) {
          throw error;
        }
        
        // Calculate backoff time with exponential increase
        const backoffTime = this.minInterval * Math.pow(this.retryBackoff, retryCount);
        console.log(`Rate limit hit, retrying in ${backoffTime}ms (retry ${retryCount + 1}/${this.maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retryCount++;
      }
    }
    
    // If we get here, we've exhausted retries
    throw lastError;
  }

  /**
   * Set a new minimum interval between requests
   * @param interval Time in ms
   */
  setMinInterval(interval: number): void {
    this.minInterval = interval;
  }
} 