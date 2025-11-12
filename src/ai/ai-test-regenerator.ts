/**
 * AI Test Regenerator
 *
 * Uses GPT-4 to regenerate broken tests based on failure analysis.
 * This is used by the Self-Healing Agent (Agent 3).
 */

import OpenAI from 'openai';
import type { RegenerationContext, RegenerationResult } from '../types/self-healing-types.js';
import fs from 'fs/promises';

/**
 * AI Test Regenerator configuration
 */
export interface AITestRegeneratorConfig {
  /** OpenAI API key */
  apiKey?: string;

  /** Model to use */
  model?: string;

  /** Request timeout */
  timeout?: number;

  /** Max retries */
  maxRetries?: number;

  /** Verbose logging */
  verbose?: boolean;
}

/**
 * AI Test Regenerator
 *
 * Uses GPT-4 to analyze failing tests and regenerate them
 * based on the current API specification and failure context.
 */
export class AITestRegenerator {
  private client: OpenAI | null = null;
  private config: Required<AITestRegeneratorConfig>;
  private enabled: boolean = false;

  constructor(config: AITestRegeneratorConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      verbose: config.verbose || false,
    };

    if (this.config.apiKey) {
      this.client = new OpenAI({ apiKey: this.config.apiKey });
      this.enabled = true;

      if (this.config.verbose) {
        console.log('✨ AI Test Regenerator initialized');
      }
    }
  }

  /**
   * Check if regenerator is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Regenerate a failing test
   */
  async regenerateTest(context: RegenerationContext): Promise<RegenerationResult> {
    if (!this.enabled || !this.client) {
      return {
        success: false,
        error: {
          code: 'NOT_ENABLED',
          message: 'AI Test Regenerator is not enabled (missing OPENAI_API_KEY)',
        },
      };
    }

    try {
      const startTime = Date.now();

      // Build prompt for GPT-4
      const prompt = this.buildRegenerationPrompt(context);

      // Call GPT-4
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent code generation
        max_tokens: 2000,
      });

      const regeneratedCode = response.choices[0]?.message?.content;

      if (!regeneratedCode) {
        return {
          success: false,
          error: {
            code: 'EMPTY_RESPONSE',
            message: 'GPT-4 returned empty response',
          },
        };
      }

      // Extract code from markdown if present
      const code = this.extractCode(regeneratedCode);

      // Validate the regenerated code
      const validation = this.validateRegeneratedCode(code, context);

      if (!validation.valid) {
        return {
          success: false,
          originalTest: context.originalTestCode,
          regeneratedTest: code,
          validation,
          error: {
            code: 'VALIDATION_FAILED',
            message: `Regenerated code failed validation: ${validation.errors.join(', ')}`,
          },
        };
      }

      // Save the regenerated test
      let savedPath: string | undefined;
      try {
        await fs.writeFile(context.testFilePath, code, 'utf-8');
        savedPath = context.testFilePath;

        if (this.config.verbose) {
          console.log(`✅ Saved regenerated test to ${savedPath}`);
        }
      } catch (error) {
        if (this.config.verbose) {
          console.error(`⚠️  Failed to save test: ${error}`);
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        originalTest: context.originalTestCode,
        regeneratedTest: code,
        savedPath,
        tokensUsed: response.usage?.total_tokens,
        duration,
        validation,
        changes: this.summarizeChanges(context.originalTestCode, code),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGENERATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Get system prompt for test regeneration
   */
  private getSystemPrompt(): string {
    return `You are an expert test engineer specializing in API testing with Playwright.

Your task is to regenerate failing tests to work with updated API specifications.

Guidelines:
1. Preserve the test's original intent and coverage
2. Update only what's necessary to fix the failure
3. Follow Playwright best practices
4. Use proper TypeScript types
5. Include clear test descriptions
6. Handle errors gracefully
7. Return ONLY the complete test code, no explanations

The test should:
- Use Playwright's request fixture for API testing
- Include proper assertions with expect()
- Have clear test names
- Handle async/await correctly
- Validate response status and body`;
  }

  /**
   * Build prompt for test regeneration
   */
  private buildRegenerationPrompt(context: RegenerationContext): string {
    const { testName, failureAnalysis, originalTestCode, specChanges } = context;

    let prompt = `# Test Regeneration Request\n\n`;

    prompt += `## Failing Test\n`;
    prompt += `**Name:** ${testName}\n`;
    prompt += `**File:** ${context.testFilePath}\n\n`;

    prompt += `## Failure Analysis\n`;
    prompt += `**Type:** ${failureAnalysis.failureType}\n`;
    prompt += `**Root Cause:** ${failureAnalysis.rootCause}\n`;
    prompt += `**Confidence:** ${(failureAnalysis.confidence * 100).toFixed(0)}%\n\n`;

    if (failureAnalysis.suggestedFix) {
      prompt += `**Suggested Fix:** ${failureAnalysis.suggestedFix}\n\n`;
    }

    if (specChanges && specChanges.length > 0) {
      prompt += `## API Specification Changes\n`;
      for (const change of specChanges) {
        prompt += `- **${change.changeType}** in ${change.path}: ${change.description}\n`;
      }
      prompt += `\n`;
    }

    prompt += `## Current Test Code\n\`\`\`typescript\n${originalTestCode}\n\`\`\`\n\n`;

    prompt += `## Task\n`;
    prompt += `Regenerate this test to fix the failure. Return ONLY the complete updated test code.`;

    return prompt;
  }

  /**
   * Extract code from markdown code blocks
   */
  private extractCode(response: string): string {
    // Try to extract from markdown code block
    const codeBlockMatch = response.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);

    if (codeBlockMatch) {
      return codeBlockMatch[1]!.trim();
    }

    // If no code block, return as-is
    return response.trim();
  }

  /**
   * Validate regenerated code
   */
  private validateRegeneratedCode(
    code: string,
    context: RegenerationContext
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic syntax checks
    if (!code.includes('test(')) {
      errors.push('Missing test() function');
    }

    if (!code.includes('expect(')) {
      errors.push('Missing expect() assertions');
    }

    if (!code.includes('await')) {
      errors.push('Missing await for async operations');
    }

    if (!code.includes('request')) {
      errors.push('Missing Playwright request fixture');
    }

    // Check for common issues
    if (code.includes('console.log(')) {
      errors.push('Contains console.log (should be removed)');
    }

    // Ensure test name is similar to original
    const originalTestName = context.testName.toLowerCase();
    const codeTestName = code.match(/test\(['"]([^'"]+)['"]/)?.[1]?.toLowerCase();

    if (codeTestName && !codeTestName.includes(originalTestName.split(' ')[0] || '')) {
      errors.push('Test name significantly changed');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Summarize changes between original and regenerated code
   */
  private summarizeChanges(original: string, regenerated: string): string[] {
    const changes: string[] = [];

    // Simple change detection
    if (original.length !== regenerated.length) {
      const diff = regenerated.length - original.length;
      changes.push(`Code size changed by ${diff} characters`);
    }

    // Check for specific changes
    if (!original.includes('toBeValid') && regenerated.includes('toBeValid')) {
      changes.push('Added schema validation');
    }

    if (original.includes('toBe(200)') && !regenerated.includes('toBe(200)')) {
      changes.push('Updated expected status code');
    }

    if (changes.length === 0) {
      changes.push('Minor code adjustments');
    }

    return changes;
  }
}
