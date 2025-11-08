/**
 * Comment Parser Tests
 *
 * Comprehensive test suite for GitHub comment parsing functionality.
 * Tests @mention detection, command extraction, argument parsing, and validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CommentParser,
  createCommentParser,
  parseComment,
  detectBotMention,
} from '../../src/github/comment-parser.js';
import type { ParsedCommand, CommandType } from '../../src/types/webhook-types.js';

describe('CommentParser', () => {
  let parser: CommentParser;

  beforeEach(() => {
    parser = new CommentParser();
  });

  describe('Bot Mention Detection', () => {
    it('should detect simple bot mention', () => {
      expect(parser.detectMention('@api-test-agent run')).toBe(true);
    });

    it('should detect bot mention with extra whitespace', () => {
      expect(parser.detectMention('@api-test-agent  run')).toBe(true);
    });

    it('should detect bot mention in middle of comment', () => {
      expect(parser.detectMention('Hey @api-test-agent run please')).toBe(true);
    });

    it('should detect bot mention at end of comment', () => {
      expect(parser.detectMention('Please test this @api-test-agent run')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(parser.detectMention('@API-TEST-AGENT run')).toBe(true);
      expect(parser.detectMention('@Api-Test-Agent run')).toBe(true);
    });

    it('should not detect partial mentions', () => {
      expect(parser.detectMention('@api-test')).toBe(false);
      expect(parser.detectMention('api-test-agent')).toBe(false);
    });

    it('should not detect mentions without @', () => {
      expect(parser.detectMention('api-test-agent run')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(parser.detectMention('')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(parser.detectMention(null as any)).toBe(false);
    });

    it('should detect mention in multiline comment', () => {
      const comment = `This looks good!
@api-test-agent run
Thanks!`;
      expect(parser.detectMention(comment)).toBe(true);
    });
  });

  describe('Command Extraction', () => {
    it('should extract simple command', () => {
      const command = parser.extractCommand('@api-test-agent run');
      expect(command).toBe('run');
    });

    it('should extract command with arguments', () => {
      const command = parser.extractCommand('@api-test-agent run --env staging');
      expect(command).toBe('run --env staging');
    });

    it('should extract only first line of command', () => {
      const comment = `@api-test-agent run --env staging
This is a second line`;
      const command = parser.extractCommand(comment);
      expect(command).toBe('run --env staging');
    });

    it('should handle extra whitespace', () => {
      const command = parser.extractCommand('@api-test-agent   run   --env   staging');
      expect(command.trim()).toBeTruthy();
    });

    it('should return empty for no mention', () => {
      const command = parser.extractCommand('Just a comment');
      expect(command).toBe('');
    });

    it('should handle mention at end of text', () => {
      const command = parser.extractCommand('Please test @api-test-agent run');
      expect(command).toBe('run');
    });

    it('should extract help command', () => {
      const command = parser.extractCommand('@api-test-agent help');
      expect(command).toBe('help');
    });

    it('should extract config command', () => {
      const command = parser.extractCommand('@api-test-agent config');
      expect(command).toBe('config');
    });

    it('should extract retry command', () => {
      const command = parser.extractCommand('@api-test-agent retry');
      expect(command).toBe('retry');
    });

    it('should extract cancel command', () => {
      const command = parser.extractCommand('@api-test-agent cancel');
      expect(command).toBe('cancel');
    });
  });

  describe('Argument Parsing', () => {
    it('should parse single argument', () => {
      const args = parser.parseArguments('--env staging');
      expect(args.env).toBe('staging');
    });

    it('should parse multiple arguments', () => {
      const args = parser.parseArguments('--env staging --spec api/v2.yaml');
      expect(args.env).toBe('staging');
      expect(args.spec).toBe('api/v2.yaml');
    });

    it('should parse base-url argument (kebab-case to camelCase)', () => {
      const args = parser.parseArguments('--base-url https://api.example.com');
      expect(args.baseUrl).toBe('https://api.example.com');
    });

    it('should parse all known arguments', () => {
      const args = parser.parseArguments('--env prod --spec openapi.yaml --base-url https://api.example.com');
      expect(args.env).toBe('prod');
      expect(args.spec).toBe('openapi.yaml');
      expect(args.baseUrl).toBe('https://api.example.com');
    });

    it('should parse unknown arguments into options', () => {
      const args = parser.parseArguments('--custom-option value');
      expect(args.options).toBeDefined();
      expect(args.options!['customOption']).toBe('value');
    });

    it('should handle flags without values', () => {
      const args = parser.parseArguments('--verbose');
      expect(args.options!['verbose']).toBe('true');
    });

    it('should handle empty argument string', () => {
      const args = parser.parseArguments('');
      expect(args).toBeDefined();
      expect(args.command).toBe('run'); // Default value
    });

    it('should handle URL arguments with special characters', () => {
      const args = parser.parseArguments('--base-url https://api.example.com/v2?key=value&other=test');
      expect(args.baseUrl).toBeTruthy();
    });

    it('should parse file path arguments', () => {
      const args = parser.parseArguments('--spec api/v2/openapi.yaml');
      expect(args.spec).toBe('api/v2/openapi.yaml');
    });

    it('should handle multiple spaces between arguments', () => {
      const args = parser.parseArguments('--env   staging   --spec   api.yaml');
      expect(args.env).toBe('staging');
      expect(args.spec).toBe('api.yaml');
    });
  });

  describe('Command Parsing', () => {
    it('should parse simple run command', () => {
      const result = parser.parse('@api-test-agent run');
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
      expect(result!.valid).toBe(true);
    });

    it('should parse run command with env argument', () => {
      const result = parser.parse('@api-test-agent run --env staging');
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
      expect(result!.args.env).toBe('staging');
      expect(result!.valid).toBe(true);
    });

    it('should parse run command with multiple arguments', () => {
      const result = parser.parse('@api-test-agent run --env production --spec api/openapi.yaml --base-url https://api.example.com');
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
      expect(result!.args.env).toBe('production');
      expect(result!.args.spec).toBe('api/openapi.yaml');
      expect(result!.args.baseUrl).toBe('https://api.example.com');
    });

    it('should parse help command', () => {
      const result = parser.parse('@api-test-agent help');
      expect(result).toBeDefined();
      expect(result!.command).toBe('help');
      expect(result!.valid).toBe(true);
    });

    it('should parse config command', () => {
      const result = parser.parse('@api-test-agent config');
      expect(result).toBeDefined();
      expect(result!.command).toBe('config');
    });

    it('should parse retry command', () => {
      const result = parser.parse('@api-test-agent retry');
      expect(result).toBeDefined();
      expect(result!.command).toBe('retry');
    });

    it('should parse cancel command', () => {
      const result = parser.parse('@api-test-agent cancel');
      expect(result).toBeDefined();
      expect(result!.command).toBe('cancel');
    });

    it('should return null for comments without mention', () => {
      const result = parser.parse('Just a regular comment');
      expect(result).toBeNull();
    });

    it('should mark unknown commands as invalid', () => {
      const result = parser.parse('@api-test-agent unknown-command');
      expect(result).toBeDefined();
      expect(result!.valid).toBe(false);
      expect(result!.errors).toBeDefined();
      expect(result!.errors!.length).toBeGreaterThan(0);
    });

    it('should include raw command in result', () => {
      const result = parser.parse('@api-test-agent run --env staging');
      expect(result!.rawCommand).toBe('run --env staging');
    });

    it('should handle empty string input', () => {
      const result = parser.parse('');
      expect(result).toBeNull();
    });

    it('should handle null input', () => {
      const result = parser.parse(null as any);
      expect(result).toBeNull();
    });

    it('should handle multiline comment', () => {
      const comment = `This PR looks good!
@api-test-agent run --env staging
Thanks for the review!`;
      const result = parser.parse(comment);
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
      expect(result!.args.env).toBe('staging');
    });
  });

  describe('Command Validation', () => {
    it('should validate simple run command', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: {},
        rawCommand: 'run',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should warn for unrecognized environment', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { env: 'unknown-env' },
        rawCommand: 'run --env unknown-env',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate recognized environments', () => {
      const envs = ['dev', 'development', 'staging', 'stage', 'prod', 'production'];
      envs.forEach(env => {
        const command: ParsedCommand = {
          command: 'run',
          args: { env },
          rawCommand: `run --env ${env}`,
          valid: true,
        };
        const result = parser.validateCommand(command);
        expect(result.warnings.length).toBe(0);
      });
    });

    it('should reject invalid spec paths', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { spec: 'invalid.txt' },
        rawCommand: 'run --spec invalid.txt',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid YAML spec paths', () => {
      const paths = ['api.yaml', 'api.yml', 'api/v2/openapi.yaml'];
      paths.forEach(spec => {
        const command: ParsedCommand = {
          command: 'run',
          args: { spec },
          rawCommand: `run --spec ${spec}`,
          valid: true,
        };
        const result = parser.validateCommand(command);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should accept valid JSON spec paths', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { spec: 'api/openapi.json' },
        rawCommand: 'run --spec api/openapi.json',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.errors.length).toBe(0);
    });

    it('should reject path traversal attempts', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { spec: '../../../etc/passwd' },
        rawCommand: 'run --spec ../../../etc/passwd',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { baseUrl: 'not-a-url' },
        rawCommand: 'run --base-url not-a-url',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.valid).toBe(false);
    });

    it('should accept valid HTTP URLs', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { baseUrl: 'http://api.example.com' },
        rawCommand: 'run --base-url http://api.example.com',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.errors.length).toBe(0);
    });

    it('should accept valid HTTPS URLs', () => {
      const command: ParsedCommand = {
        command: 'run',
        args: { baseUrl: 'https://api.example.com' },
        rawCommand: 'run --base-url https://api.example.com',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.errors.length).toBe(0);
    });

    it('should reject unknown commands', () => {
      const command: ParsedCommand = {
        command: 'unknown' as CommandType,
        args: {},
        rawCommand: 'unknown',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.valid).toBe(false);
    });

    it('should warn when help command has arguments', () => {
      const command: ParsedCommand = {
        command: 'help',
        args: { env: 'staging' },
        rawCommand: 'help --env staging',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn when config command has arguments', () => {
      const command: ParsedCommand = {
        command: 'config',
        args: { env: 'staging' },
        rawCommand: 'config --env staging',
        valid: true,
      };
      const result = parser.validateCommand(command);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Bot User Detection', () => {
    it('should detect [bot] suffix', () => {
      expect(parser.isBotUser('github-actions[bot]')).toBe(true);
      expect(parser.isBotUser('dependabot[bot]')).toBe(true);
    });

    it('should detect bot- prefix', () => {
      expect(parser.isBotUser('bot-tester')).toBe(true);
    });

    it('should detect -bot suffix', () => {
      expect(parser.isBotUser('my-bot')).toBe(true);
    });

    it('should detect github-actions prefix', () => {
      expect(parser.isBotUser('github-actions')).toBe(true);
    });

    it('should detect dependabot prefix', () => {
      expect(parser.isBotUser('dependabot')).toBe(true);
    });

    it('should detect renovate prefix', () => {
      expect(parser.isBotUser('renovate')).toBe(true);
    });

    it('should not detect regular users', () => {
      expect(parser.isBotUser('octocat')).toBe(false);
      expect(parser.isBotUser('john-doe')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(parser.isBotUser('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(parser.isBotUser('GITHUB-ACTIONS[BOT]')).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should get available commands', () => {
      const commands = parser.getAvailableCommands();
      expect(commands.run).toBeDefined();
      expect(commands.help).toBeDefined();
      expect(commands.config).toBeDefined();
      expect(commands.retry).toBeDefined();
      expect(commands.cancel).toBeDefined();
    });

    it('should get command help text', () => {
      const help = parser.getCommandHelp('run');
      expect(help).toContain('Run API tests');
      expect(help).toContain('Usage');
    });

    it('should get help for all commands', () => {
      const commands: CommandType[] = ['run', 'help', 'config', 'retry', 'cancel'];
      commands.forEach(cmd => {
        const help = parser.getCommandHelp(cmd);
        expect(help.length).toBeGreaterThan(0);
      });
    });

    it('should get full help text', () => {
      const help = parser.getFullHelp();
      expect(help).toContain('API Test Agent Commands');
      expect(help).toContain('Available commands');
      expect(help).toContain('Examples');
    });

    it('should include examples in full help', () => {
      const help = parser.getFullHelp();
      expect(help).toContain('@api-test-agent run');
      expect(help).toContain('@api-test-agent help');
    });
  });

  describe('Factory Functions', () => {
    it('should create parser with factory function', () => {
      const newParser = createCommentParser();
      expect(newParser).toBeInstanceOf(CommentParser);
    });

    it('should parse comment with functional style', () => {
      const result = parseComment('@api-test-agent run');
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
    });

    it('should detect mention with functional style', () => {
      const result = detectBotMention('@api-test-agent run');
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters in comments', () => {
      const result = parser.parse('@api-test-agent run --env staging 🚀');
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
    });

    it('should handle very long commands', () => {
      const longUrl = 'https://api.example.com/' + 'a'.repeat(1000);
      const result = parser.parse(`@api-test-agent run --base-url ${longUrl}`);
      expect(result).toBeDefined();
    });

    it('should handle special characters in arguments', () => {
      const result = parser.parse('@api-test-agent run --base-url https://api.example.com/v2?key=value&other=test');
      expect(result).toBeDefined();
      expect(result!.args.baseUrl).toBeTruthy();
    });

    it('should handle multiple mentions in same comment', () => {
      // Should only process the first mention
      const comment = '@api-test-agent run and also @api-test-agent help';
      const result = parser.parse(comment);
      expect(result).toBeDefined();
      expect(result!.command).toBe('run');
    });

    it('should handle tabs and newlines', () => {
      const comment = '@api-test-agent\trun\t--env\tstaging';
      const result = parser.parse(comment);
      expect(result).toBeDefined();
    });
  });
});
