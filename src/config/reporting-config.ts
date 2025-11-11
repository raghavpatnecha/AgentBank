/**
 * Reporting Configuration
 * Loads and validates reporting configuration from files and environment
 */

import * as fs from 'fs';
import * as dotenv from 'dotenv';
import type { ReportingConfig, ReportFormat } from '../types/reporting-types.js';

dotenv.config();

export class ReportingConfigLoader {
  private config: ReportingConfig | null = null;

  loadConfig(configPath?: string): ReportingConfig {
    // Load from file if provided
    if (configPath && fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      this.config = this.mergeWithEnv(fileConfig);
    } else {
      this.config = this.mergeWithEnv(this.getDefaultConfig());
    }

    // Validate configuration
    if (!this.validateConfig(this.config)) {
      throw new Error('Invalid reporting configuration');
    }

    return this.config;
  }

  getDefaultConfig(): ReportingConfig {
    return {
      formats: ['html', 'json'],
      outputDir: './reports',
      filenamePattern: 'test-report-{timestamp}.{format}',
      timestampFormat: 'YYYY-MM-DD_HH-mm-ss',

      html: {
        includeCharts: true,
        theme: 'light',
        embedAssets: true,
        includeScreenshots: true,
        includeVideos: true,
        includeTraces: true,
        includeTimeline: true,
        title: 'Test Report',
      },

      json: {
        pretty: true,
        includeEnvironment: true,
        includeSelfHealing: true,
        includePerformance: true,
        indent: 2,
      },

      junit: {
        suiteName: 'API Tests',
        includeSystemOut: true,
        includeSystemErr: true,
        includeProperties: true,
      },

      markdown: {
        includeEnvironment: true,
        includeSummary: true,
        includeDetails: true,
        includeToc: true,
        emojis: true,
      },

      pdf: {
        format: 'A4',
        orientation: 'portrait',
        includePageNumbers: true,
        includeTimestamp: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      },

      email: {
        enabled: false,
        host: 'localhost',
        port: 587,
        secure: false,
        from: 'test@example.com',
        recipients: [],
        attachReport: true,
        attachFormats: ['html'],
        onlyOnFailure: false,
        includeScreenshots: false,
      },

      upload: {
        enabled: false,
        provider: 's3',
        uploadFormats: ['html', 'json'],
        uploadScreenshots: false,
        uploadVideos: false,
        uploadTraces: false,
      },

      retention: {
        maxReports: 100,
        maxAge: 30,
        cleanupOnGenerate: true,
        archiveOldReports: false,
      },

      parallel: true,
      compression: false,
    };
  }

  mergeWithEnv(config: ReportingConfig): ReportingConfig {
    const env = process.env;

    // Formats
    if (env.API_TEST_AGENT_REPORT_FORMATS) {
      config.formats = this.parseFormats(env.API_TEST_AGENT_REPORT_FORMATS);
    }

    // Output directory
    if (env.API_TEST_AGENT_REPORT_OUTPUT_DIR) {
      config.outputDir = env.API_TEST_AGENT_REPORT_OUTPUT_DIR;
    }

    // HTML configuration
    if (env.API_TEST_AGENT_HTML_THEME) {
      config.html.theme = env.API_TEST_AGENT_HTML_THEME as any;
    }
    if (env.API_TEST_AGENT_HTML_INCLUDE_CHARTS) {
      config.html.includeCharts = env.API_TEST_AGENT_HTML_INCLUDE_CHARTS === 'true';
    }

    // JSON configuration
    if (env.API_TEST_AGENT_JSON_PRETTY) {
      config.json.pretty = env.API_TEST_AGENT_JSON_PRETTY === 'true';
    }

    // Email configuration
    if (env.API_TEST_AGENT_EMAIL_ENABLED) {
      config.email.enabled = env.API_TEST_AGENT_EMAIL_ENABLED === 'true';
    }
    if (env.API_TEST_AGENT_EMAIL_HOST) {
      config.email.host = env.API_TEST_AGENT_EMAIL_HOST;
    }
    if (env.API_TEST_AGENT_EMAIL_PORT) {
      config.email.port = parseInt(env.API_TEST_AGENT_EMAIL_PORT, 10);
    }
    if (env.API_TEST_AGENT_EMAIL_FROM) {
      config.email.from = env.API_TEST_AGENT_EMAIL_FROM;
    }
    if (env.API_TEST_AGENT_EMAIL_RECIPIENTS) {
      config.email.recipients = env.API_TEST_AGENT_EMAIL_RECIPIENTS.split(',').map((s) => s.trim());
    }
    if (env.API_TEST_AGENT_EMAIL_ONLY_ON_FAILURE) {
      config.email.onlyOnFailure = env.API_TEST_AGENT_EMAIL_ONLY_ON_FAILURE === 'true';
    }

    // Upload configuration
    if (env.API_TEST_AGENT_UPLOAD_ENABLED) {
      config.upload.enabled = env.API_TEST_AGENT_UPLOAD_ENABLED === 'true';
    }
    if (env.API_TEST_AGENT_UPLOAD_PROVIDER) {
      config.upload.provider = env.API_TEST_AGENT_UPLOAD_PROVIDER as any;
    }

    // S3 configuration
    if (env.API_TEST_AGENT_UPLOAD_PROVIDER === 's3') {
      config.upload.s3 = {
        bucket: env.API_TEST_AGENT_S3_BUCKET || '',
        region: env.API_TEST_AGENT_S3_REGION || 'us-east-1',
        accessKeyId: env.API_TEST_AGENT_S3_ACCESS_KEY_ID || '',
        secretAccessKey: env.API_TEST_AGENT_S3_SECRET_ACCESS_KEY || '',
        prefix: env.API_TEST_AGENT_S3_PREFIX,
      };
    }

    // Retention configuration
    if (env.API_TEST_AGENT_REPORT_MAX_AGE) {
      config.retention.maxAge = parseInt(env.API_TEST_AGENT_REPORT_MAX_AGE, 10);
    }
    if (env.API_TEST_AGENT_REPORT_MAX_COUNT) {
      config.retention.maxReports = parseInt(env.API_TEST_AGENT_REPORT_MAX_COUNT, 10);
    }

    return config;
  }

  parseFormats(formats: string): ReportFormat[] {
    return formats
      .split(',')
      .map((f) => f.trim() as ReportFormat)
      .filter((f) => ['html', 'json', 'junit', 'markdown', 'pdf'].includes(f));
  }

  validateConfig(config: ReportingConfig): boolean {
    try {
      // Validate required fields
      if (!config.formats || config.formats.length === 0) {
        throw new Error('At least one report format must be specified');
      }

      if (!config.outputDir) {
        throw new Error('Output directory must be specified');
      }

      // Validate email configuration if enabled
      if (config.email.enabled) {
        if (!config.email.host) {
          throw new Error('Email host must be specified when email is enabled');
        }
        if (!config.email.from) {
          throw new Error('Email from address must be specified when email is enabled');
        }
        if (!config.email.recipients || config.email.recipients.length === 0) {
          throw new Error('At least one email recipient must be specified when email is enabled');
        }
      }

      // Validate upload configuration if enabled
      if (config.upload.enabled) {
        if (!config.upload.provider) {
          throw new Error('Upload provider must be specified when upload is enabled');
        }

        switch (config.upload.provider) {
          case 's3':
            if (!config.upload.s3?.bucket || !config.upload.s3?.region) {
              throw new Error('S3 bucket and region must be specified');
            }
            break;
          case 'gcs':
            if (!config.upload.gcs?.bucket) {
              throw new Error('GCS bucket must be specified');
            }
            break;
          case 'azure':
            if (!config.upload.azure?.accountName || !config.upload.azure?.containerName) {
              throw new Error('Azure account name and container name must be specified');
            }
            break;
          case 'http':
            if (!config.upload.http?.endpoint) {
              throw new Error('HTTP endpoint must be specified');
            }
            break;
        }
      }

      return true;
    } catch (error) {
      console.error(
        `Configuration validation error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
}

/**
 * Load reporting configuration
 */
export function loadConfig(configPath?: string): ReportingConfig {
  const loader = new ReportingConfigLoader();
  return loader.loadConfig(configPath);
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): ReportingConfig {
  const loader = new ReportingConfigLoader();
  return loader.getDefaultConfig();
}
