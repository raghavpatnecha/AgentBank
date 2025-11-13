#!/usr/bin/env node
/**
 * Webhook Server CLI Entry Point
 * Starts the webhook server for GitHub PR integration
 */

import { WebhookServer, createDefaultConfig } from './webhook-server.js';
import { PermissionChecker } from './permission-checker.js';
import { JobProcessor, JobWorker } from './job-processor.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['WEBHOOK_SECRET', 'GITHUB_TOKEN'];
const missing = requiredEnvVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Please set these in your .env file or environment');
  process.exit(1);
}

// Create webhook configuration
const config = createDefaultConfig(process.env.WEBHOOK_SECRET!);
config.port = parseInt(process.env.WEBHOOK_PORT || '3000');

// Create webhook server
const server = new WebhookServer(config);

// Set up permission checker
const permChecker = new PermissionChecker({ token: process.env.GITHUB_TOKEN! });
server.setPermissionChecker(permChecker);

// Set up job processor
const processor = new JobProcessor({
  defaultSpecPath: process.env.OPENAPI_SPEC_PATH || './openapi.yaml',
  defaultOutputDir: process.env.TEST_OUTPUT_DIR || './tests/generated',
  defaultBaseUrl: process.env.API_BASE_URL,
  githubToken: process.env.GITHUB_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  verbose: process.env.VERBOSE === 'true',
});

// Create job worker
const worker = new JobWorker(
  processor,
  () => server.getJobs(),
  (jobId, status) => server.updateJobStatus(jobId, status),
  { pollInterval: 5000 }
);

// Start server
async function start() {
  try {
    await server.start();
    console.log('✅ Webhook server started successfully');
    console.log(`📍 Listening on port ${config.port}`);
    console.log(`🔗 Webhook endpoint: POST http://localhost:${config.port}${config.path}`);
    console.log(`🏥 Health check: GET http://localhost:${config.port}${config.healthPath}`);

    // Start worker
    worker.start();
    console.log('🚀 Job worker started');
  } catch (error) {
    console.error('❌ Failed to start webhook server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️  Received SIGTERM, shutting down gracefully...');
  worker.stop();
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  Received SIGINT, shutting down gracefully...');
  worker.stop();
  await server.shutdown();
  process.exit(0);
});

// Start the server
start();
