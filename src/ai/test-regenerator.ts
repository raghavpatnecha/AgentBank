/**
 * Test Regeneration Engine (Feature 4, Task 4.5)
 * Uses AI to regenerate failing tests based on spec changes and failure analysis
 */

import { promises as fs } from 'fs';
import type {
  RegenerationContext,
  RegenerationResult,
  RegenerationError,
  RegenerationErrorType,
  ParsedCode,
  ValidationResult,
  OpenAIConfig,
  SuccessRateMetrics,
  FailureType,
  PromptConfig,
} from '../types/ai-types.js';

/**
 * OpenAI client interface for AI interactions
 */
export interface OpenAIClient {
  /**
   * Send a completion request to OpenAI
   */
  createCompletion(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    text: string;
    tokensUsed: number;
    model: string;
  }>;
}

/**
 * Prompt builder for creating AI prompts
 */
export class PromptBuilder {
  constructor(
    private config: PromptConfig = {
      includeSpecChanges: true,
      includeOriginalCode: true,
      includeFailureAnalysis: true,
    }
  ) {}

  /**
   * Build a prompt for test regeneration
   */
  buildRegenerationPrompt(context: RegenerationContext): string {
    const sections: string[] = [];

    // Header
    sections.push('# Task: Regenerate Failing Playwright Test\n');
    sections.push(
      'You are an expert at writing Playwright API tests. A test has failed due to API specification changes.'
    );
    sections.push('Your task is to regenerate the test to match the new specification.\n');

    // Failure analysis
    if (this.config.includeFailureAnalysis) {
      sections.push('## Failure Analysis');
      sections.push(`- Test Name: ${context.testName}`);
      sections.push(`- Failure Type: ${context.failureAnalysis.failureType}`);
      sections.push(`- Root Cause: ${context.failureAnalysis.rootCause}`);
      if (context.failureAnalysis.suggestedFix) {
        sections.push(`- Suggested Fix: ${context.failureAnalysis.suggestedFix}`);
      }
      sections.push('');
    }

    // Spec changes
    if (this.config.includeSpecChanges && context.specChanges.length > 0) {
      sections.push('## API Specification Changes');
      for (const change of context.specChanges) {
        sections.push(`- ${change.type}: ${change.description}`);
        sections.push(`  Path: ${change.path}`);
        if (change.oldValue !== undefined) {
          sections.push(`  Old: ${JSON.stringify(change.oldValue)}`);
        }
        if (change.newValue !== undefined) {
          sections.push(`  New: ${JSON.stringify(change.newValue)}`);
        }
      }
      sections.push('');
    }

    // Original test code
    if (this.config.includeOriginalCode) {
      sections.push('## Original Test Code');
      sections.push('```typescript');
      sections.push(context.originalTestCode);
      sections.push('```\n');
    }

    // Current spec (relevant parts)
    sections.push('## Current API Specification');
    sections.push('```json');
    sections.push(JSON.stringify(context.currentSpec, null, 2));
    sections.push('```\n');

    // Additional context
    if (context.additionalContext) {
      sections.push('## Additional Context');
      sections.push(context.additionalContext);
      sections.push('');
    }

    // Instructions
    sections.push('## Instructions');
    sections.push('1. Analyze the failure and spec changes');
    sections.push('2. Update the test to work with the new API specification');
    sections.push('3. Maintain the same test structure and style');
    sections.push('4. Use proper Playwright test syntax and imports');
    sections.push('5. Include appropriate assertions');
    sections.push('6. Return ONLY the updated test code');
    sections.push('7. Wrap the code in a TypeScript code block (```typescript)');
    sections.push('');

    // Custom instructions
    if (this.config.customInstructions) {
      sections.push('## Additional Instructions');
      sections.push(this.config.customInstructions);
      sections.push('');
    }

    sections.push('## Output');
    sections.push('Generate the complete, updated test code:');

    return sections.join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PromptConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Test Regenerator - Main class for regenerating tests using AI
 */
export class TestRegenerator {
  private metrics: {
    totalAttempts: number;
    successful: number;
    failed: number;
    byFailureType: Map<FailureType, { attempts: number; successes: number }>;
  };

  private regenerationLog: Array<{
    context: RegenerationContext;
    result: RegenerationResult;
    timestamp: Date;
  }>;

  constructor(
    private openaiClient: OpenAIClient,
    private promptBuilder: PromptBuilder,
    private config: OpenAIConfig
  ) {
    this.metrics = {
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      byFailureType: new Map(),
    };
    this.regenerationLog = [];
  }

  /**
   * Regenerate a test based on the provided context
   */
  async regenerateTest(context: RegenerationContext): Promise<RegenerationResult> {
    const startTime = Date.now();
    this.metrics.totalAttempts++;

    try {
      // Build the prompt
      const prompt = this.promptBuilder.buildRegenerationPrompt(context);

      // Send to AI
      const aiResponse = await this.sendPromptToAI(prompt);

      // Parse the response
      const parsedCode = this.parseAIResponse(aiResponse.text);

      if (!parsedCode.found) {
        throw this.createError(
          'No code found in AI response',
          'parsing_error' as RegenerationErrorType,
          aiResponse.text
        );
      }

      // Extract test code
      const testCode = this.extractTestCode(parsedCode.code);

      // Validate generated code
      const validation = await this.validateGeneratedCode(testCode);

      if (!validation.valid) {
        const errorMessages = validation.errors.map((e) => e.message).join(', ');
        throw this.createError(
          `Generated code validation failed: ${errorMessages}`,
          'validation_error' as RegenerationErrorType,
          errorMessages
        );
      }

      // Save regenerated test
      const savedPath = await this.saveRegeneratedTest(testCode, context.testFilePath);

      // Create successful result
      const result: RegenerationResult = {
        success: true,
        regeneratedCode: testCode,
        savedPath,
        validation,
        modelUsed: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Update metrics
      this.metrics.successful++;
      this.updateFailureTypeMetrics(context.failureAnalysis.failureType, true);
      this.logRegenerationAttempt(context, result);

      return result;
    } catch (error) {
      // Create error result
      const regenerationError = this.handleError(error);
      const result: RegenerationResult = {
        success: false,
        error: regenerationError,
        modelUsed: this.config.model,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Update metrics
      this.metrics.failed++;
      this.updateFailureTypeMetrics(context.failureAnalysis.failureType, false);
      this.logRegenerationAttempt(context, result);

      return result;
    }
  }

  /**
   * Send prompt to AI and get response
   */
  async sendPromptToAI(prompt: string): Promise<{
    text: string;
    tokensUsed: number;
    model: string;
  }> {
    try {
      const response = await this.openaiClient.createCompletion(prompt, {
        model: this.config.model,
        temperature: 0.2, // Low temperature for more deterministic output
        maxTokens: 2000,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createError(
          `AI API error: ${error.message}`,
          'ai_api_error' as RegenerationErrorType,
          error.message
        );
      }
      throw this.createError('Unknown AI API error', 'ai_api_error' as RegenerationErrorType);
    }
  }

  /**
   * Parse AI response to extract code
   */
  parseAIResponse(response: string): ParsedCode {
    // Try to find TypeScript code block
    const typeScriptMatch = response.match(/```typescript\s*([\s\S]*?)\s*```/);
    if (typeScriptMatch?.[1]) {
      return {
        code: typeScriptMatch[1].trim(),
        language: 'typescript',
        found: true,
        rawResponse: response,
        confidence: 0.95,
      };
    }

    // Try to find JavaScript code block
    const jsMatch = response.match(/```javascript\s*([\s\S]*?)\s*```/);
    if (jsMatch?.[1]) {
      return {
        code: jsMatch[1].trim(),
        language: 'javascript',
        found: true,
        rawResponse: response,
        confidence: 0.9,
      };
    }

    // Try to find generic code block
    const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch?.[1]) {
      return {
        code: codeMatch[1].trim(),
        language: 'unknown',
        found: true,
        rawResponse: response,
        confidence: 0.7,
      };
    }

    // Try to find code-like content (import statements, test blocks)
    const hasImport = response.includes('import ');
    const hasTest = response.includes('test(') || response.includes('describe(');
    if (hasImport && hasTest) {
      return {
        code: response.trim(),
        language: 'typescript',
        found: true,
        rawResponse: response,
        confidence: 0.5,
      };
    }

    // No code found
    return {
      code: '',
      language: 'unknown',
      found: false,
      rawResponse: response,
      confidence: 0,
    };
  }

  /**
   * Validate generated code
   */
  async validateGeneratedCode(code: string): Promise<ValidationResult> {
    // Import the CodeValidator dynamically to avoid circular dependencies
    const { CodeValidator } = await import('./code-validator.js');
    const validator = new CodeValidator();

    // Validate syntax
    const syntax = validator.validateTypeScriptSyntax(code);

    // Validate imports
    const hasPlaywrightImports = validator.validatePlaywrightImports(code);
    const imports = {
      valid: hasPlaywrightImports,
      hasPlaywrightImports,
      missingImports: hasPlaywrightImports ? [] : ['@playwright/test'],
      invalidImports: [],
    };

    // Validate structure
    const structure = validator.validateTestStructure(code);

    // Validate assertions
    const assertions = validator.validateAssertions(code);

    // Compile code
    const compilation = validator.compileCode(code);

    // Collect errors
    const errors = [
      ...(!syntax.valid
        ? syntax.errors.map((e) => ({
            message: e.message,
            type: 'syntax' as any,
            severity: 'error' as const,
            location: { line: e.line, column: e.column },
          }))
        : []),
      ...(!imports.valid
        ? [
            {
              message: 'Missing Playwright imports',
              type: 'imports' as any,
              severity: 'error' as const,
            },
          ]
        : []),
      ...(!structure.valid
        ? structure.issues.map((issue) => ({
            message: issue,
            type: 'structure' as any,
            severity: 'error' as const,
          }))
        : []),
      ...(compilation && !compilation.success
        ? compilation.errors.map((e) => ({
            message: e.message,
            type: 'compilation' as any,
            severity: 'error' as const,
            location: { line: e.line, column: e.column },
          }))
        : []),
    ];

    // Collect warnings
    const warnings = [
      ...(!assertions.valid
        ? assertions.issues.map((issue) => ({
            message: issue,
            type: 'assertions' as any,
            recommendation: 'Add more assertions to validate API responses',
          }))
        : []),
    ];

    return {
      valid:
        syntax.valid && imports.valid && structure.valid && (!compilation || compilation.success),
      syntax,
      imports,
      structure,
      assertions,
      compilation,
      errors,
      warnings,
    };
  }

  /**
   * Extract test code from parsed response
   */
  extractTestCode(code: string): string {
    // Remove any leading/trailing whitespace
    let extracted = code.trim();

    // Remove any markdown artifacts
    extracted = extracted.replace(/^```\w*\n?/gm, '');
    extracted = extracted.replace(/\n?```$/gm, '');

    // Ensure proper imports if missing
    if (!extracted.includes('import { test, expect }')) {
      extracted = `import { test, expect } from '@playwright/test';\n\n${extracted}`;
    }

    return extracted;
  }

  /**
   * Save regenerated test to file
   */
  async saveRegeneratedTest(code: string, originalFilePath: string): Promise<string> {
    try {
      // Create backup of original file
      const backupPath = originalFilePath.replace(/\.spec\.ts$/, '.original.spec.ts');
      try {
        const originalContent = await fs.readFile(originalFilePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent, 'utf-8');
      } catch (error) {
        // Original file might not exist, that's okay
      }

      // Save regenerated test
      const regeneratedPath = originalFilePath.replace(/\.spec\.ts$/, '.regenerated.spec.ts');
      await fs.writeFile(regeneratedPath, code, 'utf-8');

      return regeneratedPath;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createError(
          `Failed to save regenerated test: ${error.message}`,
          'file_write_error' as RegenerationErrorType,
          error.message
        );
      }
      throw this.createError(
        'Unknown file write error',
        'file_write_error' as RegenerationErrorType
      );
    }
  }

  /**
   * Log regeneration attempt
   */
  logRegenerationAttempt(context: RegenerationContext, result: RegenerationResult): void {
    this.regenerationLog.push({
      context,
      result,
      timestamp: new Date(),
    });

    // Keep log size reasonable (last 100 attempts)
    if (this.regenerationLog.length > 100) {
      this.regenerationLog.shift();
    }
  }

  /**
   * Track success rate metrics
   */
  trackSuccessRate(): SuccessRateMetrics {
    const byFailureType: Record<string, { attempts: number; successes: number; rate: number }> = {};

    for (const [failureType, stats] of this.metrics.byFailureType.entries()) {
      byFailureType[failureType] = {
        attempts: stats.attempts,
        successes: stats.successes,
        rate: stats.attempts > 0 ? stats.successes / stats.attempts : 0,
      };
    }

    return {
      totalAttempts: this.metrics.totalAttempts,
      successful: this.metrics.successful,
      failed: this.metrics.failed,
      rate:
        this.metrics.totalAttempts > 0 ? this.metrics.successful / this.metrics.totalAttempts : 0,
      byFailureType: byFailureType as Record<
        FailureType,
        { attempts: number; successes: number; rate: number }
      >,
    };
  }

  /**
   * Get regeneration log
   */
  getRegenerationLog(): Array<{
    context: RegenerationContext;
    result: RegenerationResult;
    timestamp: Date;
  }> {
    return this.regenerationLog.filter((log) => log !== null && log !== undefined);
  }

  /**
   * Clear metrics and log
   */
  clearMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      byFailureType: new Map(),
    };
    this.regenerationLog = [];
  }

  /**
   * Update failure type metrics
   */
  private updateFailureTypeMetrics(failureType: FailureType, success: boolean): void {
    const stats = this.metrics.byFailureType.get(failureType) || { attempts: 0, successes: 0 };
    stats.attempts++;
    if (success) {
      stats.successes++;
    }
    this.metrics.byFailureType.set(failureType, stats);
  }

  /**
   * Create a regeneration error
   */
  private createError(
    message: string,
    type: RegenerationErrorType,
    details?: string
  ): RegenerationError {
    return {
      message,
      type,
      details,
      stack: new Error().stack,
    };
  }

  /**
   * Handle errors and convert to RegenerationError
   */
  private handleError(error: unknown): RegenerationError {
    if (error && typeof error === 'object' && 'type' in error) {
      return error as RegenerationError;
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        type: 'unknown' as RegenerationErrorType,
        details: error.message,
        stack: error.stack,
      };
    }

    return {
      message: String(error),
      type: 'unknown' as RegenerationErrorType,
      details: String(error),
    };
  }
}
