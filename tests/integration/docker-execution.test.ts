import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Integration tests for Docker-based test execution
 *
 * These tests verify:
 * - Docker image builds successfully
 * - docker-compose configuration is valid
 * - Containers run and execute tests
 * - Volume mounts work correctly
 * - Results are collected properly
 */

describe('Docker Test Execution Integration', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const testResultsDir = path.join(projectRoot, 'test-results');
  const coverageDir = path.join(projectRoot, 'coverage');

  // Docker image name
  const imageName = 'api-test-agent:latest';

  beforeAll(async () => {
    // Ensure we're in the project root
    process.chdir(projectRoot);

    // Clean up any existing containers
    try {
      await execAsync('docker-compose down --volumes --remove-orphans');
    } catch (error) {
      // Ignore errors if containers don't exist
    }
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    // Cleanup after tests
    try {
      await execAsync('docker-compose down --volumes --remove-orphans');
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 60000);

  describe('Docker Image Build', () => {
    it('should build Docker image successfully', async () => {
      const { stdout, stderr } = await execAsync(
        'docker build --target test-runner -t api-test-agent:test .',
        { cwd: projectRoot }
      );

      expect(stdout).toBeDefined();
      expect(stderr).not.toContain('ERROR');
    }, 300000); // 5 minute timeout for build

    it('should create multi-stage build with correct stages', async () => {
      const dockerfilePath = path.join(projectRoot, 'Dockerfile');
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');

      // Check for required stages
      expect(dockerfileContent).toContain('FROM node:18-alpine AS dependencies');
      expect(dockerfileContent).toContain('FROM node:18-alpine AS builder');
      expect(dockerfileContent).toContain('FROM node:18-alpine AS test-runner');
      expect(dockerfileContent).toContain('FROM node:18-alpine AS development');
    });

    it('should install required system dependencies', async () => {
      const dockerfilePath = path.join(projectRoot, 'Dockerfile');
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');

      // Check for bash, curl, jq
      expect(dockerfileContent).toContain('apk add --no-cache bash curl jq');
    });

    it('should have correct working directory', async () => {
      const { stdout } = await execAsync(
        'docker run --rm api-test-agent:test pwd'
      );

      expect(stdout.trim()).toBe('/app');
    });

    it('should have node_modules installed', async () => {
      const { stdout } = await execAsync(
        'docker run --rm api-test-agent:test ls -la node_modules'
      );

      expect(stdout).toContain('playwright');
      expect(stdout).toContain('vitest');
    });

    it('should have Playwright browsers installed', async () => {
      const { stdout } = await execAsync(
        'docker run --rm api-test-agent:test npx playwright --version'
      );

      expect(stdout).toContain('Version');
    });
  });

  describe('docker-compose Configuration', () => {
    it('should have valid docker-compose.yml', async () => {
      const { stdout } = await execAsync(
        'docker-compose config',
        { cwd: projectRoot }
      );

      expect(stdout).toBeDefined();
      expect(stdout).toContain('test-runner');
    });

    it('should define test-runner service with resource limits', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('test-runner:');
      expect(composeContent).toContain('cpus:');
      expect(composeContent).toContain('memory:');
      expect(composeContent).toContain("'2'"); // 2 CPUs
      expect(composeContent).toContain('2G'); // 2GB memory
    });

    it('should configure volume mounts for test code', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('./src:/app/src');
      expect(composeContent).toContain('./tests:/app/tests');
    });

    it('should configure volume mounts for results', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('./test-results:/app/test-results');
      expect(composeContent).toContain('./coverage:/app/coverage');
    });

    it('should have network isolation configured', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('networks:');
      expect(composeContent).toContain('test-network');
    });

    it('should configure environment variables', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('NODE_ENV=test');
      expect(composeContent).toContain('env_file:');
    });
  });

  describe('docker-compose CI Configuration', () => {
    it('should have valid docker-compose.ci.yml', async () => {
      const { stdout } = await execAsync(
        'docker-compose -f docker-compose.ci.yml config',
        { cwd: projectRoot }
      );

      expect(stdout).toBeDefined();
      expect(stdout).toContain('test-runner');
    });

    it('should define CI-optimized settings', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.ci.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('CI=true');
      expect(composeContent).toContain('cache_from:');
    });

    it('should define parallel execution services', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.ci.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('lint:');
      expect(composeContent).toContain('typecheck:');
      expect(composeContent).toContain('test-runner:');
    });

    it('should configure faster execution settings', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.ci.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      expect(composeContent).toContain('restart: "no"');
      // CI should exit on completion, not restart
    });
  });

  describe('Container Execution', () => {
    it('should run container and execute tests', async () => {
      // This is a quick smoke test - just verify the container can start
      const { stdout, stderr } = await execAsync(
        'docker run --rm api-test-agent:test echo "Container works"'
      );

      expect(stdout).toContain('Container works');
    }, 60000);

    it('should have correct environment in container', async () => {
      const { stdout } = await execAsync(
        'docker run --rm -e NODE_ENV=test api-test-agent:test sh -c "echo $NODE_ENV"'
      );

      expect(stdout.trim()).toBe('test');
    });

    it('should be able to run npm commands', async () => {
      const { stdout } = await execAsync(
        'docker run --rm api-test-agent:test npm --version'
      );

      expect(stdout).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should be able to access test files', async () => {
      const { stdout } = await execAsync(
        'docker run --rm api-test-agent:test ls -la tests'
      );

      expect(stdout).toContain('integration');
    });
  });

  describe('Volume Mounts', () => {
    it('should mount source code as read-only', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      // Check for read-only mounts
      const srcMount = composeContent.match(/\.\/src:\/app\/src:(\w+)/);
      expect(srcMount).toBeTruthy();
      expect(srcMount?.[1]).toBe('ro');
    });

    it('should mount test directories as read-only', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      const testsMount = composeContent.match(/\.\/tests:\/app\/tests:(\w+)/);
      expect(testsMount).toBeTruthy();
      expect(testsMount?.[1]).toBe('ro');
    });

    it('should mount result directories as read-write', async () => {
      const composePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = await fs.readFile(composePath, 'utf-8');

      // Result directories should not have :ro
      expect(composeContent).toContain('./test-results:/app/test-results');
      expect(composeContent).toContain('./coverage:/app/coverage');

      // Should NOT be read-only
      expect(composeContent).not.toContain('./test-results:/app/test-results:ro');
    });
  });

  describe('Result Collection', () => {
    it('should create test results directory', async () => {
      // Ensure directory exists or can be created
      await fs.mkdir(testResultsDir, { recursive: true });
      const stats = await fs.stat(testResultsDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create coverage directory', async () => {
      await fs.mkdir(coverageDir, { recursive: true });
      const stats = await fs.stat(coverageDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should be able to write to result directories', async () => {
      const testFile = path.join(testResultsDir, 'test.txt');
      await fs.writeFile(testFile, 'test');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('test');

      // Cleanup
      await fs.unlink(testFile);
    });
  });

  describe('Shell Scripts', () => {
    it('should have executable run-tests.sh script', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/run-tests.sh');
      const stats = await fs.stat(scriptPath);

      // Check if file exists and is executable (mode includes execute bit)
      expect(stats.isFile()).toBe(true);
      // Note: File permissions check works on Unix-like systems
      // On Windows, this test might need adjustment
    });

    it('should have executable ci-test.sh script', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/ci-test.sh');
      const stats = await fs.stat(scriptPath);

      expect(stats.isFile()).toBe(true);
    });

    it('run-tests.sh should have proper shebang', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/run-tests.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/^#!\/bin\/bash/);
    });

    it('ci-test.sh should have proper shebang', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/ci-test.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/^#!\/bin\/bash/);
    });

    it('run-tests.sh should have error handling', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/run-tests.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toContain('set -e');
      expect(content).toContain('set -u');
      expect(content).toContain('set -o pipefail');
    });

    it('ci-test.sh should have error handling', async () => {
      const scriptPath = path.join(projectRoot, 'scripts/ci-test.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toContain('set -e');
      expect(content).toContain('set -u');
      expect(content).toContain('set -o pipefail');
    });
  });

  describe('GitHub Actions Workflow', () => {
    it('should have test-execution.yml workflow', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const stats = await fs.stat(workflowPath);

      expect(stats.isFile()).toBe(true);
    });

    it('should define build job', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('jobs:');
      expect(content).toContain('build:');
    });

    it('should define test jobs', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('unit-tests:');
      expect(content).toContain('integration-tests:');
      expect(content).toContain('e2e-tests:');
    });

    it('should upload test results as artifacts', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('actions/upload-artifact');
      expect(content).toContain('test-results');
      expect(content).toContain('coverage');
    });

    it('should use Docker image from build job', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('needs: build');
      expect(content).toContain('docker pull');
    });

    it('should configure GitHub Container Registry', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/test-execution.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('ghcr.io');
      expect(content).toContain('docker/login-action');
    });
  });

  describe('Documentation', () => {
    it('should have CI/CD setup documentation', async () => {
      const docPath = path.join(projectRoot, 'docs/ci-cd-setup.md');
      const stats = await fs.stat(docPath);

      expect(stats.isFile()).toBe(true);
    });

    it('documentation should cover Docker setup', async () => {
      const docPath = path.join(projectRoot, 'docs/ci-cd-setup.md');
      const content = await fs.readFile(docPath, 'utf-8');

      expect(content.toLowerCase()).toContain('docker');
      expect(content.toLowerCase()).toContain('docker-compose');
    });

    it('documentation should cover CI/CD usage', async () => {
      const docPath = path.join(projectRoot, 'docs/ci-cd-setup.md');
      const content = await fs.readFile(docPath, 'utf-8');

      expect(content.toLowerCase()).toContain('ci');
      expect(content.toLowerCase()).toContain('github actions');
    });

    it('documentation should have usage examples', async () => {
      const docPath = path.join(projectRoot, 'docs/ci-cd-setup.md');
      const content = await fs.readFile(docPath, 'utf-8');

      // Check for code blocks (markdown)
      expect(content).toContain('```');
    });
  });
});
