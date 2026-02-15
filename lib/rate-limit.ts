export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxRetries: number;
  private blockDuration: number; // ms

  constructor(maxRetries = 5, blockDuration = 30 * 60 * 1000) {
    this.maxRetries = maxRetries;
    this.blockDuration = blockDuration;
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(identifier: string): boolean {
    const data = this.attempts.get(identifier);
    if (!data) return false;

    if (data.count >= this.maxRetries) {
      const now = Date.now();
      const timePassed = now - data.lastAttempt;

      if (timePassed < this.blockDuration) {
        return true;
      } else {
        // Block expired, reset
        this.attempts.delete(identifier);
        return false;
      }
    }

    return false;
  }

  /**
   * Increment failed attempt count
   */
  increment(identifier: string) {
    const now = Date.now();
    const data = this.attempts.get(identifier) || { count: 0, lastAttempt: now };

    data.count++;
    data.lastAttempt = now;

    this.attempts.set(identifier, data);
  }

  /**
   * Reset attempts on successful action
   */
  reset(identifier: string) {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining blocking time in minutes
   */
  getRemainingTime(identifier: string): number {
    const data = this.attempts.get(identifier);
    if (!data || data.count < this.maxRetries) return 0;

    const now = Date.now();
    const timePassed = now - data.lastAttempt;
    const remaining = this.blockDuration - timePassed;

    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  }
}

// Singleton instance for global use per server instance
export const authRateLimiter = new RateLimiter();
