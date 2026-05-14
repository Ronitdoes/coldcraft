/**
 * AI Provider Implementations + Fallback Runner
 *
 * ┌─────────────────────────────────────────────┐
 * │  To change the Gemini model:                │
 * │  Search for GEMINI_MODEL below and update.  │
 * │                                             │
 * │  To change Groq models:                     │
 * │  Search for GROQ_MODEL below and update.    │
 * └─────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { groq } from "@/lib/groq";
import type {
  AIProvider,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderName,
} from "./types";
import { keyPool } from "./key-pool";

// ---------------------------------------------------------------------------
// Gemini Provider
// ---------------------------------------------------------------------------

/** ⬇️  GEMINI_MODEL — change this to switch Gemini models */
const GEMINI_MODEL = "gemini-3.1-flash-lite";

export const geminiProvider: AIProvider = {
  name: "gemini",

  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      const apiKey = keyPool.getAvailableGeminiKey();

      if (!apiKey) {
        throw new Error("All Gemini keys are exhausted or on cooldown");
      }

      const gemini = new GoogleGenAI({ apiKey });
      const abortController = new AbortController();

      try {
        const geminiPromise = gemini.models.generateContent({
          model: GEMINI_MODEL,
          contents: req.userMessage,
          config: {
            systemInstruction: req.systemPrompt,
            temperature: req.temperature,
            maxOutputTokens: req.maxTokens,
            // Disable thinking for lower latency on structured tasks
            thinkingConfig: { thinkingBudget: 0 },
            // Pass the abort signal for proper cancellation
            abortSignal: abortController.signal,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => {
            abortController.abort();
            reject(new Error("Gemini request timed out after 15s"));
          }, 15_000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        const text = response.text;
        if (!text || text.trim().length === 0) {
          throw new Error("Gemini returned empty response");
        }

        keyPool.markKeySuccess(apiKey);
        return { text: text.trim(), provider: "gemini" };
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        
        // Short-circuit on 400 Bad Request (e.g., safety filters)
        // because the prompt itself is invalid and retrying will always fail.
        if (errMessage.includes("400") || errMessage.toLowerCase().includes("safety")) {
          console.error(`[AI] Gemini 400/Safety error. Aborting rotation: ${errMessage}`);
          throw err;
        }

        keyPool.markKeyFailure(apiKey, err);
        console.log(`[AI] Gemini key failed (${errMessage}), rotating... (Attempt ${attempts}/${MAX_ATTEMPTS})`);
        // Continue the while loop to try the next available key
      }
    }

    throw new Error(`Gemini failed after ${MAX_ATTEMPTS} attempts.`);
  },
};

// ---------------------------------------------------------------------------
// Groq Provider  (parameterised by model so we can have mail vs parse variants)
// ---------------------------------------------------------------------------

/** ⬇️  GROQ_MODEL — default Groq models for each use-case */
const GROQ_MAIL_MODEL = "llama-3.3-70b-versatile";
const GROQ_PARSE_MODEL = "llama-3.1-8b-instant";

function createGroqProvider(model: string, label: string): AIProvider {
  return {
    name: "groq" as AIProviderName,

    async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
      const groqPromise = groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: req.systemPrompt },
          { role: "user", content: req.userMessage },
        ],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Groq (${label}) request timed out after 15s`)), 15_000)
      );

      const completion = await Promise.race([groqPromise, timeoutPromise]);

      const text = completion.choices[0]?.message?.content;
      if (!text || text.trim().length === 0) {
        throw new Error(`Groq (${label}) returned empty response`);
      }

      return { text: text.trim(), provider: "groq" };
    },
  };
}

export const groqMailProvider = createGroqProvider(GROQ_MAIL_MODEL, "mail");
export const groqParseProvider = createGroqProvider(GROQ_PARSE_MODEL, "parse");

// ---------------------------------------------------------------------------
// Fallback Runner
// ---------------------------------------------------------------------------

/**
 * Runs a generation request through an ordered list of providers.
 * Returns the first successful response.
 * Throws only when ALL providers fail.
 */
export async function runWithFallback(
  providers: AIProvider[],
  request: AIGenerationRequest,
): Promise<AIGenerationResponse> {
  const errors: { provider: string; error: string }[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      console.log(`[AI] Attempting ${provider.name}...`);
      const result = await provider.generate(request);
      console.log(`[AI] Success via ${provider.name}`);
      return result;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.error(`[AI] ${provider.name} failed: ${message}`);
      errors.push({ provider: provider.name, error: message });

      // Log fallback only if there's a next provider
      if (i < providers.length - 1) {
        console.log(
          `[AI] ${provider.name} failed, falling back to ${providers[i + 1].name}`,
        );
      }
    }
  }

  // All providers exhausted
  const summary = errors
    .map((e) => `${e.provider}: ${e.error}`)
    .join(" | ");
  throw new Error(`All AI providers failed — ${summary}`);
}
