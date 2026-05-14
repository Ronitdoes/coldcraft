/**
 * Gemini API Key Pool Manager
 *
 * Handles multiple Gemini keys, rotating through them and applying
 * cooldowns when a key hits rate limits or quota exhaustion.
 */

interface GeminiKey {
  value: string;
  failures: number;
  cooldownUntil: number;
  lastUsed: number;
}

const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

class GeminiKeyPool {
  private keys: GeminiKey[] = [];

  constructor() {
    this.initializeKeys();
  }

  /**
   * Parses GEMINI_API_KEYS (comma-separated) or falls back to GEMINI_API_KEY.
   */
  private initializeKeys() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const parsedKeys = rawKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // De-duplicate keys
    const uniqueKeys = Array.from(new Set(parsedKeys));

    this.keys = uniqueKeys.map((value) => ({
      value,
      failures: 0,
      cooldownUntil: 0,
      lastUsed: 0,
    }));
  }

  /**
   * Returns the least recently used key that is not on cooldown.
   * Returns null if no keys are available.
   */
  public getAvailableGeminiKey(): string | null {
    const now = Date.now();
    const availableKeys = this.keys.filter((k) => k.cooldownUntil <= now);

    if (availableKeys.length === 0) {
      return null;
    }

    // Sort by lastUsed ascending (least recently used first)
    availableKeys.sort((a, b) => a.lastUsed - b.lastUsed);

    const selectedKey = availableKeys[0];
    selectedKey.lastUsed = now;

    return selectedKey.value;
  }

  /**
   * Marks a key as successful, resetting its failure count.
   */
  public markKeySuccess(keyValue: string) {
    const key = this.keys.find((k) => k.value === keyValue);
    if (key) {
      key.failures = 0;
    }
  }

  /**
   * Applies a specific cooldown to a key.
   */
  public markKeyCooldown(keyValue: string, durationMs: number = DEFAULT_COOLDOWN_MS) {
    const key = this.keys.find((k) => k.value === keyValue);
    if (key) {
      key.cooldownUntil = Date.now() + durationMs;
      console.log(`[AI] Gemini key cooldown applied for ${durationMs / 60000}m`);
    }
  }

  /**
   * Analyzes an error and marks the key appropriately.
   * If the error indicates a rate limit (429), quota exhaustion, or timeout,
   * a cooldown is applied.
   */
  public markKeyFailure(keyValue: string, error: unknown) {
    const key = this.keys.find((k) => k.value === keyValue);
    if (!key) return;

    key.failures += 1;
    const errMessage = error instanceof Error ? error.message : String(error);

    const isRateLimitOrExhausted =
      errMessage.includes("429") ||
      errMessage.toLowerCase().includes("quota exceeded") ||
      errMessage.toLowerCase().includes("exhausted");

    const isTimeout = errMessage.toLowerCase().includes("timed out");

    if (isRateLimitOrExhausted || isTimeout) {
      this.markKeyCooldown(keyValue, DEFAULT_COOLDOWN_MS);
    } else {
      // Even for other unknown errors, if it fails multiple times, we might want to cool it down,
      // but for now we only strictly cool down on 429/timeout.
      console.log(`[AI] Gemini key recorded failure: ${errMessage}`);
    }
  }

  /**
   * Useful for logs (hiding the actual key).
   */
  public getMaskedKey(keyValue: string): string {
    if (!keyValue) return "unknown";
    if (keyValue.length <= 8) return "***";
    return `${keyValue.substring(0, 4)}...${keyValue.substring(keyValue.length - 4)}`;
  }
}

// Export a singleton instance
export const keyPool = new GeminiKeyPool();
