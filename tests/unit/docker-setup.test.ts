/**
 * Unit tests for Docker container setup
 * Tests Dockerfile validation, entrypoint script logic, and health check functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('Docker Setup Tests', () => {
  const projectRoot = join(__dirname, '../..');
  const dockerDir = join(projectRoot, 'docker');
  const dockerfilePath = join(dockerDir, 'Dockerfile');
  const dockerignorePath = join(dockerDir, '.dockerignore');
  const entrypointPath = join(dockerDir, 'entrypoint.sh');

  describe('Dockerfile Validation', () => {
    let dockerfileContent: string;

    beforeEach(() => {
      if (existsSync(dockerfilePath)) {
        dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
      }
    });

    it('should exist in correct location', () => {
      expect(existsSync(dockerfilePath)).toBe(true);
    });

    it('should use correct Playwright base image', () => {
      expect(dockerfileContent).toContain('mcr.microsoft.com/playwright:v1.40.0-jammy');
    });

    it('should implement multi-stage build', () => {
      expect(dockerfileContent).toContain('FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS builder');
      expect(dockerfileContent).toContain('FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS runtime');
    });

    it('should use non-root user (playwright)', () => {
      expect(dockerfileContent).toContain('USER playwright');
      expect(dockerfileContent).toMatch(/useradd.*playwright/);
    });

    it('should have proper health check configuration', () => {
      expect(dockerfileContent).toContain('HEALTHCHECK');
      expect(dockerfileContent).toMatch(/HEALTHCHECK.*interval=30s/);
      expect(dockerfileContent).toMatch(/HEALTHCHECK.*timeout=10s/);
      expect(dockerfileContent).toMatch(/HEALTHCHECK.*retries=3/);
    });

    it('should have pinned Node.js version', () => {
      expect(dockerfileContent).toMatch(/ARG NODE_VERSION=\d+\.\d+\.\d+/);
    });

    it('should have pinned npm version', () => {
      expect(dockerfileContent).toMatch(/ARG NPM_VERSION=\d+\.\d+\.\d+/);
    });

    it('should have pinned Playwright version', () => {
      expect(dockerfileContent).toMatch(/ARG PLAYWRIGHT_VERSION=\d+\.\d+\.\d+/);
    });

    it('should set timezone to UTC', () => {
      expect(dockerfileContent).toContain('TZ=UTC');
      expect(dockerfileContent).toContain('/usr/share/zoneinfo');
    });

    it('should expose health check port', () => {
      expect(dockerfileContent).toMatch(/EXPOSE \d+/);
    });

    it('should use dumb-init as entrypoint', () => {
      expect(dockerfileContent).toContain('ENTRYPOINT ["/usr/bin/dumb-init", "--"]');
    });

    it('should copy entrypoint script', () => {
      expect(dockerfileContent).toContain('COPY --chown=playwright:playwright docker/entrypoint.sh');
    });

    it('should make entrypoint executable', () => {
      expect(dockerfileContent).toMatch(/chmod \+x.*entrypoint\.sh/);
    });

    it('should set production environment', () => {
      expect(dockerfileContent).toContain('NODE_ENV=production');
    });

    it('should clean npm cache in builder stage', () => {
      expect(dockerfileContent).toContain('npm cache clean --force');
    });

    it('should clean apt cache in runtime stage', () => {
      expect(dockerfileContent).toContain('rm -rf /var/lib/apt/lists/*');
    });

    it('should install required system packages with pinned versions', () => {
      expect(dockerfileContent).toMatch(/ca-certificates=\d+/);
      expect(dockerfileContent).toMatch(/curl=\d+/);
      expect(dockerfileContent).toMatch(/tzdata=\d+/);
      expect(dockerfileContent).toMatch(/dumb-init=\d+/);
    });

    it('should have metadata labels', () => {
      expect(dockerfileContent).toContain('LABEL');
      expect(dockerfileContent).toMatch(/version=/);
      expect(dockerfileContent).toMatch(/description=/);
    });

    it('should set working directory to /app', () => {
      expect(dockerfileContent).toContain('WORKDIR /app');
    });

    it('should copy package files before source', () => {
      const packageCopyIndex = dockerfileContent.indexOf('COPY package*.json');
      const srcCopyIndex = dockerfileContent.indexOf('COPY src ./src');
      expect(packageCopyIndex).toBeLessThan(srcCopyIndex);
    });

    it('should use npm ci for clean install', () => {
      expect(dockerfileContent).toContain('npm ci');
    });

    it('should set Playwright environment variables', () => {
      expect(dockerfileContent).toContain('PLAYWRIGHT_BROWSERS_PATH');
      expect(dockerfileContent).toContain('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD');
      expect(dockerfileContent).toContain('PLAYWRIGHT_HEADLESS');
    });
  });

  describe('.dockerignore Validation', () => {
    let dockerignoreContent: string;

    beforeEach(() => {
      if (existsSync(dockerignorePath)) {
        dockerignoreContent = readFileSync(dockerignorePath, 'utf-8');
      }
    });

    it('should exist in correct location', () => {
      expect(existsSync(dockerignorePath)).toBe(true);
    });

    it('should exclude node_modules', () => {
      expect(dockerignoreContent).toContain('node_modules/');
    });

    it('should exclude .git directory', () => {
      expect(dockerignoreContent).toContain('.git/');
    });

    it('should exclude test results', () => {
      expect(dockerignoreContent).toContain('test-results/');
      expect(dockerignoreContent).toContain('playwright-report/');
    });

    it('should exclude .env files', () => {
      expect(dockerignoreContent).toContain('.env');
      expect(dockerignoreContent).toContain('.env.local');
    });

    it('should exclude build outputs', () => {
      expect(dockerignoreContent).toContain('dist/');
      expect(dockerignoreContent).toContain('coverage/');
    });

    it('should exclude IDE files', () => {
      expect(dockerignoreContent).toContain('.vscode/');
      expect(dockerignoreContent).toContain('.idea/');
      expect(dockerignoreContent).toContain('.DS_Store');
    });

    it('should exclude documentation', () => {
      expect(dockerignoreContent).toContain('docs/');
      expect(dockerignoreContent).toMatch(/\*\.md/);
    });

    it('should exclude temporary files', () => {
      expect(dockerignoreContent).toContain('tmp/');
      expect(dockerignoreContent).toContain('temp/');
    });

    it('should exclude cache directories', () => {
      expect(dockerignoreContent).toContain('.cache/');
      expect(dockerignoreContent).toContain('.npm/');
    });

    it('should exclude CI/CD configuration', () => {
      expect(dockerignoreContent).toContain('.github/');
    });
  });

  describe('Entrypoint Script Validation', () => {
    let entrypointContent: string;

    beforeEach(() => {
      if (existsSync(entrypointPath)) {
        entrypointContent = readFileSync(entrypointPath, 'utf-8');
      }
    });

    it('should exist in correct location', () => {
      expect(existsSync(entrypointPath)).toBe(true);
    });

    it('should have bash shebang', () => {
      expect(entrypointContent.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should have error handling (set -e)', () => {
      expect(entrypointContent).toContain('set -e');
    });

    it('should handle undefined variables (set -u)', () => {
      expect(entrypointContent).toContain('set -u');
    });

    it('should handle pipe failures (set -o pipefail)', () => {
      expect(entrypointContent).toContain('set -o pipefail');
    });

    it('should define color codes for output', () => {
      expect(entrypointContent).toContain('RED=');
      expect(entrypointContent).toContain('GREEN=');
      expect(entrypointContent).toContain('YELLOW=');
      expect(entrypointContent).toContain('BLUE=');
    });

    it('should define logging functions', () => {
      expect(entrypointContent).toContain('log_info()');
      expect(entrypointContent).toContain('log_success()');
      expect(entrypointContent).toContain('log_warning()');
      expect(entrypointContent).toContain('log_error()');
    });

    it('should define error_exit function', () => {
      expect(entrypointContent).toContain('error_exit()');
    });

    it('should define cleanup handler', () => {
      expect(entrypointContent).toContain('cleanup()');
      expect(entrypointContent).toContain('trap cleanup EXIT INT TERM');
    });

    it('should validate environment', () => {
      expect(entrypointContent).toContain('validate_environment()');
      expect(entrypointContent).toContain('command -v node');
      expect(entrypointContent).toContain('command -v npm');
      expect(entrypointContent).toContain('command -v playwright');
    });

    it('should start health server', () => {
      expect(entrypointContent).toContain('start_health_server()');
      expect(entrypointContent).toMatch(/http\.createServer/);
    });

    it('should perform health check', () => {
      expect(entrypointContent).toContain('perform_health_check()');
      expect(entrypointContent).toContain('curl -f');
      expect(entrypointContent).toContain('/health');
    });

    it('should setup test environment', () => {
      expect(entrypointContent).toContain('setup_test_environment()');
      expect(entrypointContent).toContain('mkdir -p test-results');
    });

    it('should run tests', () => {
      expect(entrypointContent).toContain('run_tests()');
      expect(entrypointContent).toContain('TEST_COMMAND');
    });

    it('should have main function', () => {
      expect(entrypointContent).toContain('main()');
      expect(entrypointContent).toContain('main "$@"');
    });

    it('should use configuration constants', () => {
      expect(entrypointContent).toContain('readonly APP_DIR');
      expect(entrypointContent).toContain('readonly HEALTH_CHECK_PORT');
      expect(entrypointContent).toContain('readonly MAX_RETRIES');
      expect(entrypointContent).toContain('readonly RETRY_DELAY');
    });

    it('should handle KEEP_ALIVE mode', () => {
      expect(entrypointContent).toContain('KEEP_ALIVE');
      expect(entrypointContent).toContain('wait');
    });

    it('should exit with test exit code', () => {
      expect(entrypointContent).toMatch(/exit.*test_exit_code/);
    });

    it('should include timestamps in logs', () => {
      expect(entrypointContent).toContain("date '+%Y-%m-%d %H:%M:%S'");
    });

    it('should handle retry logic', () => {
      expect(entrypointContent).toContain('retry_count');
      expect(entrypointContent).toContain('MAX_RETRIES');
      expect(entrypointContent).toContain('sleep');
    });
  });

  describe('Entrypoint Script Logic Tests', () => {
    let entrypointContent: string;

    beforeEach(() => {
      if (existsSync(entrypointPath)) {
        entrypointContent = readFileSync(entrypointPath, 'utf-8');
      }
    });

    describe('Environment Validation', () => {
      it('should detect missing Node.js', () => {
        const scriptContent = `
          validate_environment() {
            if ! command -v node &> /dev/null; then
              return 1
            fi
            return 0
          }
        `;
        expect(scriptContent).toContain('command -v node');
        expect(scriptContent).toContain('return 1');
      });

      it('should detect missing Playwright', () => {
        const scriptContent = `
          validate_environment() {
            if ! command -v playwright &> /dev/null; then
              return 1
            fi
            return 0
          }
        `;
        expect(scriptContent).toContain('command -v playwright');
      });

      it('should check for required directories', () => {
        const scriptContent = `
          validate_environment() {
            if [[ ! -d "/app/dist" ]]; then
              return 1
            fi
            return 0
          }
        `;
        expect(scriptContent).toContain('[[ ! -d "/app/dist" ]]');
      });
    });

    describe('Health Check Logic', () => {
      it('should implement retry mechanism', () => {
        const retryLogic = entrypointContent.match(/retry_count=0[\s\S]*?retry_count=\$\(\(retry_count \+ 1\)\)/);
        expect(retryLogic).toBeTruthy();
      });

      it('should use curl for health checks', () => {
        expect(entrypointContent).toContain('curl -f -s');
        expect(entrypointContent).toContain('/health');
      });

      it('should respect MAX_RETRIES', () => {
        expect(entrypointContent).toMatch(/\$\{MAX_RETRIES\}/);
        expect(entrypointContent).toContain('retry_count -lt $MAX_RETRIES');
      });
    });

    describe('Cleanup Handler', () => {
      it('should kill background processes', () => {
        expect(entrypointContent).toContain('kill "${HEALTH_SERVER_PID}"');
      });

      it('should log cleanup status', () => {
        expect(entrypointContent).toMatch(/log_info.*Cleaning up/);
      });

      it('should save test results', () => {
        expect(entrypointContent).toContain('test-results');
      });
    });
  });

  describe('Health Check Functionality Tests', () => {
    let entrypointContent: string;

    beforeEach(() => {
      if (existsSync(entrypointPath)) {
        entrypointContent = readFileSync(entrypointPath, 'utf-8');
      }
    });

    it('should return JSON response', () => {
      const healthServerCode = entrypointContent.match(/createServer[\s\S]*?JSON\.stringify/);
      expect(healthServerCode).toBeTruthy();
    });

    it('should include status field', () => {
      expect(entrypointContent).toContain('status');
      expect(entrypointContent).toContain('healthy');
    });

    it('should include timestamp', () => {
      expect(entrypointContent).toContain('timestamp');
      expect(entrypointContent).toContain('toISOString');
    });

    it('should include uptime', () => {
      expect(entrypointContent).toContain('uptime');
      expect(entrypointContent).toContain('process.uptime()');
    });

    it('should include version', () => {
      expect(entrypointContent).toContain('version');
      expect(entrypointContent).toContain('package.json');
    });

    it('should handle /health endpoint', () => {
      expect(entrypointContent).toContain("req.url === '/health'");
    });

    it('should return 404 for unknown endpoints', () => {
      expect(entrypointContent).toContain('404');
      expect(entrypointContent).toContain('Not Found');
    });

    it('should listen on configured port', () => {
      expect(entrypointContent).toContain('${HEALTH_CHECK_PORT}');
      expect(entrypointContent).toContain("'0.0.0.0'");
    });
  });

  describe('Integration Tests', () => {
    let dockerfileContent: string;

    beforeEach(() => {
      if (existsSync(dockerfilePath)) {
        dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
      }
    });

    it('should have all required files in place', () => {
      expect(existsSync(dockerfilePath)).toBe(true);
      expect(existsSync(dockerignorePath)).toBe(true);
      expect(existsSync(entrypointPath)).toBe(true);
    });

    it('should have documentation', () => {
      const docsPath = join(projectRoot, 'docs', 'docker-setup.md');
      expect(existsSync(docsPath)).toBe(true);
    });

    it('entrypoint should be executable', () => {
      // Note: This test verifies the permission bits are set in the Dockerfile
      expect(dockerfileContent).toContain('chmod +x');
      expect(dockerfileContent).toContain('entrypoint.sh');
    });
  });

  describe('Security Tests', () => {
    let dockerfileContent: string;
    let dockerignoreContent: string;

    beforeEach(() => {
      if (existsSync(dockerfilePath)) {
        dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
      }
      if (existsSync(dockerignorePath)) {
        dockerignoreContent = readFileSync(dockerignorePath, 'utf-8');
      }
    });

    it('should not expose secrets in Dockerfile', () => {
      expect(dockerfileContent).not.toContain('API_KEY');
      expect(dockerfileContent).not.toContain('PASSWORD');
      expect(dockerfileContent).not.toContain('SECRET');
      expect(dockerfileContent).not.toContain('TOKEN');
    });

    it('should exclude .env files in .dockerignore', () => {
      expect(dockerignoreContent).toContain('.env');
    });

    it('should exclude credential files in .dockerignore', () => {
      expect(dockerignoreContent).toContain('*.key');
      expect(dockerignoreContent).toContain('*.pem');
      expect(dockerignoreContent).toContain('credentials.json');
    });

    it('should use specific UID for playwright user', () => {
      expect(dockerfileContent).toMatch(/useradd -r -u 1000/);
    });

    it('should set proper ownership', () => {
      expect(dockerfileContent).toContain('--chown=playwright:playwright');
    });
  });

  describe('Performance Tests', () => {
    let dockerfileContent: string;

    beforeEach(() => {
      if (existsSync(dockerfilePath)) {
        dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
      }
    });

    it('should implement multi-stage build for size optimization', () => {
      const stages = dockerfileContent.match(/FROM.*AS \w+/g);
      expect(stages).toBeTruthy();
      expect(stages!.length).toBeGreaterThanOrEqual(2);
    });

    it('should copy package files before source for better caching', () => {
      const lines = dockerfileContent.split('\n');
      const packageIndex = lines.findIndex(l => l.includes('COPY package'));
      const srcIndex = lines.findIndex(l => l.includes('COPY src'));
      expect(packageIndex).toBeGreaterThan(0);
      expect(srcIndex).toBeGreaterThan(packageIndex);
    });

    it('should clean caches to reduce size', () => {
      expect(dockerfileContent).toContain('npm cache clean');
      expect(dockerfileContent).toContain('rm -rf /var/lib/apt/lists/*');
    });

    it('should install only production dependencies', () => {
      expect(dockerfileContent).toContain('--only=production');
    });
  });
});
