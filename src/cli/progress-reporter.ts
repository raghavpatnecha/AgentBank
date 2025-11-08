/**
 * Progress Reporter for CLI
 * Provides visual feedback during test generation
 */

import type { GenerationStatistics } from '../types/test-generator-types.js';

/**
 * Progress Reporter Class
 * Handles console output and progress updates during generation
 */
export class ProgressReporter {
  private isVerbose: boolean;

  constructor(verbose: boolean = false) {
    this.isVerbose = verbose;
  }

  /**
   * Start a new operation
   * @param message - Operation message
   */
  start(message: string): void {
    console.log(`\n${this.icon('start')} ${message}`);
  }

  /**
   * Update progress with a message
   * @param message - Progress message
   */
  update(message: string): void {
    if (this.isVerbose) {
      console.log(`  ${this.icon('progress')} ${message}`);
    }
  }

  /**
   * Report success
   * @param message - Success message
   */
  success(message: string): void {
    console.log(`${this.icon('success')} ${message}`);
  }

  /**
   * Report error
   * @param message - Error message
   */
  error(message: string): void {
    console.error(`${this.icon('error')} ${message}`);
  }

  /**
   * Report warning
   * @param message - Warning message
   */
  warning(message: string): void {
    console.warn(`${this.icon('warning')} ${message}`);
  }

  /**
   * Report info
   * @param message - Info message
   */
  info(message: string): void {
    console.log(`${this.icon('info')} ${message}`);
  }

  /**
   * Display generation summary
   * @param stats - Generation statistics
   */
  summary(stats: GenerationStatistics): void {
    const duration = this.formatDuration(stats.generationTime);

    console.log('\n' + this.separator());
    console.log(`${this.icon('summary')} Generation Summary`);
    console.log(this.separator());
    console.log(`  Total endpoints:     ${stats.endpointsProcessed}`);
    console.log(`  Total tests:         ${this.getTotalTests(stats)}`);

    // Test breakdown by type
    if (Object.keys(stats.testsByType).length > 0) {
      console.log('  Test breakdown:');
      for (const [type, count] of Object.entries(stats.testsByType)) {
        console.log(`    - ${this.formatTestType(type)}: ${count}`);
      }
    }

    console.log(`  Files generated:     ${stats.filesGenerated}`);
    console.log(`  Lines of code:       ${stats.linesOfCode.toLocaleString()}`);
    console.log(`  Generation time:     ${duration}`);
    console.log(this.separator() + '\n');
  }

  /**
   * Display file generation details
   * @param fileName - Name of the file
   * @param testCount - Number of tests in file
   */
  fileGenerated(fileName: string, testCount: number): void {
    this.success(`Generated ${fileName} (${testCount} tests)`);
  }

  /**
   * Display step completion
   * @param step - Step name
   * @param count - Item count (optional)
   */
  step(step: string, count?: number): void {
    const countStr = count !== undefined ? ` (${count})` : '';
    this.success(`${step}${countStr}`);
  }

  /**
   * Get icon for message type
   */
  private icon(type: string): string {
    const icons: Record<string, string> = {
      start: '⚡',
      progress: '⠋',
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
      summary: '📊',
    };

    return icons[type] || '•';
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format test type name
   */
  private formatTestType(type: string): string {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get total test count
   */
  private getTotalTests(stats: GenerationStatistics): number {
    return Object.values(stats.testsByType).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Create a separator line
   */
  private separator(): string {
    return '─'.repeat(50);
  }

  /**
   * Log verbose message
   * @param message - Message to log
   */
  verbose(message: string): void {
    if (this.isVerbose) {
      console.log(`  ${message}`);
    }
  }

  /**
   * Create a progress bar
   * @param current - Current progress
   * @param total - Total items
   * @param width - Bar width
   */
  progressBar(current: number, total: number, width: number = 40): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}% (${current}/${total})`;
  }

  /**
   * Display a list of items
   * @param items - Items to display
   * @param title - List title
   */
  list(items: string[], title?: string): void {
    if (title) {
      console.log(`\n${title}:`);
    }

    for (const item of items) {
      console.log(`  • ${item}`);
    }
  }

  /**
   * Clear the console
   */
  clear(): void {
    console.clear();
  }

  /**
   * Add spacing
   */
  spacing(): void {
    console.log('');
  }
}
