/**
 * Configuration Loader for CLI
 * Loads and validates CLI configuration from config files or command line
 */

import fs from 'fs/promises';
import path from 'path';
import type { OrganizationStrategy } from '../types/test-generator-types.js';

/**
 * CLI Configuration Interface
 */
export interface CliConfig {
  /** Path to OpenAPI specification file */
  spec: string;

  /** Output directory for generated tests */
  output: string;

  /** Include authentication tests */
  includeAuth: boolean;

  /** Include error case tests */
  includeErrors: boolean;

  /** Include edge case tests */
  includeEdgeCases: boolean;

  /** Include workflow tests */
  includeFlows: boolean;

  /** Test organization strategy */
  organizationStrategy: OrganizationStrategy;

  /** Base URL for API (optional) */
  baseUrl?: string;

  /** Additional options */
  options?: {
    /** Use fixtures */
    useFixtures?: boolean;

    /** Use hooks */
    useHooks?: boolean;

    /** Verbose output */
    verbose?: boolean;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CliConfig = {
  spec: './openapi.yaml',
  output: './tests/generated',
  includeAuth: true,
  includeErrors: true,
  includeEdgeCases: true,
  includeFlows: true,
  organizationStrategy: 'by-tag',
  options: {
    useFixtures: true,
    useHooks: true,
    verbose: false,
  },
};

/**
 * Load configuration from file and/or command line options
 *
 * @param configPath - Optional path to config file
 * @param cliOptions - Command line options (override config file)
 * @returns Resolved configuration
 */
export async function loadConfig(
  configPath?: string,
  cliOptions?: Partial<CliConfig>
): Promise<CliConfig> {
  let fileConfig: Partial<CliConfig> = {};

  // Try to load config file
  if (configPath) {
    try {
      fileConfig = await loadConfigFile(configPath);
    } catch (error) {
      throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Try to find config file in common locations
    const commonPaths = [
      'api-test-agent.config.json',
      'api-test-agent.config.js',
      '.api-test-agent.json',
    ];

    for (const commonPath of commonPaths) {
      try {
        fileConfig = await loadConfigFile(commonPath);
        break;
      } catch {
        // Continue searching
      }
    }
  }

  // Merge configurations: defaults < file config < CLI options
  const config: CliConfig = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...cliOptions,
    options: {
      ...DEFAULT_CONFIG.options,
      ...fileConfig.options,
      ...cliOptions?.options,
    },
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Load configuration from a file
 *
 * @param configPath - Path to config file
 * @returns Parsed configuration
 */
async function loadConfigFile(configPath: string): Promise<Partial<CliConfig>> {
  const absolutePath = path.resolve(process.cwd(), configPath);

  // Check if file exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const ext = path.extname(configPath).toLowerCase();

  if (ext === '.json') {
    // Load JSON config
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content);
  } else if (ext === '.js' || ext === '.mjs') {
    // Load JavaScript/ESM config
    const configModule = await import(`file://${absolutePath}`);
    return configModule.default || configModule;
  } else {
    throw new Error(`Unsupported config file format: ${ext}`);
  }
}

/**
 * Validate configuration
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: CliConfig): void {
  // Validate required fields
  if (!config.spec) {
    throw new Error('OpenAPI spec path is required');
  }

  if (!config.output) {
    throw new Error('Output directory is required');
  }

  // Validate organization strategy
  const validStrategies: OrganizationStrategy[] = ['by-endpoint', 'by-tag', 'by-type', 'by-method', 'flat'];
  if (!validStrategies.includes(config.organizationStrategy)) {
    throw new Error(
      `Invalid organization strategy: ${config.organizationStrategy}. Must be one of: ${validStrategies.join(', ')}`
    );
  }

  // Validate boolean fields
  if (typeof config.includeAuth !== 'boolean') {
    throw new Error('includeAuth must be a boolean');
  }

  if (typeof config.includeErrors !== 'boolean') {
    throw new Error('includeErrors must be a boolean');
  }

  if (typeof config.includeEdgeCases !== 'boolean') {
    throw new Error('includeEdgeCases must be a boolean');
  }

  if (typeof config.includeFlows !== 'boolean') {
    throw new Error('includeFlows must be a boolean');
  }
}

/**
 * Save configuration to file
 *
 * @param config - Configuration to save
 * @param outputPath - Path to save config
 */
export async function saveConfig(config: CliConfig, outputPath: string): Promise<void> {
  const absolutePath = path.resolve(process.cwd(), outputPath);
  const content = JSON.stringify(config, null, 2);
  await fs.writeFile(absolutePath, content, 'utf-8');
}

/**
 * Generate example config file
 *
 * @returns Example configuration as string
 */
export function generateExampleConfig(): string {
  const example: CliConfig = {
    spec: './openapi.yaml',
    output: './tests/generated',
    includeAuth: true,
    includeErrors: true,
    includeEdgeCases: true,
    includeFlows: true,
    organizationStrategy: 'by-tag',
    baseUrl: 'https://api.example.com',
    options: {
      useFixtures: true,
      useHooks: true,
      verbose: false,
    },
  };

  return JSON.stringify(example, null, 2);
}
