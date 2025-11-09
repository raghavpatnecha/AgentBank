/**
 * Unit Tests for CLI Config Loader
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, generateExampleConfig } from '../../src/cli/config-loader.js';
import type { CliConfig } from '../../src/cli/config-loader.js';

describe('CLI Config Loader', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadConfig', () => {
    it('should load default configuration when no config file provided', async () => {
      const config = await loadConfig();

      expect(config).toBeDefined();
      expect(config.spec).toBe('./openapi.yaml');
      expect(config.output).toBe('./tests/generated');
      expect(config.includeAuth).toBe(true);
      expect(config.includeErrors).toBe(true);
      expect(config.includeEdgeCases).toBe(true);
      expect(config.includeFlows).toBe(true);
      expect(config.organizationStrategy).toBe('by-tag');
    });

    it('should load JSON config file', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const testConfig: Partial<CliConfig> = {
        spec: './custom-spec.yaml',
        output: './custom-output',
        includeAuth: false,
        organizationStrategy: 'by-endpoint',
      };

      await fs.writeFile(configPath, JSON.stringify(testConfig), 'utf-8');

      const config = await loadConfig(configPath);

      expect(config.spec).toBe('./custom-spec.yaml');
      expect(config.output).toBe('./custom-output');
      expect(config.includeAuth).toBe(false);
      expect(config.organizationStrategy).toBe('by-endpoint');
    });

    it('should merge config file with CLI options', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const fileConfig: Partial<CliConfig> = {
        spec: './file-spec.yaml',
        output: './file-output',
        includeAuth: true,
      };

      await fs.writeFile(configPath, JSON.stringify(fileConfig), 'utf-8');

      const cliOptions: Partial<CliConfig> = {
        spec: './cli-spec.yaml',
        includeAuth: false,
      };

      const config = await loadConfig(configPath, cliOptions);

      // CLI options should override file config
      expect(config.spec).toBe('./cli-spec.yaml');
      expect(config.includeAuth).toBe(false);
      // File config should be used for non-overridden options
      expect(config.output).toBe('./file-output');
    });

    it('should throw error for invalid config file path', async () => {
      await expect(loadConfig('./non-existent-config.json')).rejects.toThrow();
    });

    it('should throw error for invalid organization strategy', async () => {
      const cliOptions = {
        spec: './test.yaml',
        output: './output',
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: true,
        organizationStrategy: 'invalid-strategy' as any,
      };

      await expect(loadConfig(undefined, cliOptions)).rejects.toThrow(/Invalid organization strategy/);
    });

    it('should validate required fields', async () => {
      const cliOptions = {
        spec: '',
        output: './output',
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: true,
        organizationStrategy: 'by-tag' as const,
      };

      await expect(loadConfig(undefined, cliOptions)).rejects.toThrow(/spec path is required/);
    });

    it('should validate boolean fields', async () => {
      const cliOptions = {
        spec: './test.yaml',
        output: './output',
        includeAuth: 'true' as any, // Invalid: should be boolean
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: true,
        organizationStrategy: 'by-tag' as const,
      };

      await expect(loadConfig(undefined, cliOptions)).rejects.toThrow(/must be a boolean/);
    });

    it('should merge nested options correctly', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const fileConfig: Partial<CliConfig> = {
        spec: './test.yaml',
        output: './output',
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: true,
        organizationStrategy: 'by-tag',
        options: {
          useFixtures: false,
          useHooks: false,
        },
      };

      await fs.writeFile(configPath, JSON.stringify(fileConfig), 'utf-8');

      const cliOptions: Partial<CliConfig> = {
        options: {
          verbose: true,
        },
      };

      const config = await loadConfig(configPath, cliOptions);

      expect(config.options?.useFixtures).toBe(false); // From file
      expect(config.options?.useHooks).toBe(false); // From file
      expect(config.options?.verbose).toBe(true); // From CLI
    });
  });

  describe('saveConfig', () => {
    it('should save configuration to file', async () => {
      const configPath = path.join(tempDir, 'saved-config.json');
      const config: CliConfig = {
        spec: './test-spec.yaml',
        output: './test-output',
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: true,
        organizationStrategy: 'by-tag',
        baseUrl: 'https://api.example.com',
      };

      await saveConfig(config, configPath);

      // Verify file was created
      const exists = await fileExists(configPath);
      expect(exists).toBe(true);

      // Verify content
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.spec).toBe('./test-spec.yaml');
      expect(parsed.output).toBe('./test-output');
      expect(parsed.includeAuth).toBe(true);
    });
  });

  describe('generateExampleConfig', () => {
    it('should generate valid example config', () => {
      const example = generateExampleConfig();

      expect(example).toBeTruthy();
      expect(typeof example).toBe('string');

      // Should be valid JSON
      const parsed = JSON.parse(example);

      expect(parsed.spec).toBeDefined();
      expect(parsed.output).toBeDefined();
      expect(parsed.includeAuth).toBeDefined();
      expect(parsed.organizationStrategy).toBeDefined();
    });

    it('should generate config with all required fields', () => {
      const example = generateExampleConfig();
      const parsed = JSON.parse(example);

      expect(parsed).toHaveProperty('spec');
      expect(parsed).toHaveProperty('output');
      expect(parsed).toHaveProperty('includeAuth');
      expect(parsed).toHaveProperty('includeErrors');
      expect(parsed).toHaveProperty('includeEdgeCases');
      expect(parsed).toHaveProperty('includeFlows');
      expect(parsed).toHaveProperty('organizationStrategy');
    });
  });
});

/**
 * Helper: Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
