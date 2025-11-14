/**
 * AI Test Regenerator
 *
 * Uses GPT-4 to regenerate broken tests based on failure analysis.
 * This is used by the Self-Healing Agent (Agent 3).
 *
 * This implementation follows prompt engineering rules documented in:
 * docs/prompt-engineering.md
 *
 * Key principles:
 * - Context-Rich: Provide comprehensive context
 * - Intent Preservation: Maintain original purpose
 * - Format Control: Return only valid TypeScript
 * - Few-Shot Learning: Include examples
 * - Specificity: Focus on relevant information
 */

import OpenAI from 'openai';
import type {
  RegenerationContext,
  RegenerationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types/ai-types.js';
import { ValidationType, ChangeImpact } from '../types/ai-types.js';
import {
  getTestRepairPromptRules,
  formatFewShotRepairExamples,
  OUTPUT_FORMAT_RULES,
  TEST_REPAIR_REQUIREMENTS,
} from './prompt-engineering-rules.js';
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
   * Get prompt engineering rules from documentation
   * Based on docs/prompt-engineering.md
   */
  private getPromptEngineeringRules(): string {
    return getTestRepairPromptRules();
  }

  /**
   * Get few-shot examples for test repair
   */
  private getFewShotExamples(): string {
    return formatFewShotRepairExamples();
  }

  /**
   * Get system prompt for test regeneration
   * Enhanced with prompt engineering rules from docs/prompt-engineering.md
   */
  private getSystemPrompt(): string {
    return `You are an expert test engineer specializing in API testing with Playwright.

Your task is to repair failing tests based on API specification changes.

${this.getPromptEngineeringRules()}

The test should:
- Use Playwright's request fixture for API testing
- Include proper assertions with expect()
- Have clear test names
- Handle async/await correctly
- Validate response status and body

${OUTPUT_FORMAT_RULES}`;
  }

  /**
   * Build prompt for test regeneration
   * Enhanced with structured context and few-shot examples
   */
  private buildRegenerationPrompt(context: RegenerationContext): string {
    const { testName, failureAnalysis, originalTestCode, specChanges } = context;

    let prompt = `# Test Repair Request\n\n`;

    // Role definition
    prompt += `You are repairing a failing Playwright API test.\n\n`;

    // Context: Original Test Code
    prompt += `## Original Test Code\n\`\`\`typescript\n${originalTestCode}\n\`\`\`\n\n`;

    // Context: Test Failure Information
    prompt += `## Test Failure Information\n`;
    prompt += `**Test Name:** ${testName}\n`;
    prompt += `**File:** ${context.testFilePath}\n`;
    prompt += `**Failure Type:** ${failureAnalysis.failureType}\n`;
    prompt += `**Root Cause:** ${failureAnalysis.rootCause}\n`;
    prompt += `**Confidence:** ${(failureAnalysis.confidence * 100).toFixed(0)}%\n`;

    if (failureAnalysis.suggestedFix) {
      prompt += `**Suggested Fix:** ${failureAnalysis.suggestedFix}\n`;
    }
    prompt += `\n`;

    // Context: API Changes
    if (specChanges && specChanges.length > 0) {
      prompt += `## API Changes\n`;
      prompt += `The following changes were made to the API specification:\n`;
      for (const change of specChanges) {
        prompt += `- **${change.type}** in ${change.path}: ${change.description}\n`;
        if (change.impact === ChangeImpact.BREAKING) {
          prompt += `  ⚠️  BREAKING CHANGE\n`;
        }
      }
      prompt += `\n`;
    }

    // Requirements
    prompt += `## Requirements\n`;
    TEST_REPAIR_REQUIREMENTS.forEach((req, i) => {
      prompt += `${i + 1}. ${req}\n`;
    });
    prompt += `\n`;

    // Few-Shot Examples
    prompt += `## Few-Shot Examples\n`;
    prompt += `Here are examples of successful test repairs:\n`;
    prompt += this.getFewShotExamples();
    prompt += `\n`;

    // Output Format
    prompt += `## Output Format\n`;
    prompt += OUTPUT_FORMAT_RULES;
    prompt += `\n\n`;

    // Task reminder
    prompt += `## Your Task\n`;
    prompt += `Repair the failing test above by addressing all API changes and following the requirements.\n`;
    prompt += `Return ONLY the complete repaired test code in TypeScript.\n`;

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
  private validateRegeneratedCode(code: string, context: RegenerationContext): ValidationResult {
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
