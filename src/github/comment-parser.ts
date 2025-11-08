/**
 * GitHub Comment Parser
 *
 * Parses GitHub PR comments to detect and extract @api-test-agent commands.
 * Validates commands and extracts arguments for test execution.
 */

import { ParsedCommand, CommandArgs, CommandType, ValidationResult } from '../types/webhook-types.js';

/**
 * Command configuration
 */
const COMMANDS: Record<CommandType, string> = {
  run: 'Run API tests',
  help: 'Show available commands',
  config: 'Show current configuration',
  retry: 'Retry failed tests',
  cancel: 'Cancel running tests',
};

/**
 * Bot mention patterns
 */
const BOT_MENTION_PATTERN = /@api-test-agent\s+/i;

/**
 * GitHub Comment Parser
 *
 * Detects @api-test-agent mentions in PR comments and parses
 * commands with arguments.
 *
 * @example
 * ```typescript
 * const parser = new CommentParser();
 * const command = parser.parse('@api-test-agent run --env staging');
 *
 * if (command && command.valid) {
 *   console.log('Command:', command.command);
 *   console.log('Environment:', command.args.env);
 * }
 * ```
 */
export class CommentParser {
  /**
   * Parse comment for bot commands
   *
   * @param comment - Comment text to parse
   * @returns Parsed command or null if no command found
   *
   * @example
   * ```typescript
   * const parser = new CommentParser();
   *
   * // Simple command
   * parser.parse('@api-test-agent run');
   * // Returns: { command: 'run', args: {}, valid: true }
   *
   * // Command with args
   * parser.parse('@api-test-agent run --env staging --spec api/v2.yaml');
   * // Returns: { command: 'run', args: { env: 'staging', spec: 'api/v2.yaml' }, valid: true }
   * ```
   */
  public parse(comment: string): ParsedCommand | null {
    if (!comment || typeof comment !== 'string') {
      return null;
    }

    // Check if comment mentions the bot
    if (!this.detectMention(comment)) {
      return null;
    }

    // Extract command text
    const commandText = this.extractCommand(comment);
    if (!commandText) {
      return null;
    }

    // Parse command and arguments
    const parts = commandText.trim().split(/\s+/);
    const commandName = parts[0]?.toLowerCase();

    if (!commandName || !this.isValidCommand(commandName)) {
      return {
        command: commandName as CommandType,
        args: {},
        rawCommand: commandText,
        valid: false,
        errors: [`Unknown command: ${commandName}. Available commands: ${Object.keys(COMMANDS).join(', ')}`],
      };
    }

    // Parse arguments
    const args = this.parseArguments(parts.slice(1).join(' '));

    // Create parsed command
    const parsed: ParsedCommand = {
      command: commandName as CommandType,
      args,
      rawCommand: commandText,
      valid: true,
    };

    // Validate command
    const validation = this.validateCommand(parsed);
    if (!validation.valid) {
      parsed.valid = false;
      parsed.errors = validation.errors;
    }

    return parsed;
  }

  /**
   * Detect bot mention in comment
   *
   * @param comment - Comment text
   * @returns true if bot is mentioned
   *
   * @example
   * ```typescript
   * const parser = new CommentParser();
   * parser.detectMention('@api-test-agent run'); // true
   * parser.detectMention('Please review this'); // false
   * parser.detectMention('cc @api-test-agent'); // true
   * ```
   */
  public detectMention(comment: string): boolean {
    if (!comment) {
      return false;
    }

    return BOT_MENTION_PATTERN.test(comment);
  }

  /**
   * Extract command text from comment
   *
   * Removes the bot mention and extracts the command portion.
   *
   * @param comment - Comment text
   * @returns Command text without bot mention
   *
   * @example
   * ```typescript
   * const parser = new CommentParser();
   * parser.extractCommand('@api-test-agent run --env staging');
   * // Returns: 'run --env staging'
   *
   * parser.extractCommand('Hey @api-test-agent help please');
   * // Returns: 'help please'
   * ```
   */
  public extractCommand(comment: string): string {
    if (!comment) {
      return '';
    }

    // Find the bot mention
    const match = comment.match(BOT_MENTION_PATTERN);
    if (!match) {
      return '';
    }

    // Get everything after the mention
    const afterMention = comment.substring(match.index! + match[0].length);

    // Extract first line (commands are single-line)
    const firstLine = afterMention.split('\n')[0] || '';

    return firstLine.trim();
  }

  /**
   * Parse command arguments
   *
   * Parses arguments in the format: --key value --flag
   *
   * @param argsString - Argument string
   * @returns Parsed arguments
   *
   * @example
   * ```typescript
   * const parser = new CommentParser();
   *
   * parser.parseArguments('--env staging --spec api/v2.yaml');
   * // Returns: { env: 'staging', spec: 'api/v2.yaml' }
   *
   * parser.parseArguments('--base-url https://api.example.com');
   * // Returns: { baseUrl: 'https://api.example.com' }
   * ```
   */
  public parseArguments(argsString: string): CommandArgs {
    const args: CommandArgs = {
      options: {},
    };

    if (!argsString) {
      return args;
    }

    // Split by -- to get argument pairs
    const parts = argsString.split(/\s+--/).filter(Boolean);

    parts.forEach(part => {
      // Handle first part (might not start with --)
      const cleaned = part.replace(/^--/, '').trim();
      if (!cleaned) return;

      // Split into key and value
      const spaceIndex = cleaned.indexOf(' ');
      if (spaceIndex === -1) {
        // Flag without value
        const key = this.normalizeArgKey(cleaned);
        if (this.isKnownArg(key)) {
          (args as any)[key] = true;
        } else {
          args.options![key] = 'true';
        }
      } else {
        // Key-value pair
        const key = this.normalizeArgKey(cleaned.substring(0, spaceIndex));
        const value = cleaned.substring(spaceIndex + 1).trim();

        if (this.isKnownArg(key)) {
          (args as any)[key] = value;
        } else {
          args.options![key] = value;
        }
      }
    });

    return args;
  }

  /**
   * Normalize argument key
   *
   * Converts kebab-case to camelCase (e.g., base-url -> baseUrl)
   *
   * @param key - Argument key
   * @returns Normalized key
   */
  private normalizeArgKey(key: string): string {
    return key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Check if argument is a known argument
   */
  private isKnownArg(key: string): boolean {
    return ['env', 'spec', 'baseUrl'].includes(key);
  }

  /**
   * Validate parsed command
   *
   * @param command - Parsed command
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const parser = new CommentParser();
   * const command = parser.parse('@api-test-agent run --env staging');
   * const validation = parser.validateCommand(command);
   *
   * if (!validation.valid) {
   *   console.error('Errors:', validation.errors);
   * }
   * ```
   */
  public validateCommand(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate command exists
    if (!this.isValidCommand(command.command)) {
      errors.push(`Invalid command: ${command.command}`);
    }

    // Validate run command arguments
    if (command.command === 'run') {
      // Validate environment
      if (command.args.env) {
        const validEnvs = ['dev', 'development', 'staging', 'stage', 'prod', 'production'];
        if (!validEnvs.includes(command.args.env.toLowerCase())) {
          warnings.push(
            `Unrecognized environment: ${command.args.env}. Common values: ${validEnvs.join(', ')}`
          );
        }
      }

      // Validate spec path
      if (command.args.spec) {
        if (!this.isValidSpecPath(command.args.spec)) {
          errors.push(`Invalid spec path: ${command.args.spec}`);
        }
      }

      // Validate base URL
      if (command.args.baseUrl) {
        if (!this.isValidUrl(command.args.baseUrl)) {
          errors.push(`Invalid base URL: ${command.args.baseUrl}`);
        }
      }
    }

    // Help and config commands should not have arguments
    if ((command.command === 'help' || command.command === 'config') &&
        Object.keys(command.args).length > 1) { // More than just 'command'
      warnings.push(`${command.command} command does not accept arguments`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if command name is valid
   */
  private isValidCommand(command: string): boolean {
    return Object.keys(COMMANDS).includes(command as CommandType);
  }

  /**
   * Validate spec path
   */
  private isValidSpecPath(path: string): boolean {
    if (!path) {
      return false;
    }

    // Check for valid file extensions
    const validExtensions = ['.yaml', '.yml', '.json'];
    const hasValidExtension = validExtensions.some(ext => path.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      return false;
    }

    // Check for path traversal attempts
    if (path.includes('..') || path.includes('~')) {
      return false;
    }

    return true;
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    if (!url) {
      return false;
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get available commands
   *
   * @returns Map of command names to descriptions
   */
  public getAvailableCommands(): Record<CommandType, string> {
    return { ...COMMANDS };
  }

  /**
   * Get command help text
   *
   * @param command - Command name
   * @returns Help text for command
   */
  public getCommandHelp(command: CommandType): string {
    const descriptions: Record<CommandType, string> = {
      run: `Run API tests
Usage: @api-test-agent run [options]
Options:
  --env <environment>    Target environment (dev, staging, production)
  --spec <path>          Path to OpenAPI spec file
  --base-url <url>       Override base URL for API
Example: @api-test-agent run --env staging --spec api/v2/openapi.yaml`,

      help: `Show available commands
Usage: @api-test-agent help`,

      config: `Show current configuration
Usage: @api-test-agent config`,

      retry: `Retry failed tests
Usage: @api-test-agent retry`,

      cancel: `Cancel running tests
Usage: @api-test-agent cancel`,
    };

    return descriptions[command] || 'No help available';
  }

  /**
   * Get full help text
   *
   * @returns Complete help documentation
   */
  public getFullHelp(): string {
    const commands = Object.entries(COMMANDS)
      .map(([name, desc]) => `  ${name.padEnd(10)} - ${desc}`)
      .join('\n');

    return `API Test Agent Commands

Available commands:
${commands}

Usage: @api-test-agent <command> [options]

For detailed help on a command:
@api-test-agent help <command>

Examples:
  @api-test-agent run
  @api-test-agent run --env staging
  @api-test-agent run --env prod --base-url https://api.example.com
  @api-test-agent help
  @api-test-agent config`;
  }

  /**
   * Check if user is a bot
   *
   * @param username - GitHub username
   * @returns true if user is a bot
   */
  public isBotUser(username: string): boolean {
    if (!username) {
      return false;
    }

    const botPatterns = [
      /\[bot\]$/i,
      /^bot-/i,
      /-bot$/i,
      /^github-actions/i,
      /^dependabot/i,
      /^renovate/i,
    ];

    return botPatterns.some(pattern => pattern.test(username));
  }
}

/**
 * Create a new comment parser
 *
 * @returns New CommentParser instance
 */
export function createCommentParser(): CommentParser {
  return new CommentParser();
}

/**
 * Parse comment (functional style)
 *
 * @param comment - Comment text
 * @returns Parsed command or null
 */
export function parseComment(comment: string): ParsedCommand | null {
  const parser = new CommentParser();
  return parser.parse(comment);
}

/**
 * Detect mention (functional style)
 *
 * @param comment - Comment text
 * @returns true if bot is mentioned
 */
export function detectBotMention(comment: string): boolean {
  const parser = new CommentParser();
  return parser.detectMention(comment);
}
