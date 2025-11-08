#!/usr/bin/env node

/**
 * API Test Agent CLI
 * Entry point for the command-line interface
 */

import { Command } from 'commander';
import { createGenerateCommand } from './generate-command.js';

const program = new Command();

program
  .name('api-test-agent')
  .description('AI-powered API test generator for Playwright')
  .version('0.1.0');

// Add commands
program.addCommand(createGenerateCommand());

// Add examples
program.addHelpText(
  'after',
  `
Examples:
  $ api-test-agent generate --spec ./openapi.yaml
  $ api-test-agent generate -s ./petstore.yaml -o ./tests/api
  $ api-test-agent generate -s ./api.yaml --organization by-tag
  $ api-test-agent generate -c ./api-test-agent.config.json
  $ api-test-agent generate -s ./api.yaml --no-auth --no-flows

Documentation:
  Visit https://github.com/your-repo/api-test-agent for full documentation
`
);

// Parse command line arguments
program.parse();
