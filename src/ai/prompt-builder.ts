/**
 * Prompt Builder for AI-powered test repair
 *
 * Constructs effective prompts for test regeneration by:
 * - Adding original test code
 * - Including failure information
 * - Providing spec changes
 * - Adding relevant spec sections
 * - Including few-shot examples
 */

import {
  BASE_TEMPLATE,
  FEW_SHOT_EXAMPLES,
  TEMPLATE_SECTIONS,
  formatFewShotExamples,
  type FewShotExample,
} from './prompt-templates.js';

/**
 * Failure analysis information
 */
export interface FailureAnalysis {
  error: string;
  statusCode?: number;
  expectedStatus?: number;
  errorMessage: string;
  stackTrace?: string;
  timestamp: number;
}

/**
 * API specification diff
 */
export interface SpecDiff {
  endpoint: string;
  changes: {
    type: 'added' | 'removed' | 'modified';
    field: string;
    oldValue?: any;
    newValue?: any;
    description: string;
  }[];
  breakingChanges: string[];
}

/**
 * Prompt context for test repair
 */
export interface PromptContext {
  originalTestCode: string;
  failureAnalysis: FailureAnalysis;
  specDiff: SpecDiff;
  relevantSpec: any;
  includeFewShot?: boolean;
  fewShotCount?: number;
}

/**
 * Prompt builder for constructing AI prompts
 */
export class PromptBuilder {
  private originalTestCode: string = '';
  private failureInfo: string = '';
  private apiChanges: string = '';
  private relevantSpec: string = '';
  private fewShotExamples: FewShotExample[] = [];
  private customSections: Partial<typeof TEMPLATE_SECTIONS> = {};

  /**
   * Build a complete test repair prompt from context
   */
  buildTestRepairPrompt(context: PromptContext): string {
    this.reset();

    this.addOriginalTestCode(context.originalTestCode);
    this.addFailureInformation(context.failureAnalysis);
    this.addSpecChanges(context.specDiff);
    this.addRelevantSpecSection(context.relevantSpec);

    if (context.includeFewShot !== false) {
      const count = context.fewShotCount || 3;
      this.addFewShotExamples(count);
    }

    return this.build();
  }

  /**
   * Add original test code
   */
  addOriginalTestCode(code: string): void {
    this.originalTestCode = code.trim();
  }

  /**
   * Add failure information
   */
  addFailureInformation(failure: FailureAnalysis): void {
    const parts: string[] = [];

    parts.push(`**Error Type:** ${failure.error}`);

    if (failure.statusCode !== undefined) {
      parts.push(`**Status Code:** ${failure.statusCode}`);
    }

    if (failure.expectedStatus !== undefined) {
      parts.push(`**Expected Status:** ${failure.expectedStatus}`);
    }

    parts.push(`**Error Message:**`);
    parts.push(failure.errorMessage);

    if (failure.stackTrace) {
      parts.push('');
      parts.push('**Stack Trace:**');
      parts.push('```');
      parts.push(failure.stackTrace);
      parts.push('```');
    }

    parts.push('');
    parts.push(`**Timestamp:** ${new Date(failure.timestamp).toISOString()}`);

    this.failureInfo = parts.join('\n');
  }

  /**
   * Add API specification changes
   */
  addSpecChanges(diff: SpecDiff): void {
    const parts: string[] = [];

    parts.push(`**Endpoint:** ${diff.endpoint}`);
    parts.push('');

    if (diff.breakingChanges.length > 0) {
      parts.push('**Breaking Changes:**');
      diff.breakingChanges.forEach((change) => {
        parts.push(`- ${change}`);
      });
      parts.push('');
    }

    parts.push('**Detailed Changes:**');

    const groupedChanges = {
      added: diff.changes.filter((c) => c.type === 'added'),
      removed: diff.changes.filter((c) => c.type === 'removed'),
      modified: diff.changes.filter((c) => c.type === 'modified'),
    };

    if (groupedChanges.added.length > 0) {
      parts.push('');
      parts.push('*Added:*');
      groupedChanges.added.forEach((change) => {
        parts.push(`- ${change.field}: ${change.description}`);
        if (change.newValue !== undefined) {
          parts.push(`  New value: ${JSON.stringify(change.newValue)}`);
        }
      });
    }

    if (groupedChanges.removed.length > 0) {
      parts.push('');
      parts.push('*Removed:*');
      groupedChanges.removed.forEach((change) => {
        parts.push(`- ${change.field}: ${change.description}`);
        if (change.oldValue !== undefined) {
          parts.push(`  Old value: ${JSON.stringify(change.oldValue)}`);
        }
      });
    }

    if (groupedChanges.modified.length > 0) {
      parts.push('');
      parts.push('*Modified:*');
      groupedChanges.modified.forEach((change) => {
        parts.push(`- ${change.field}: ${change.description}`);
        if (change.oldValue !== undefined && change.newValue !== undefined) {
          parts.push(`  Old: ${JSON.stringify(change.oldValue)}`);
          parts.push(`  New: ${JSON.stringify(change.newValue)}`);
        }
      });
    }

    this.apiChanges = parts.join('\n');
  }

  /**
   * Add relevant specification section
   */
  addRelevantSpecSection(spec: any): void {
    // Format spec as readable JSON
    this.relevantSpec = JSON.stringify(spec, null, 2);
  }

  /**
   * Add few-shot examples
   */
  addFewShotExamples(count: number = 3): void {
    this.fewShotExamples = FEW_SHOT_EXAMPLES.slice(0, count);
  }

  /**
   * Add custom template section
   */
  addCustomSection(name: keyof typeof TEMPLATE_SECTIONS, content: string): void {
    this.customSections[name] = content;
  }

  /**
   * Build the final prompt
   */
  build(): string {
    let template = BASE_TEMPLATE;

    // Replace placeholders
    template = template.replace('{originalTestCode}', this.originalTestCode);
    template = template.replace('{failureInformation}', this.failureInfo);
    template = template.replace('{apiChanges}', this.apiChanges);
    template = template.replace('{relevantSpec}', this.relevantSpec);

    // Add few-shot examples if any
    if (this.fewShotExamples.length > 0) {
      const examples = formatFewShotExamples(this.fewShotExamples);
      template = template.replace('{fewShotExamples}', `\n# EXAMPLES\n\n${examples}\n`);
    } else {
      template = template.replace('{fewShotExamples}', '');
    }

    // Apply custom sections if any
    for (const [key, value] of Object.entries(this.customSections)) {
      if (value && TEMPLATE_SECTIONS[key as keyof typeof TEMPLATE_SECTIONS]) {
        template = template.replace(
          TEMPLATE_SECTIONS[key as keyof typeof TEMPLATE_SECTIONS],
          value
        );
      }
    }

    return template;
  }

  /**
   * Reset builder state
   */
  reset(): void {
    this.originalTestCode = '';
    this.failureInfo = '';
    this.apiChanges = '';
    this.relevantSpec = '';
    this.fewShotExamples = [];
    this.customSections = {};
  }

  /**
   * Get current builder state
   */
  getState(): {
    originalTestCode: string;
    failureInfo: string;
    apiChanges: string;
    relevantSpec: string;
    fewShotCount: number;
  } {
    return {
      originalTestCode: this.originalTestCode,
      failureInfo: this.failureInfo,
      apiChanges: this.apiChanges,
      relevantSpec: this.relevantSpec,
      fewShotCount: this.fewShotExamples.length,
    };
  }

  /**
   * Validate that all required fields are set
   */
  validate(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!this.originalTestCode) {
      missing.push('originalTestCode');
    }

    if (!this.failureInfo) {
      missing.push('failureInformation');
    }

    if (!this.apiChanges) {
      missing.push('apiChanges');
    }

    if (!this.relevantSpec) {
      missing.push('relevantSpec');
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Create a builder from existing prompt context
   */
  static fromContext(context: PromptContext): PromptBuilder {
    const builder = new PromptBuilder();
    builder.addOriginalTestCode(context.originalTestCode);
    builder.addFailureInformation(context.failureAnalysis);
    builder.addSpecChanges(context.specDiff);
    builder.addRelevantSpecSection(context.relevantSpec);

    if (context.includeFewShot !== false) {
      builder.addFewShotExamples(context.fewShotCount || 3);
    }

    return builder;
  }

  /**
   * Build a minimal prompt without examples
   */
  buildMinimalPrompt(context: PromptContext): string {
    this.reset();

    this.addOriginalTestCode(context.originalTestCode);
    this.addFailureInformation(context.failureAnalysis);
    this.addSpecChanges(context.specDiff);
    this.addRelevantSpecSection(context.relevantSpec);

    // Don't add few-shot examples for minimal prompt

    return this.build();
  }

  /**
   * Estimate token count for prompt (rough estimation)
   */
  estimateTokenCount(): number {
    const prompt = this.build();
    // Rough estimation: ~4 characters per token
    return Math.ceil(prompt.length / 4);
  }
}
