/**
 * GitHub Permission Checker
 *
 * Checks user permissions for executing commands via the API test agent.
 * Verifies write access, collaborator status, and organization membership.
 */

import { PermissionResult } from '../types/webhook-types.js';

/**
 * GitHub API client configuration
 */
export interface GitHubClientConfig {
  /**
   * GitHub personal access token
   */
  token: string;

  /**
   * GitHub API base URL
   * @default 'https://api.github.com'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 5000
   */
  timeout?: number;
}

/**
 * GitHub repository permission level
 */
export type PermissionLevel = 'admin' | 'write' | 'read' | 'none';

/**
 * Repository permission response from GitHub API
 */
interface RepositoryPermission {
  permission: PermissionLevel;
  user: {
    login: string;
    id: number;
    type: string;
  };
}

/**
 * GitHub Permission Checker
 *
 * Verifies user permissions using the GitHub API to determine
 * if a user can execute commands on a repository.
 *
 * @example
 * ```typescript
 * const checker = new PermissionChecker({
 *   token: process.env.GITHUB_TOKEN!,
 * });
 *
 * const hasPermission = await checker.hasWriteAccess('username', 'owner/repo');
 * if (!hasPermission) {
 *   console.log('User does not have permission');
 * }
 * ```
 */
export class PermissionChecker {
  private config: Required<GitHubClientConfig>;

  /**
   * Create a new permission checker
   *
   * @param config - GitHub client configuration
   */
  constructor(config: GitHubClientConfig) {
    this.config = {
      token: config.token,
      baseUrl: config.baseUrl || 'https://api.github.com',
      timeout: config.timeout || 5000,
    };
  }

  /**
   * Check if user has write access to repository
   *
   * Users with write or admin access can execute commands.
   *
   * @param user - GitHub username
   * @param repo - Repository in format 'owner/repo'
   * @returns true if user has write or admin access
   *
   * @example
   * ```typescript
   * const checker = new PermissionChecker({ token: 'ghp_...' });
   * const hasAccess = await checker.hasWriteAccess('octocat', 'owner/repo');
   * ```
   */
  public async hasWriteAccess(user: string, repo: string): Promise<boolean> {
    try {
      const permission = await this.getPermissionLevel(user, repo);
      return permission === 'write' || permission === 'admin';
    } catch (error) {
      console.error('Error checking write access:', error);
      return false;
    }
  }

  /**
   * Check if user is a collaborator
   *
   * @param user - GitHub username
   * @param repo - Repository in format 'owner/repo'
   * @returns true if user is a collaborator
   *
   * @example
   * ```typescript
   * const checker = new PermissionChecker({ token: 'ghp_...' });
   * const isCollab = await checker.isCollaborator('octocat', 'owner/repo');
   * ```
   */
  public async isCollaborator(user: string, repo: string): Promise<boolean> {
    try {
      const [owner, repoName] = this.parseRepository(repo);
      const url = `${this.config.baseUrl}/repos/${owner}/${repoName}/collaborators/${user}`;

      const response = await this.makeRequest(url);

      // 204 means user is a collaborator, 404 means they are not
      return response.status === 204;
    } catch (error) {
      console.error('Error checking collaborator status:', error);
      return false;
    }
  }

  /**
   * Check if user is an organization member
   *
   * @param user - GitHub username
   * @param org - Organization name
   * @returns true if user is an active organization member
   *
   * @example
   * ```typescript
   * const checker = new PermissionChecker({ token: 'ghp_...' });
   * const isMember = await checker.isOrgMember('octocat', 'github');
   * ```
   */
  public async isOrgMember(user: string, org: string): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/orgs/${org}/members/${user}`;

      const response = await this.makeRequest(url);

      // 204 means user is a member, 404 means they are not
      return response.status === 204;
    } catch (error) {
      console.error('Error checking org membership:', error);
      return false;
    }
  }

  /**
   * Get user's permission level on repository
   *
   * @param user - GitHub username
   * @param repo - Repository in format 'owner/repo'
   * @returns Permission level
   */
  public async getPermissionLevel(user: string, repo: string): Promise<PermissionLevel> {
    try {
      const [owner, repoName] = this.parseRepository(repo);
      const url = `${this.config.baseUrl}/repos/${owner}/${repoName}/collaborators/${user}/permission`;

      const response = await this.makeRequest(url);

      if (response.status !== 200) {
        return 'none';
      }

      const data = await response.json() as RepositoryPermission;
      return data.permission;
    } catch (error) {
      console.error('Error getting permission level:', error);
      return 'none';
    }
  }

  /**
   * Check permissions with detailed result
   *
   * @param user - GitHub username
   * @param repo - Repository in format 'owner/repo'
   * @returns Detailed permission result
   *
   * @example
   * ```typescript
   * const checker = new PermissionChecker({ token: 'ghp_...' });
   * const result = await checker.checkPermissions('octocat', 'owner/repo');
   *
   * if (!result.hasPermission) {
   *   console.log('Denied:', result.reason);
   * }
   * ```
   */
  public async checkPermissions(user: string, repo: string): Promise<PermissionResult> {
    // Check if user is a bot
    if (this.isBotUser(user)) {
      return {
        hasPermission: false,
        reason: 'Bot users cannot execute commands',
      };
    }

    // Get permission level
    const permission = await this.getPermissionLevel(user, repo);

    if (permission === 'admin') {
      return {
        hasPermission: true,
        permissionType: 'admin',
      };
    }

    if (permission === 'write') {
      return {
        hasPermission: true,
        permissionType: 'write',
      };
    }

    // Check if collaborator
    const isCollab = await this.isCollaborator(user, repo);
    if (isCollab) {
      return {
        hasPermission: true,
        permissionType: 'collaborator',
      };
    }

    // Check organization membership
    const [owner] = this.parseRepository(repo);
    const isOrgMember = await this.isOrgMember(user, owner);
    if (isOrgMember) {
      return {
        hasPermission: true,
        permissionType: 'org_member',
      };
    }

    return {
      hasPermission: false,
      reason: 'User does not have write access or collaborator status',
    };
  }

  /**
   * Check if user is a bot
   *
   * @param username - GitHub username
   * @returns true if username indicates a bot account
   *
   * @example
   * ```typescript
   * const checker = new PermissionChecker({ token: 'ghp_...' });
   * checker.isBotUser('github-actions[bot]'); // true
   * checker.isBotUser('dependabot[bot]'); // true
   * checker.isBotUser('octocat'); // false
   * ```
   */
  public isBotUser(username: string): boolean {
    if (!username) {
      return false;
    }

    const botPatterns = [
      /\[bot\]$/i,
      /^bot-/i,
      /-bot$/i,
      /^github-actions/i,
      /^dependabot/i,
      /^renovate/i,
    ];

    return botPatterns.some(pattern => pattern.test(username));
  }

  /**
   * Parse repository string into owner and repo name
   *
   * @param repo - Repository in format 'owner/repo'
   * @returns [owner, repoName]
   */
  private parseRepository(repo: string): [string, string] {
    const parts = repo.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid repository format: ${repo}. Expected 'owner/repo'`);
    }

    return [parts[0]!, parts[1]!];
  }

  /**
   * Make HTTP request to GitHub API
   *
   * @param url - API endpoint URL
   * @param options - Fetch options
   * @returns Response object
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${this.config.token}`,
          'User-Agent': 'api-test-agent',
          ...options.headers,
        },
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Update GitHub token
   *
   * @param token - New GitHub token
   */
  public updateToken(token: string): void {
    this.config.token = token;
  }

  /**
   * Get current configuration
   *
   * @returns Current config (token is redacted)
   */
  public getConfig(): Omit<Required<GitHubClientConfig>, 'token'> & { token: string } {
    return {
      ...this.config,
      token: this.config.token ? '***' : '',
    };
  }
}

/**
 * Create a new permission checker
 *
 * @param config - GitHub client configuration
 * @returns New PermissionChecker instance
 */
export function createPermissionChecker(config: GitHubClientConfig): PermissionChecker {
  return new PermissionChecker(config);
}
