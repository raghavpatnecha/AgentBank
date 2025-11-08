/**
 * GitHub Webhook Types
 *
 * Comprehensive type definitions for GitHub webhook events and API test agent operations.
 * Supports issue_comment and pull_request events with full payload parsing.
 */

/**
 * Webhook configuration for server setup
 */
export interface WebhookConfig {
  /**
   * Port number for webhook server
   * @default 3000
   */
  port: number;

  /**
   * Webhook secret for signature verification
   * Must match the secret configured in GitHub
   */
  secret: string;

  /**
   * Path for webhook endpoint
   * @default '/webhook'
   */
  path: string;

  /**
   * Path for health check endpoint
   * @default '/health'
   */
  healthPath: string;

  /**
   * Enable request logging
   * @default true
   */
  logging: boolean;

  /**
   * Rate limiting configuration
   */
  rateLimit: RateLimitConfig;

  /**
   * CORS configuration
   */
  cors?: CorsConfig;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout: number;

  /**
   * Maximum request body size
   * @default '1mb'
   */
  maxBodySize: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /**
   * Enable rate limiting
   * @default true
   */
  enabled: boolean;

  /**
   * Maximum requests per window
   * @default 10
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs: number;

  /**
   * Message to return when rate limit exceeded
   */
  message?: string;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  /**
   * Allowed origins
   */
  origins: string[];

  /**
   * Allowed methods
   */
  methods: string[];

  /**
   * Allowed headers
   */
  headers: string[];
}

/**
 * Base webhook payload structure
 */
export interface WebhookPayload {
  /**
   * Event action (opened, created, synchronize, etc.)
   */
  action: string;

  /**
   * Repository information
   */
  repository: Repository;

  /**
   * Sender (user who triggered the event)
   */
  sender: User;

  /**
   * Installation ID (for GitHub Apps)
   */
  installation?: Installation;
}

/**
 * Issue comment event payload
 */
export interface IssueCommentEvent extends WebhookPayload {
  action: 'created' | 'edited' | 'deleted';

  /**
   * The issue or pull request
   */
  issue: Issue;

  /**
   * The comment that was created/edited/deleted
   */
  comment: Comment;
}

/**
 * Pull request event payload
 */
export interface PullRequestEvent extends WebhookPayload {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | 'assigned' | 'unassigned' | 'labeled' | 'unlabeled';

  /**
   * The pull request
   */
  pull_request: PullRequest;

  /**
   * Number of the pull request
   */
  number: number;
}

/**
 * Repository information
 */
export interface Repository {
  /**
   * Repository ID
   */
  id: number;

  /**
   * Repository name (e.g., "api-test-agent")
   */
  name: string;

  /**
   * Full repository name (e.g., "owner/api-test-agent")
   */
  full_name: string;

  /**
   * Repository owner
   */
  owner: User;

  /**
   * Private repository flag
   */
  private: boolean;

  /**
   * HTML URL of the repository
   */
  html_url: string;

  /**
   * Repository description
   */
  description: string | null;

  /**
   * Default branch (usually "main" or "master")
   */
  default_branch: string;
}

/**
 * GitHub user information
 */
export interface User {
  /**
   * User ID
   */
  id: number;

  /**
   * Username/login
   */
  login: string;

  /**
   * User type (User or Bot)
   */
  type: 'User' | 'Bot';

  /**
   * Site admin flag
   */
  site_admin: boolean;

  /**
   * HTML URL of user profile
   */
  html_url: string;

  /**
   * Avatar URL
   */
  avatar_url: string;
}

/**
 * GitHub issue or pull request
 */
export interface Issue {
  /**
   * Issue ID
   */
  id: number;

  /**
   * Issue number
   */
  number: number;

  /**
   * Issue title
   */
  title: string;

  /**
   * Issue state
   */
  state: 'open' | 'closed';

  /**
   * Issue author
   */
  user: User;

  /**
   * HTML URL
   */
  html_url: string;

  /**
   * Pull request information (only present for PRs)
   */
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };

  /**
   * Issue body/description
   */
  body: string | null;

  /**
   * Issue labels
   */
  labels: Label[];

  /**
   * Issue assignees
   */
  assignees: User[];

  /**
   * Created timestamp
   */
  created_at: string;

  /**
   * Updated timestamp
   */
  updated_at: string;
}

/**
 * GitHub comment
 */
export interface Comment {
  /**
   * Comment ID
   */
  id: number;

  /**
   * Comment author
   */
  user: User;

  /**
   * Comment body/text
   */
  body: string;

  /**
   * HTML URL
   */
  html_url: string;

  /**
   * Created timestamp
   */
  created_at: string;

  /**
   * Updated timestamp
   */
  updated_at: string;
}

/**
 * GitHub pull request
 */
export interface PullRequest {
  /**
   * PR ID
   */
  id: number;

  /**
   * PR number
   */
  number: number;

  /**
   * PR title
   */
  title: string;

  /**
   * PR state
   */
  state: 'open' | 'closed';

  /**
   * PR author
   */
  user: User;

  /**
   * HTML URL
   */
  html_url: string;

  /**
   * Diff URL
   */
  diff_url: string;

  /**
   * Patch URL
   */
  patch_url: string;

  /**
   * PR body/description
   */
  body: string | null;

  /**
   * Head branch information
   */
  head: Branch;

  /**
   * Base branch information
   */
  base: Branch;

  /**
   * Merged status
   */
  merged: boolean;

  /**
   * Mergeable status
   */
  mergeable: boolean | null;

  /**
   * PR labels
   */
  labels: Label[];

  /**
   * Created timestamp
   */
  created_at: string;

  /**
   * Updated timestamp
   */
  updated_at: string;

  /**
   * Merged timestamp
   */
  merged_at: string | null;
}

/**
 * Branch information
 */
export interface Branch {
  /**
   * Branch reference (e.g., "refs/heads/main")
   */
  ref: string;

  /**
   * Branch SHA
   */
  sha: string;

  /**
   * Repository
   */
  repo: Repository;

  /**
   * Branch label
   */
  label: string;
}

/**
 * GitHub label
 */
export interface Label {
  /**
   * Label ID
   */
  id: number;

  /**
   * Label name
   */
  name: string;

  /**
   * Label color (hex without #)
   */
  color: string;

  /**
   * Label description
   */
  description: string | null;
}

/**
 * GitHub installation (for Apps)
 */
export interface Installation {
  /**
   * Installation ID
   */
  id: number;

  /**
   * Account (user or organization)
   */
  account: User;
}

/**
 * Test job for queuing
 */
export interface TestJob {
  /**
   * Unique job ID
   */
  id: string;

  /**
   * Repository full name
   */
  repository: string;

  /**
   * Pull request number
   */
  prNumber: number;

  /**
   * Branch name
   */
  branch: string;

  /**
   * Comment author
   */
  author: string;

  /**
   * Parsed command
   */
  command: ParsedCommand;

  /**
   * Job status
   */
  status: JobStatus;

  /**
   * Job priority
   */
  priority: JobPriority;

  /**
   * Created timestamp
   */
  createdAt: Date;

  /**
   * Started timestamp
   */
  startedAt?: Date;

  /**
   * Completed timestamp
   */
  completedAt?: Date;

  /**
   * Job metadata
   */
  metadata: JobMetadata;
}

/**
 * Parsed command from comment
 */
export interface ParsedCommand {
  /**
   * Command name
   */
  command: CommandType;

  /**
   * Command arguments
   */
  args: CommandArgs;

  /**
   * Raw command text
   */
  rawCommand: string;

  /**
   * Whether command is valid
   */
  valid: boolean;

  /**
   * Validation errors (if any)
   */
  errors?: string[];
}

/**
 * Command arguments
 */
export interface CommandArgs {
  /**
   * Environment (staging, production, etc.)
   */
  env?: string;

  /**
   * OpenAPI spec path
   */
  spec?: string;

  /**
   * Base URL override
   */
  baseUrl?: string;

  /**
   * Additional options
   */
  options?: Record<string, string>;
}

/**
 * Command types supported by the bot
 */
export type CommandType = 'run' | 'help' | 'config' | 'retry' | 'cancel';

/**
 * Job status
 */
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Job priority
 */
export type JobPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Job metadata
 */
export interface JobMetadata {
  /**
   * Comment ID that triggered the job
   */
  commentId: number;

  /**
   * Comment URL
   */
  commentUrl: string;

  /**
   * Issue/PR URL
   */
  issueUrl: string;

  /**
   * Retry count
   */
  retryCount: number;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Test results (if completed)
   */
  results?: TestResults;
}

/**
 * Test results
 */
export interface TestResults {
  /**
   * Total tests run
   */
  total: number;

  /**
   * Passed tests
   */
  passed: number;

  /**
   * Failed tests
   */
  failed: number;

  /**
   * Duration in milliseconds
   */
  duration: number;

  /**
   * Test output/logs
   */
  output: string;

  /**
   * Coverage information (optional)
   */
  coverage?: CoverageInfo;
}

/**
 * Coverage information
 */
export interface CoverageInfo {
  /**
   * Line coverage percentage
   */
  lines: number;

  /**
   * Branch coverage percentage
   */
  branches: number;

  /**
   * Function coverage percentage
   */
  functions: number;

  /**
   * Statement coverage percentage
   */
  statements: number;
}

/**
 * Webhook event type
 */
export type WebhookEvent = IssueCommentEvent | PullRequestEvent;

/**
 * Command validation result
 */
export interface ValidationResult {
  /**
   * Whether command is valid
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Warnings (non-fatal issues)
   */
  warnings: string[];
}

/**
 * Permission check result
 */
export interface PermissionResult {
  /**
   * Whether user has permission
   */
  hasPermission: boolean;

  /**
   * Permission type granted
   */
  permissionType?: 'write' | 'admin' | 'collaborator' | 'org_member';

  /**
   * Reason for denial (if denied)
   */
  reason?: string;
}

/**
 * Webhook server statistics
 */
export interface WebhookStats {
  /**
   * Total webhooks received
   */
  totalReceived: number;

  /**
   * Total webhooks processed
   */
  totalProcessed: number;

  /**
   * Total webhooks rejected
   */
  totalRejected: number;

  /**
   * Total jobs queued
   */
  totalQueued: number;

  /**
   * Webhooks by event type
   */
  byEventType: Record<string, number>;

  /**
   * Webhooks by action
   */
  byAction: Record<string, number>;

  /**
   * Rate limit hits
   */
  rateLimitHits: number;

  /**
   * Signature verification failures
   */
  signatureFailures: number;

  /**
   * Uptime in milliseconds
   */
  uptime: number;

  /**
   * Start time
   */
  startTime: Date;
}
