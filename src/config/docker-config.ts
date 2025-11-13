/**
 * Docker Configuration for Test Execution (Feature 3.1)
 * Provides default configurations and utilities for Docker-based test isolation
 */

import type {
  DockerExecutorOptions,
  ContainerConfig,
  ContainerResources,
  NetworkConfig,
  VolumeMount,
  ContainerRetryConfig,
} from '../types/docker-types.js';
import { NetworkMode, CleanupStrategy } from '../types/docker-types.js';
import * as path from 'path';
import * as os from 'os';

/**
 * Default Docker images for different environments
 */
export const DEFAULT_DOCKER_IMAGES = {
  /** Playwright image with Node.js and browsers */
  playwright: 'mcr.microsoft.com/playwright:v1.40.0-jammy',

  /** Node.js image for API tests */
  node: 'node:20-alpine',

  /** Ubuntu with Node.js for general testing */
  ubuntu: 'ubuntu:22.04',

  /** Custom lightweight image */
  custom: 'agentbank/test-runner:latest',
} as const;

/**
 * Default resource limits for containers
 */
export const DEFAULT_RESOURCES: ContainerResources = {
  memoryMB: 2048, // 2GB
  memorySwapMB: 2048,
  cpuLimit: 2, // 2 CPUs
  cpuShares: 1024,
  pidsLimit: 256,
};

/**
 * Resource presets for different test types
 */
export const RESOURCE_PRESETS: Record<string, ContainerResources> = {
  /** Minimal resources for lightweight tests */
  minimal: {
    memoryMB: 512,
    memorySwapMB: 512,
    cpuLimit: 0.5,
    cpuShares: 512,
    pidsLimit: 128,
  },

  /** Standard resources for typical tests */
  standard: DEFAULT_RESOURCES,

  /** High resources for intensive tests */
  high: {
    memoryMB: 4096, // 4GB
    memorySwapMB: 4096,
    cpuLimit: 4,
    cpuShares: 2048,
    pidsLimit: 512,
  },

  /** Maximum resources for heavy workloads */
  maximum: {
    memoryMB: 8192, // 8GB
    memorySwapMB: 8192,
    cpuLimit: 8,
    cpuShares: 4096,
    pidsLimit: 1024,
  },
};

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK: NetworkConfig = {
  mode: NetworkMode.BRIDGE,
  dns: ['8.8.8.8', '8.8.4.4'],
  isolated: true,
};

/**
 * Network presets for different scenarios
 */
export const NETWORK_PRESETS: Record<string, NetworkConfig> = {
  /** Isolated network (no external access) */
  isolated: {
    mode: NetworkMode.NONE,
    isolated: true,
  },

  /** Bridge network (standard Docker networking) */
  bridge: DEFAULT_NETWORK,

  /** Host network (use host's network stack) */
  host: {
    mode: NetworkMode.HOST,
    isolated: false,
  },

  /** Custom network with controlled access */
  custom: {
    mode: NetworkMode.CUSTOM,
    networkName: 'agentbank-tests',
    dns: ['8.8.8.8', '8.8.4.4'],
    isolated: true,
  },
};

/**
 * Default container retry configuration
 */
export const DEFAULT_RETRY_CONFIG: ContainerRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryOnExitCodes: [125, 126, 127, 137, 139], // Common Docker/process errors
};

/**
 * Default Docker executor options
 */
export const DEFAULT_DOCKER_OPTIONS: Partial<DockerExecutorOptions> = {
  dockerImage: DEFAULT_DOCKER_IMAGES.playwright,
  isolationPerTest: false,
  resources: DEFAULT_RESOURCES,
  network: DEFAULT_NETWORK,
  cleanupStrategy: CleanupStrategy.BATCH,
  captureLogs: true,
  containerRetry: DEFAULT_RETRY_CONFIG,
  containerPrefix: 'agentbank-test',
  keepContainers: false,
  pullImage: false,
  workingDir: '/app',
  user: 'node',
  platform: 'linux/amd64',
};

/**
 * Docker configuration class
 */
export class DockerConfig {
  /**
   * Create default Docker executor options
   */
  static createDefault(): DockerExecutorOptions {
    return {
      ...DEFAULT_DOCKER_OPTIONS,
    } as DockerExecutorOptions;
  }

  /**
   * Create Docker executor options with preset
   * @param preset - Resource preset name
   * @param networkPreset - Network preset name
   */
  static createWithPreset(
    preset: keyof typeof RESOURCE_PRESETS = 'standard',
    networkPreset: keyof typeof NETWORK_PRESETS = 'bridge'
  ): DockerExecutorOptions {
    return {
      ...DEFAULT_DOCKER_OPTIONS,
      resources: RESOURCE_PRESETS[preset],
      network: NETWORK_PRESETS[networkPreset],
    } as DockerExecutorOptions;
  }

  /**
   * Create container configuration from executor options
   */
  static createContainerConfig(
    name: string,
    image: string,
    options: DockerExecutorOptions
  ): ContainerConfig {
    const testDir = options.outputDir || process.cwd();
    const volumes = this.createDefaultVolumes(testDir, options);

    return {
      name,
      image,
      env: {
        NODE_ENV: 'test',
        CI: 'true',
        PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright',
        ...options.containerEnv,
        ...options.env,
      },
      workingDir: options.workingDir || '/app',
      resources: options.resources || DEFAULT_RESOURCES,
      network: options.network || DEFAULT_NETWORK,
      volumes,
      user: options.user,
      platform: options.platform,
      labels: {
        'agentbank.test': 'true',
        'agentbank.version': '1.0.0',
        'agentbank.timestamp': new Date().toISOString(),
      },
      autoRemove: options.cleanupStrategy === CleanupStrategy.IMMEDIATE,
    };
  }

  /**
   * Create default volume mounts for test execution
   */
  static createDefaultVolumes(testDir: string, options: DockerExecutorOptions): VolumeMount[] {
    const volumes: VolumeMount[] = [];

    // Mount test directory
    volumes.push({
      hostPath: path.resolve(testDir),
      containerPath: '/app',
      mode: 'rw',
    });

    // Mount node_modules if it exists
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    volumes.push({
      hostPath: nodeModulesPath,
      containerPath: '/app/node_modules',
      mode: 'ro',
    });

    // Mount Playwright browsers cache (for Playwright image)
    if (options.dockerImage?.includes('playwright')) {
      const playwrightCache = path.join(os.homedir(), '.cache', 'ms-playwright');
      volumes.push({
        hostPath: playwrightCache,
        containerPath: '/ms-playwright',
        mode: 'ro',
      });
    }

    // Add custom volumes
    if (options.volumes) {
      volumes.push(...options.volumes);
    }

    return volumes;
  }

  /**
   * Get Docker socket path based on platform
   */
  static getDockerSocket(): string {
    if (process.platform === 'win32') {
      return '//./pipe/docker_engine';
    }
    return '/var/run/docker.sock';
  }

  /**
   * Get Docker host URL
   */
  static getDockerHost(options?: DockerExecutorOptions): string | undefined {
    if (options?.dockerHost) {
      return options.dockerHost;
    }

    // Check environment variable
    return process.env.DOCKER_HOST;
  }

  /**
   * Create container name with prefix and unique identifier
   */
  static createContainerName(prefix: string, identifier: string): string {
    const timestamp = Date.now();
    const sanitized = identifier.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    return `${prefix}-${sanitized}-${timestamp}`;
  }

  /**
   * Validate Docker executor options
   */
  static validate(options: DockerExecutorOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate memory limits
    if (options.resources?.memoryMB && options.resources.memoryMB < 128) {
      errors.push('Memory limit must be at least 128MB');
    }

    // Validate CPU limits
    if (options.resources?.cpuLimit && options.resources.cpuLimit < 0.1) {
      errors.push('CPU limit must be at least 0.1');
    }

    // Validate network mode
    if (options.network?.mode === NetworkMode.CUSTOM && !options.network.networkName) {
      errors.push('Network name is required for custom network mode');
    }

    // Validate volume mounts
    if (options.volumes) {
      for (const volume of options.volumes) {
        if (!volume.hostPath || !volume.containerPath) {
          errors.push('Volume mount must have both hostPath and containerPath');
        }
      }
    }

    // Validate retry configuration
    if (options.containerRetry) {
      const retry = options.containerRetry;
      if (retry.maxRetries < 0) {
        errors.push('Max retries must be non-negative');
      }
      if (retry.initialDelayMs < 0 || retry.maxDelayMs < 0) {
        errors.push('Retry delays must be non-negative');
      }
      if (retry.backoffMultiplier < 1) {
        errors.push('Backoff multiplier must be at least 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge Docker executor options with defaults
   */
  static mergeWithDefaults(options: Partial<DockerExecutorOptions>): DockerExecutorOptions {
    return {
      ...DEFAULT_DOCKER_OPTIONS,
      ...options,
      resources: {
        ...DEFAULT_RESOURCES,
        ...options.resources,
      },
      network: {
        ...DEFAULT_NETWORK,
        ...options.network,
      },
      containerRetry: {
        ...DEFAULT_RETRY_CONFIG,
        ...options.containerRetry,
      },
    } as DockerExecutorOptions;
  }

  /**
   * Get recommended configuration based on test characteristics
   */
  static getRecommendedConfig(params: {
    testCount: number;
    hasBrowserTests: boolean;
    hasAPITests: boolean;
    hasHeavyComputation: boolean;
    needsNetworkIsolation: boolean;
  }): DockerExecutorOptions {
    const { testCount, hasBrowserTests, hasHeavyComputation, needsNetworkIsolation } = params;

    // Determine resource preset
    let resourcePreset: keyof typeof RESOURCE_PRESETS = 'standard';
    if (hasHeavyComputation || testCount > 100) {
      resourcePreset = 'high';
    } else if (testCount < 10 && !hasBrowserTests) {
      resourcePreset = 'minimal';
    }

    // Determine network preset
    const networkPreset: keyof typeof NETWORK_PRESETS = needsNetworkIsolation
      ? 'isolated'
      : 'bridge';

    // Determine Docker image
    let dockerImage: string = DEFAULT_DOCKER_IMAGES.playwright;
    if (!hasBrowserTests) {
      dockerImage = DEFAULT_DOCKER_IMAGES.node;
    }

    // Determine isolation strategy
    const isolationPerTest = testCount < 20; // Isolate per test for small test suites

    return {
      ...this.createWithPreset(resourcePreset, networkPreset),
      dockerImage,
      isolationPerTest,
    };
  }
}

/**
 * Export default configuration instance
 */
export default DockerConfig;
