/**
 * GitHub Client Tests
 * Comprehensive test coverage for GitHubClient
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GitHubClient } from '../../src/github/github-client.js';
import type {
  PullRequest,
  Comment,
  CheckRun,
  PRFile,
  Repository,
  Permission,
  RateLimitResponse,
} from '../../src/types/github-types.js';

// Mock Octokit
vi.mock('@octokit/rest', () => {
  const mockOctokit = {
    rest: {
      pulls: {
        get: vi.fn(),
        listFiles: vi.fn(),
        listReviews: vi.fn(),
        createReview: vi.fn(),
      },
      repos: {
        getContent: vi.fn(),
        get: vi.fn(),
        getCollaboratorPermissionLevel: vi.fn(),
      },
      issues: {
        createComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      },
      checks: {
        create: vi.fn(),
        update: vi.fn(),
      },
      rateLimit: {
        get: vi.fn(),
      },
      users: {
        getAuthenticated: vi.fn(),
      },
    },
  };

  return {
    Octokit: {
      plugin: () => {
        return class {
          rest = mockOctokit.rest;
          constructor() {}
        };
      },
    },
  };
});

vi.mock('@octokit/plugin-retry', () => ({
  retry: vi.fn(),
}));

vi.mock('@octokit/plugin-throttling', () => ({
  throttling: vi.fn(),
}));

describe('GitHubClient', () => {
  let client: GitHubClient;
  let mockOctokit: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create client
    client = new GitHubClient('test-token');

    // Get mock instance
    mockOctokit = (client as any).octokit;

    // Setup default rate limit response
    mockOctokit.rest.rateLimit.get.mockResolvedValue({
      data: {
        rate: {
          limit: 5000,
          remaining: 4900,
          reset: Math.floor(Date.now() / 1000) + 3600,
          used: 100,
        },
        resources: {
          core: {
            limit: 5000,
            remaining: 4900,
            reset: Math.floor(Date.now() / 1000) + 3600,
            used: 100,
          },
        },
      } as RateLimitResponse,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create client with token', () => {
      expect(client).toBeInstanceOf(GitHubClient);
    });

    it('should throw error without token', () => {
      expect(() => new GitHubClient('')).toThrow('GitHub token is required');
    });

    it('should accept custom configuration', () => {
      const customClient = new GitHubClient('test-token', {
        baseUrl: 'https://github.enterprise.com/api/v3',
        timeout: 60000,
        maxRetries: 5,
      });

      expect(customClient).toBeInstanceOf(GitHubClient);
    });
  });

  describe('getPullRequest', () => {
    const mockPR: Partial<PullRequest> = {
      id: 1,
      number: 123,
      title: 'Test PR',
      state: 'open',
      html_url: 'https://github.com/owner/repo/pull/123',
      user: {
        login: 'testuser',
        id: 1,
        node_id: 'node1',
        avatar_url: 'https://github.com/avatar.png',
        gravatar_id: '',
        url: 'https://api.github.com/users/testuser',
        html_url: 'https://github.com/testuser',
        type: 'User',
        site_admin: false,
      },
    };

    it('should fetch pull request successfully', async () => {
      mockOctokit.rest.pulls.get.mockResolvedValue({ data: mockPR });

      const result = await client.getPullRequest('owner', 'repo', 123);

      expect(result).toEqual(mockPR);
      expect(mockOctokit.rest.pulls.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      });
    });

    it('should validate required parameters', async () => {
      await expect(
        client.getPullRequest('', 'repo', 123)
      ).rejects.toThrow("Parameter 'owner' is required");

      await expect(
        client.getPullRequest('owner', '', 123)
      ).rejects.toThrow("Parameter 'repo' is required");

      await expect(
        client.getPullRequest('owner', 'repo', -1)
      ).rejects.toThrow("Parameter 'number' must be a valid positive number");
    });

    it('should handle API errors', async () => {
      mockOctokit.rest.pulls.get.mockRejectedValue({
        status: 404,
        message: 'Not Found',
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
      });

      await expect(
        client.getPullRequest('owner', 'repo', 999)
      ).rejects.toThrow('GitHub API error during getPullRequest');
    });
  });

  describe('getFileContent', () => {
    it('should fetch file content successfully', async () => {
      const fileContent = 'console.log("Hello World");';
      const base64Content = Buffer.from(fileContent).toString('base64');

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          type: 'file',
          content: base64Content,
          encoding: 'base64',
          name: 'test.js',
          path: 'src/test.js',
          sha: 'abc123',
        },
      });

      const result = await client.getFileContent('owner', 'repo', 'src/test.js');

      expect(result).toBe(fileContent);
      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'src/test.js',
        ref: undefined,
      });
    });

    it('should fetch file content with ref', async () => {
      const fileContent = 'test content';
      const base64Content = Buffer.from(fileContent).toString('base64');

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          type: 'file',
          content: base64Content,
          encoding: 'base64',
        },
      });

      await client.getFileContent('owner', 'repo', 'file.txt', 'main');

      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'file.txt',
        ref: 'main',
      });
    });

    it('should throw error for non-file types', async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          type: 'dir',
          name: 'src',
        },
      });

      await expect(
        client.getFileContent('owner', 'repo', 'src')
      ).rejects.toThrow('Path src is not a file (type: dir)');
    });

    it('should throw error if content is missing', async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          type: 'file',
          name: 'empty.txt',
        },
      });

      await expect(
        client.getFileContent('owner', 'repo', 'empty.txt')
      ).rejects.toThrow('No content available for file empty.txt');
    });
  });

  describe('postComment', () => {
    const mockComment: Partial<Comment> = {
      id: 1,
      body: 'Test comment',
      user: {
        login: 'testuser',
        id: 1,
        node_id: 'node1',
        avatar_url: 'https://github.com/avatar.png',
        gravatar_id: '',
        url: 'https://api.github.com/users/testuser',
        html_url: 'https://github.com/testuser',
        type: 'User',
        site_admin: false,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should post comment successfully', async () => {
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: mockComment });

      const result = await client.postComment('owner', 'repo', 123, 'Test comment');

      expect(result).toEqual(mockComment);
      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        body: 'Test comment',
      });
    });

    it('should reject empty comment body', async () => {
      await expect(
        client.postComment('owner', 'repo', 123, '')
      ).rejects.toThrow('Comment body cannot be empty');

      await expect(
        client.postComment('owner', 'repo', 123, '   ')
      ).rejects.toThrow('Comment body cannot be empty');
    });

    it('should validate required parameters', async () => {
      await expect(
        client.postComment('', 'repo', 123, 'comment')
      ).rejects.toThrow("Parameter 'owner' is required");
    });
  });

  describe('updateComment', () => {
    const mockComment: Partial<Comment> = {
      id: 1,
      body: 'Updated comment',
      updated_at: '2024-01-02T00:00:00Z',
    };

    it('should update comment successfully', async () => {
      mockOctokit.rest.issues.updateComment.mockResolvedValue({ data: mockComment });

      const result = await client.updateComment('owner', 'repo', 1, 'Updated comment');

      expect(result).toEqual(mockComment);
      expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        comment_id: 1,
        body: 'Updated comment',
      });
    });

    it('should reject empty comment body', async () => {
      await expect(
        client.updateComment('owner', 'repo', 1, '')
      ).rejects.toThrow('Comment body cannot be empty');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      mockOctokit.rest.issues.deleteComment.mockResolvedValue({});

      await client.deleteComment('owner', 'repo', 1);

      expect(mockOctokit.rest.issues.deleteComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        comment_id: 1,
      });
    });

    it('should validate required parameters', async () => {
      await expect(
        client.deleteComment('', 'repo', 1)
      ).rejects.toThrow("Parameter 'owner' is required");
    });
  });

  describe('createCheckRun', () => {
    const mockCheckRun: Partial<CheckRun> = {
      id: 1,
      name: 'Test Check',
      head_sha: 'abc123',
      status: 'in_progress',
      conclusion: null,
      started_at: '2024-01-01T00:00:00Z',
    };

    it('should create check run successfully', async () => {
      mockOctokit.rest.checks.create.mockResolvedValue({ data: mockCheckRun });

      const result = await client.createCheckRun('owner', 'repo', {
        name: 'Test Check',
        head_sha: 'abc123',
        status: 'in_progress',
      });

      expect(result).toEqual(mockCheckRun);
      expect(mockOctokit.rest.checks.create).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        name: 'Test Check',
        head_sha: 'abc123',
        status: 'in_progress',
      });
    });

    it('should validate check run name', async () => {
      await expect(
        client.createCheckRun('owner', 'repo', {
          name: '',
          head_sha: 'abc123',
        })
      ).rejects.toThrow('Check run name is required');
    });

    it('should validate head_sha', async () => {
      await expect(
        client.createCheckRun('owner', 'repo', {
          name: 'Test',
          head_sha: '',
        })
      ).rejects.toThrow('Check run head_sha is required');
    });

    it('should validate conclusion requires completed status', async () => {
      await expect(
        client.createCheckRun('owner', 'repo', {
          name: 'Test',
          head_sha: 'abc123',
          status: 'in_progress',
          conclusion: 'success',
        })
      ).rejects.toThrow('Check run conclusion can only be set when status is completed');
    });

    it('should require conclusion when status is completed', async () => {
      await expect(
        client.createCheckRun('owner', 'repo', {
          name: 'Test',
          head_sha: 'abc123',
          status: 'completed',
        })
      ).rejects.toThrow('Check run conclusion is required when status is completed');
    });
  });

  describe('updateCheckRun', () => {
    const mockCheckRun: Partial<CheckRun> = {
      id: 1,
      name: 'Test Check',
      status: 'completed',
      conclusion: 'success',
      completed_at: '2024-01-01T01:00:00Z',
    };

    it('should update check run successfully', async () => {
      mockOctokit.rest.checks.update.mockResolvedValue({ data: mockCheckRun });

      const result = await client.updateCheckRun('owner', 'repo', 1, {
        status: 'completed',
        conclusion: 'success',
      });

      expect(result).toEqual(mockCheckRun);
      expect(mockOctokit.rest.checks.update).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        check_run_id: 1,
        status: 'completed',
        conclusion: 'success',
      });
    });

    it('should validate required parameters', async () => {
      await expect(
        client.updateCheckRun('', 'repo', 1, { status: 'completed' })
      ).rejects.toThrow("Parameter 'owner' is required");
    });
  });

  describe('listPRFiles', () => {
    const mockFiles: Partial<PRFile>[] = [
      {
        sha: 'abc123',
        filename: 'file1.ts',
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
      },
      {
        sha: 'def456',
        filename: 'file2.ts',
        status: 'added',
        additions: 20,
        deletions: 0,
        changes: 20,
      },
    ];

    it('should list PR files successfully', async () => {
      mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

      const result = await client.listPRFiles('owner', 'repo', 123);

      expect(result).toEqual(mockFiles);
      expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        per_page: 100,
        page: 1,
      });
    });

    it('should handle pagination', async () => {
      const page1 = Array(100).fill(mockFiles[0]);
      const page2 = [mockFiles[1]];

      mockOctokit.rest.pulls.listFiles
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 });

      const result = await client.listPRFiles('owner', 'repo', 123);

      expect(result).toHaveLength(101);
      expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRepoInfo', () => {
    const mockRepo: Partial<Repository> = {
      id: 1,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      private: false,
      html_url: 'https://github.com/owner/test-repo',
    };

    it('should get repository info successfully', async () => {
      mockOctokit.rest.repos.get.mockResolvedValue({ data: mockRepo });

      const result = await client.getRepoInfo('owner', 'test-repo');

      expect(result).toEqual(mockRepo);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      });
    });

    it('should validate required parameters', async () => {
      await expect(
        client.getRepoInfo('', 'repo')
      ).rejects.toThrow("Parameter 'owner' is required");
    });
  });

  describe('checkUserPermissions', () => {
    const mockPermission: Partial<Permission> = {
      permission: 'admin',
      role_name: 'admin',
    };

    it('should check user permissions successfully', async () => {
      mockOctokit.rest.repos.getCollaboratorPermissionLevel.mockResolvedValue({
        data: mockPermission,
      });

      const result = await client.checkUserPermissions('owner', 'repo', 'testuser');

      expect(result).toEqual(mockPermission);
      expect(mockOctokit.rest.repos.getCollaboratorPermissionLevel).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        username: 'testuser',
      });
    });

    it('should validate required parameters', async () => {
      await expect(
        client.checkUserPermissions('owner', 'repo', '')
      ).rejects.toThrow("Parameter 'username' is required");
    });
  });

  describe('Rate Limiting', () => {
    it('should get rate limit info', async () => {
      const result = await client.getRateLimitInfo();

      expect(result).toMatchObject({
        limit: 5000,
        remaining: 4900,
        used: 100,
      });
      expect(result.reset).toBeInstanceOf(Date);
    });

    it('should handle rate limit exceeded', async () => {
      vi.useFakeTimers();

      const resetTime = Math.floor(Date.now() / 1000) + 10; // 10 seconds from now
      mockOctokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          rate: {
            limit: 5000,
            remaining: 0,
            reset: resetTime,
            used: 5000,
          },
        },
      });

      const promise = client.handleRateLimit();

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(11000);

      await promise;

      vi.useRealTimers();
    });

    it('should warn when rate limit is low', async () => {
      // Create a spy for the log.warn method
      const warnSpy = vi.fn();
      const testClient = new GitHubClient('test-token', {
        log: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: warnSpy,
          error: vi.fn(),
        },
      });

      // Get mock octokit from test client
      const testMockOctokit = (testClient as any).octokit;
      testMockOctokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          rate: {
            limit: 5000,
            remaining: 50,
            reset: Math.floor(Date.now() / 1000) + 3600,
            used: 4950,
          },
        },
      });

      await testClient.getRateLimitInfo();
      await testClient.handleRateLimit();

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
        .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await client.retryRequest(mockFn, { maxRetries: 3 });

      expect(result).toEqual({ data: 'success' });
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValue({ status: 404, message: 'Not Found' });

      await expect(
        client.retryRequest(mockFn, { maxRetries: 3 })
      ).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValue({ status: 503, message: 'Service Unavailable' });

      await expect(
        client.retryRequest(mockFn, { maxRetries: 2 })
      ).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ status: 503 })
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValueOnce({ data: 'success' });

      const promise = client.retryRequest(mockFn, {
        maxRetries: 3,
        initialDelay: 1000,
      });

      // First retry after ~1s
      await vi.advanceTimersByTimeAsync(2000);

      // Second retry after ~2s
      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result).toEqual({ data: 'success' });
      vi.useRealTimers();
    });
  });

  describe('Additional Features', () => {
    it('should get authenticated user', async () => {
      const mockUser = {
        login: 'testuser',
        id: 1,
        type: 'User',
      };

      mockOctokit.rest.users.getAuthenticated.mockResolvedValue({ data: mockUser });

      const result = await client.getAuthenticatedUser();

      expect(result).toEqual(mockUser);
    });

    it('should list PR reviews', async () => {
      const mockReviews = [
        { id: 1, state: 'APPROVED', user: { login: 'reviewer1' } },
        { id: 2, state: 'CHANGES_REQUESTED', user: { login: 'reviewer2' } },
      ];

      mockOctokit.rest.pulls.listReviews.mockResolvedValue({ data: mockReviews });

      const result = await client.listPRReviews('owner', 'repo', 123);

      expect(result).toEqual(mockReviews);
      expect(mockOctokit.rest.pulls.listReviews).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      });
    });

    it('should create PR review', async () => {
      const mockReview = {
        id: 1,
        state: 'APPROVED',
        body: 'LGTM',
      };

      mockOctokit.rest.pulls.createReview.mockResolvedValue({ data: mockReview });

      const result = await client.createPRReview('owner', 'repo', 123, {
        event: 'APPROVE',
        body: 'LGTM',
      });

      expect(result).toEqual(mockReview);
      expect(mockOctokit.rest.pulls.createReview).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        event: 'APPROVE',
        body: 'LGTM',
        comments: undefined,
      });
    });

    it('should get Octokit instance', () => {
      const octokit = client.getOctokit();
      expect(octokit).toBeDefined();
      expect(octokit.rest).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.useFakeTimers();

      mockOctokit.rest.pulls.get.mockRejectedValue(new Error('Network error'));

      const promise = client.getPullRequest('owner', 'repo', 123);

      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(30000);

      await expect(promise).rejects.toThrow('Error during getPullRequest: Network error');

      vi.useRealTimers();
    });

    it('should handle GitHub API errors with details', async () => {
      const apiError = {
        status: 422,
        message: 'Validation Failed',
        response: {
          status: 422,
          url: 'https://api.github.com/repos/owner/repo/pulls/123',
          data: {
            message: 'Validation Failed',
            errors: [
              {
                resource: 'PullRequest',
                field: 'title',
                code: 'missing',
              },
            ],
          },
        },
      };

      mockOctokit.rest.pulls.get.mockRejectedValue(apiError);

      await expect(
        client.getPullRequest('owner', 'repo', 123)
      ).rejects.toThrow('GitHub API error during getPullRequest: Validation Failed');
    });

    it('should preserve error stack traces', async () => {
      vi.useFakeTimers();

      const error = new Error('Test error');
      mockOctokit.rest.pulls.get.mockRejectedValue(error);

      const promise = client.getPullRequest('owner', 'repo', 123);

      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(30000);

      try {
        await promise;
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.stack).toBeDefined();
        expect(err.message).toContain('Test error');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
