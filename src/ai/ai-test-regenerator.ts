/**
 * AI Test Regenerator
 *
 * Uses GPT-4 to regenerate broken tests based on failure analysis.
 * This is used by the Self-Healing Agent (Agent 3).
 */

import OpenAI from 'openai';
import type {
  RegenerationContext,
  RegenerationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types/ai-types.js';
import { ValidationType } from '../types/ai-types.js';
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
        modelUsed: this.config.model,
        duration: 0,
        timestamp: new Date(),
        error: {
          message: 'AI Test Regenerator is not enabled (missing OPENAI_API_KEY)',
          type: 'unknown' as any,
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
          modelUsed: this.config.model,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          error: {
            message: 'GPT-4 returned empty response',
            type: 'unknown' as any,
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
          regeneratedCode: code,
          validation,
          modelUsed: this.config.model,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          error: {
            message: `Regenerated code failed validation: ${validation.errors.join(', ')}`,
            type: 'validation_error' as any,
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
        regeneratedCode: code,
        savedPath,
        tokensUsed: response.usage?.total_tokens,
        modelUsed: this.config.model,
        duration,
        timestamp: new Date(),
        validation,
      };
    } catch (error) {
      return {
        success: false,
        modelUsed: this.config.model,
        duration: 0,
        timestamp: new Date(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          type: 'unknown' as any,
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
        prompt += `- **${change.type}** in ${change.path}: ${change.description}\n`;
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
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic syntax checks
    const hasTestFunction = code.includes('test(');
    const hasExpect = code.includes('expect(');
    const hasAwait = code.includes('await');
    const hasRequest = code.includes('request');

    if (!hasTestFunction) {
      errors.push({
        message: 'Missing test() function',
        type: ValidationType.STRUCTURE,
        severity: 'error',
      });
    }

    if (!hasExpect) {
      errors.push({
        message: 'Missing expect() assertions',
        type: ValidationType.ASSERTIONS,
        severity: 'error',
      });
    }

    if (!hasAwait) {
      errors.push({
        message: 'Missing await for async operations',
        type: ValidationType.SYNTAX,
        severity: 'error',
      });
    }

    if (!hasRequest) {
      errors.push({
        message: 'Missing Playwright request fixture',
        type: ValidationType.PLAYWRIGHT,
        severity: 'error',
      });
    }

    // Check for common issues
    if (code.includes('console.log(')) {
      warnings.push({
        message: 'Contains console.log statements',
        type: ValidationType.SYNTAX,
        recommendation: 'Remove console.log statements from test code',
      });
    }

    // Ensure test name is similar to original
    const originalTestName = context.testName.toLowerCase();
    const codeTestName = code.match(/test\(['"]([^'"]+)['"]/)?.[1]?.toLowerCase();

    if (codeTestName && !codeTestName.includes(originalTestName.split(' ')[0] || '')) {
      warnings.push({
        message: 'Test name differs from original',
        type: ValidationType.STRUCTURE,
        recommendation: 'Ensure test name reflects original intent',
      });
    }

    return {
      valid: errors.length === 0,
      syntax: {
        valid: hasAwait && hasTestFunction,
        errors: [],
        parser: 'simple',
      },
      imports: {
        valid: true,
        hasPlaywrightImports: hasRequest,
        missingImports: [],
        invalidImports: [],
      },
      structure: {
        valid: hasTestFunction,
        hasTestBlocks: hasTestFunction,
        testCount: (code.match(/test\(/g) || []).length,
        hasDescribeBlocks: code.includes('describe('),
        issues: [],
      },
      assertions: {
        valid: hasExpect,
        assertionCount: (code.match(/expect\(/g) || []).length,
        hasExpectStatements: hasExpect,
        issues: [],
      },
      errors,
      warnings,
    };
  }

}
