/**
 * Webhook Server Tests
 *
 * Comprehensive test suite for GitHub webhook server functionality.
 * Tests signature verification, event handling, job queuing, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { WebhookServer, createDefaultConfig } from '../../src/github/webhook-server.js';
import { SignatureVerifier } from '../../src/github/signature-verifier.js';
import { CommentParser } from '../../src/github/comment-parser.js';
import { PermissionChecker } from '../../src/github/permission-checker.js';
import type {
  WebhookConfig,
  IssueCommentEvent,
  PullRequestEvent,
  TestJob,
} from '../../src/types/webhook-types.js';

// Helper to create mock webhook payloads
function createMockIssueCommentEvent(
  overrides: Partial<IssueCommentEvent> = {}
): IssueCommentEvent {
  return {
    action: 'created',
    repository: {
      id: 123,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      owner: {
        id: 456,
        login: 'owner',
        type: 'User',
        site_admin: false,
        html_url: 'https://github.com/owner',
        avatar_url: 'https://avatars.githubusercontent.com/u/456',
      },
      private: false,
      html_url: 'https://github.com/owner/test-repo',
      description: 'Test repository',
      default_branch: 'main',
    },
    sender: {
      id: 789,
      login: 'testuser',
      type: 'User',
      site_admin: false,
      html_url: 'https://github.com/testuser',
      avatar_url: 'https://avatars.githubusercontent.com/u/789',
    },
    issue: {
      id: 111,
      number: 42,
      title: 'Test PR',
      state: 'open',
      user: {
        id: 789,
        login: 'testuser',
        type: 'User',
        site_admin: false,
        html_url: 'https://github.com/testuser',
        avatar_url: 'https://avatars.githubusercontent.com/u/789',
      },
      html_url: 'https://github.com/owner/test-repo/pull/42',
      pull_request: {
        url: 'https://api.github.com/repos/owner/test-repo/pulls/42',
        html_url: 'https://github.com/owner/test-repo/pull/42',
        diff_url: 'https://github.com/owner/test-repo/pull/42.diff',
        patch_url: 'https://github.com/owner/test-repo/pull/42.patch',
      },
      body: 'PR description',
      labels: [],
      assignees: [],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    comment: {
      id: 222,
      user: {
        id: 789,
        login: 'testuser',
        type: 'User',
        site_admin: false,
        html_url: 'https://github.com/testuser',
        avatar_url: 'https://avatars.githubusercontent.com/u/789',
      },
      body: '@api-test-agent run',
      html_url: 'https://github.com/owner/test-repo/pull/42#issuecomment-222',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

function createMockPullRequestEvent(overrides: Partial<PullRequestEvent> = {}): PullRequestEvent {
  return {
    action: 'opened',
    number: 42,
    repository: {
      id: 123,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      owner: {
        id: 456,
        login: 'owner',
        type: 'User',
        site_admin: false,
        html_url: 'https://github.com/owner',
        avatar_url: 'https://avatars.githubusercontent.com/u/456',
      },
      private: false,
      html_url: 'https://github.com/owner/test-repo',
      description: 'Test repository',
      default_branch: 'main',
    },
    sender: {
      id: 789,
      login: 'testuser',
      type: 'User',
      site_admin: false,
      html_url: 'https://github.com/testuser',
      avatar_url: 'https://avatars.githubusercontent.com/u/789',
    },
    pull_request: {
      id: 111,
      number: 42,
      title: 'Test PR',
      state: 'open',
      user: {
        id: 789,
        login: 'testuser',
        type: 'User',
        site_admin: false,
        html_url: 'https://github.com/testuser',
        avatar_url: 'https://avatars.githubusercontent.com/u/789',
      },
      html_url: 'https://github.com/owner/test-repo/pull/42',
      diff_url: 'https://github.com/owner/test-repo/pull/42.diff',
      patch_url: 'https://github.com/owner/test-repo/pull/42.patch',
      body: 'PR description',
      head: {
        ref: 'feature-branch',
        sha: 'abc123',
        repo: {
          id: 123,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          owner: {
            id: 456,
            login: 'owner',
            type: 'User',
            site_admin: false,
            html_url: 'https://github.com/owner',
            avatar_url: 'https://avatars.githubusercontent.com/u/456',
          },
          private: false,
          html_url: 'https://github.com/owner/test-repo',
          description: 'Test repository',
          default_branch: 'main',
        },
        label: 'owner:feature-branch',
      },
      base: {
        ref: 'main',
        sha: 'def456',
        repo: {
          id: 123,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          owner: {
            id: 456,
            login: 'owner',
            type: 'User',
            site_admin: false,
            html_url: 'https://github.com/owner',
            avatar_url: 'https://avatars.githubusercontent.com/u/456',
          },
          private: false,
          html_url: 'https://github.com/owner/test-repo',
          description: 'Test repository',
          default_branch: 'main',
        },
        label: 'owner:main',
      },
      merged: false,
      mergeable: true,
      labels: [],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      merged_at: null,
    },
    ...overrides,
  };
}

describe('WebhookServer', () => {
  let server: WebhookServer;
  let config: WebhookConfig;
  let verifier: SignatureVerifier;

  beforeEach(() => {
    config = createDefaultConfig('test-secret');
    config.logging = false; // Disable logging in tests
    server = new WebhookServer(config);
    verifier = new SignatureVerifier();
  });

  afterEach(async () => {
    if (server.isRunning()) {
      await server.shutdown();
    }
  });

  describe('Server Initialization', () => {
    it('should create server with default config', () => {
      expect(server).toBeDefined();
      expect(server.isRunning()).toBe(false);
    });

    it('should create server with custom config', () => {
      const customConfig: WebhookConfig = {
        ...config,
        port: 4000,
        path: '/custom-webhook',
      };
      const customServer = new WebhookServer(customConfig);
      expect(customServer).toBeDefined();
    });

    it('should initialize with empty stats', () => {
      const stats = server.getStats();
      expect(stats.totalReceived).toBe(0);
      expect(stats.totalProcessed).toBe(0);
      expect(stats.totalRejected).toBe(0);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server on specified port', async () => {
      await server.start(3001);
      expect(server.isRunning()).toBe(true);
    });

    it('should shutdown server gracefully', async () => {
      await server.start(3002);
      expect(server.isRunning()).toBe(true);
      await server.shutdown();
      expect(server.isRunning()).toBe(false);
    });

    it('should handle shutdown when not running', async () => {
      expect(server.isRunning()).toBe(false);
      await expect(server.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(server.getApp()).get('/health').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });

    it('should not rate limit health checks', async () => {
      // Make many health check requests
      for (let i = 0; i < 20; i++) {
        await request(server.getApp()).get('/health').expect(200);
      }

      // Should still work after many requests
      await request(server.getApp()).get('/health').expect(200);
    });
  });

  describe('Stats Endpoint', () => {
    it('should return server statistics', async () => {
      const response = await request(server.getApp()).get('/stats').expect(200);

      expect(response.body.totalReceived).toBe(0);
      expect(response.body.totalProcessed).toBe(0);
      expect(response.body.queueSize).toBe(0);
    });
  });

  describe('Jobs Endpoint', () => {
    it('should list all jobs', async () => {
      const response = await request(server.getApp()).get('/jobs').expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.jobs).toEqual([]);
    });

    it('should filter jobs by status', async () => {
      const response = await request(server.getApp()).get('/jobs?status=queued').expect(200);

      expect(response.body.total).toBe(0);
    });

    it('should get job details by ID', async () => {
      const response = await request(server.getApp()).get('/jobs/nonexistent').expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('Signature Verification', () => {
    it('should reject webhook without signature', async () => {
      const payload = createMockIssueCommentEvent();

      const response = await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .send(payload)
        .expect(401);

      expect(response.body.error).toBe('Invalid signature');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = createMockIssueCommentEvent();

      const response = await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', 'sha256=invalid')
        .send(payload)
        .expect(401);

      expect(response.body.error).toBe('Invalid signature');
    });

    it('should accept webhook with valid signature', async () => {
      const payload = createMockIssueCommentEvent();
      const payloadString = JSON.stringify(payload);
      const signature = verifier.generateSignature(payloadString, 'test-secret');

      const response = await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(response.body.message).toBe('Webhook processed successfully');
    });

    it('should track signature verification failures', async () => {
      const payload = createMockIssueCommentEvent();

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', 'sha256=invalid')
        .send(payload);

      const stats = server.getStats();
      expect(stats.signatureFailures).toBe(1);
    });
  });

  describe('Event Type Handling', () => {
    it('should reject webhook without event type header', async () => {
      const payload = createMockIssueCommentEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      const response = await request(server.getApp())
        .post('/webhook')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(400);

      expect(response.body.error).toBe('Missing X-GitHub-Event header');
    });

    it('should process issue_comment events', async () => {
      const payload = createMockIssueCommentEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const stats = server.getStats();
      expect(stats.byEventType['issue_comment']).toBe(1);
    });

    it('should process pull_request events', async () => {
      const payload = createMockPullRequestEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'pull_request')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const stats = server.getStats();
      expect(stats.byEventType['pull_request']).toBe(1);
    });

    it('should acknowledge unsupported event types', async () => {
      const payload = { action: 'opened' };
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'push')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);
    });
  });

  describe('Issue Comment Processing', () => {
    it('should ignore edited comments', async () => {
      const payload = createMockIssueCommentEvent({ action: 'edited' });
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(0);
    });

    it('should ignore deleted comments', async () => {
      const payload = createMockIssueCommentEvent({ action: 'deleted' });
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(0);
    });

    it('should ignore comments not on pull requests', async () => {
      const payload = createMockIssueCommentEvent();
      delete payload.issue.pull_request;
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(0);
    });

    it('should ignore bot comments to prevent loops', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.user.type = 'Bot';
      payload.comment.user.login = 'github-actions[bot]';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(0);
    });

    it('should ignore comments without valid commands', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = 'Just a regular comment';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(0);
    });

    it('should queue job for valid run command', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0]!.command.command).toBe('run');
    });

    it('should queue job with command arguments', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run --env staging --spec api/v2.yaml';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0]!.command.args.env).toBe('staging');
      expect(jobs[0]!.command.args.spec).toBe('api/v2.yaml');
    });
  });

  describe('Permission Checking', () => {
    it('should check permissions when permission checker is set', async () => {
      const mockChecker = {
        hasWriteAccess: vi.fn().mockResolvedValue(false),
      } as unknown as PermissionChecker;

      server.setPermissionChecker(mockChecker);

      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(mockChecker.hasWriteAccess).toHaveBeenCalled();
      expect(server.getJobs().length).toBe(0);
    });

    it('should queue job when user has permission', async () => {
      const mockChecker = {
        hasWriteAccess: vi.fn().mockResolvedValue(true),
      } as unknown as PermissionChecker;

      server.setPermissionChecker(mockChecker);

      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      expect(server.getJobs().length).toBe(1);
    });
  });

  describe('Job Management', () => {
    it('should create job with correct metadata', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      const job = jobs[0]!;

      expect(job.id).toBeDefined();
      expect(job.repository).toBe('owner/test-repo');
      expect(job.prNumber).toBe(42);
      expect(job.author).toBe('testuser');
      expect(job.status).toBe('queued');
      expect(job.metadata.commentId).toBe(222);
    });

    it('should set high priority for production environment', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run --env production';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      expect(jobs[0]!.priority).toBe('high');
    });

    it('should update job status', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      const jobId = jobs[0]!.id;

      server.updateJobStatus(jobId, 'running');
      expect(server.getJob(jobId)!.status).toBe('running');
      expect(server.getJob(jobId)!.startedAt).toBeDefined();
    });

    it('should remove job from queue', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(200);

      const jobs = server.getJobs();
      const jobId = jobs[0]!.id;

      server.removeJob(jobId);
      expect(server.getJob(jobId)).toBeUndefined();
    });

    it('should clear completed jobs', async () => {
      const payload = createMockIssueCommentEvent();
      payload.comment.body = '@api-test-agent run';
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      // Create multiple jobs
      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload);

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload);

      const jobs = server.getJobs();
      expect(jobs.length).toBe(2);

      // Mark one as completed
      server.updateJobStatus(jobs[0]!.id, 'completed');

      server.clearCompletedJobs();
      expect(server.getJobs().length).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      const payload = createMockIssueCommentEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      // Make 10 requests (max allowed)
      for (let i = 0; i < 10; i++) {
        await request(server.getApp())
          .post('/webhook')
          .set('X-GitHub-Event', 'issue_comment')
          .set('X-Hub-Signature-256', signature)
          .send(payload)
          .expect(200);
      }

      // 11th request should be rate limited
      const response = await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload)
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should track rate limit hits', async () => {
      const payload = createMockIssueCommentEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      // Exceed rate limit
      for (let i = 0; i < 11; i++) {
        await request(server.getApp())
          .post('/webhook')
          .set('X-GitHub-Event', 'issue_comment')
          .set('X-Hub-Signature-256', signature)
          .send(payload);
      }

      const stats = server.getStats();
      expect(stats.rateLimitHits).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(server.getApp()).get('/unknown').expect(404);

      expect(response.body.error).toBe('Not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(server.getApp())
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-GitHub-Event', 'issue_comment')
        .send('invalid json')
        .expect(400);
    });

    it('should track rejected webhooks', async () => {
      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .send({});

      const stats = server.getStats();
      expect(stats.totalRejected).toBeGreaterThan(0);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track total received webhooks', async () => {
      const payload = createMockIssueCommentEvent();
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload);

      const stats = server.getStats();
      expect(stats.totalReceived).toBe(1);
    });

    it('should track webhooks by event type', async () => {
      const commentPayload = createMockIssueCommentEvent();
      const prPayload = createMockPullRequestEvent();

      const sig1 = verifier.generateSignature(JSON.stringify(commentPayload), 'test-secret');
      const sig2 = verifier.generateSignature(JSON.stringify(prPayload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', sig1)
        .send(commentPayload);

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'pull_request')
        .set('X-Hub-Signature-256', sig2)
        .send(prPayload);

      const stats = server.getStats();
      expect(stats.byEventType['issue_comment']).toBe(1);
      expect(stats.byEventType['pull_request']).toBe(1);
    });

    it('should track webhooks by action', async () => {
      const payload = createMockIssueCommentEvent({ action: 'created' });
      const signature = verifier.generateSignature(JSON.stringify(payload), 'test-secret');

      await request(server.getApp())
        .post('/webhook')
        .set('X-GitHub-Event', 'issue_comment')
        .set('X-Hub-Signature-256', signature)
        .send(payload);

      const stats = server.getStats();
      expect(stats.byAction['created']).toBe(1);
    });

    it('should calculate uptime', async () => {
      const stats = server.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
