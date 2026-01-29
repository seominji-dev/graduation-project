import {
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_MAX_TOKENS,
} from "../config/constants.js";

/**
 * LLM Service
 * Handles communication with LLM providers (Ollama, OpenAI)
 */

import { LLMProvider } from "../domain/models";
import { config } from "../config";
import ollama from "ollama";
import OpenAI from "openai";
import { createLogger } from "../utils/logger";

const logger = createLogger("LLMService");

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  model: string;
}

export class LLMService {
  private ollamaClient: typeof ollama;
  private openaiClient: OpenAI | null = null;

  constructor() {
    this.ollamaClient = ollama;

    // Initialize OpenAI client if API key is provided
    if (config.llm.openai.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: config.llm.openai.apiKey,
      });
    }
  }

  /**
   * Process a prompt with the specified provider
   */
  async process(prompt: string, provider: LLMProvider): Promise<string> {
    try {
      switch (provider.name) {
        case "ollama":
          return await this.processOllama(prompt, provider.model || "llama2");
        case "openai":
          return await this.processOpenAI(
            prompt,
            provider.model || "gpt-3.5-turbo",
          );
        default:
          throw new Error("Unsupported provider: " + String(provider.name));
      }
    } catch (error) {
      logger.error("LLM processing error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error("LLM processing failed: " + errorMsg);
    }
  }

  /**
   * Process with Ollama (local LLM)
   */
  private async processOllama(prompt: string, model: string): Promise<string> {
    try {
      const response = await this.ollamaClient.generate({
        model: model || "llama2",
        prompt: prompt,
      });

      return response.response;
    } catch (error) {
      logger.error("Ollama error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error("Ollama processing failed: " + errorMsg);
    }
  }

  /**
   * Process with OpenAI API
   */
  private async processOpenAI(prompt: string, model: string): Promise<string> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized (missing API key)");
    }

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: model || "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: DEFAULT_LLM_TEMPERATURE,
        max_tokens: DEFAULT_LLM_MAX_TOKENS,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      logger.error("OpenAI error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error("OpenAI processing failed: " + errorMsg);
    }
  }

  /**
   * Health check for available providers
   */
  async healthCheck(): Promise<{
    ollama: boolean;
    openai: boolean;
  }> {
    const results = {
      ollama: false,
      openai: false,
    };

    // Check Ollama
    try {
      await this.ollamaClient.list();
      results.ollama = true;
    } catch (error) {
      logger.warn("Ollama health check failed:", error);
    }

    // Check OpenAI
    if (this.openaiClient) {
      try {
        await this.openaiClient.models.list();
        results.openai = true;
      } catch (error) {
        logger.warn("OpenAI health check failed:", error);
      }
    }

    return results;
  }
}
