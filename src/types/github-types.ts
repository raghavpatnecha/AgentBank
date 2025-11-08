/**
 * GitHub API Types
 * Comprehensive type definitions for GitHub API interactions
 */

/**
 * GitHub User
 */
export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  type: 'User' | 'Bot' | 'Organization';
  site_admin: boolean;
  name?: string;
  email?: string;
  company?: string;
  blog?: string;
  location?: string;
  bio?: string;
  twitter_username?: string;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * GitHub Repository
 */
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: License | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: 'public' | 'private' | 'internal';
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

/**
 * License Information
 */
export interface License {
  key: string;
  name: string;
  spdx_id: string;
  url: string | null;
  node_id: string;
}

/**
 * Pull Request Head/Base
 */
export interface PullRequestRef {
  label: string;
  ref: string;
  sha: string;
  user: GitHubUser;
  repo: Repository;
}

/**
 * Pull Request Label
 */
export interface Label {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
}

/**
 * Milestone
 */
export interface Milestone {
  url: string;
  html_url: string;
  labels_url: string;
  id: number;
  node_id: string;
  number: number;
  state: 'open' | 'closed';
  title: string;
  description: string | null;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_on: string | null;
}

/**
 * Pull Request
 */
export interface PullRequest {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GitHubUser;
  body: string | null;
  labels: Label[];
  milestone: Milestone | null;
  active_lock_reason: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  requested_teams: Team[];
  head: PullRequestRef;
  base: PullRequestRef;
  _links: {
    self: { href: string };
    html: { href: string };
    issue: { href: string };
    comments: { href: string };
    review_comments: { href: string };
    review_comment: { href: string };
    commits: { href: string };
    statuses: { href: string };
  };
  author_association: AuthorAssociation;
  auto_merge: AutoMerge | null;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  rebaseable: boolean | null;
  mergeable_state: string;
  merged_by: GitHubUser | null;
  comments: number;
  review_comments: number;
  maintainer_can_modify: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

/**
 * Team
 */
export interface Team {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: 'secret' | 'closed';
  permission: string;
  members_url: string;
  repositories_url: string;
}

/**
 * Author Association
 */
export type AuthorAssociation =
  | 'COLLABORATOR'
  | 'CONTRIBUTOR'
  | 'FIRST_TIMER'
  | 'FIRST_TIME_CONTRIBUTOR'
  | 'MANNEQUIN'
  | 'MEMBER'
  | 'NONE'
  | 'OWNER';

/**
 * Auto Merge Configuration
 */
export interface AutoMerge {
  enabled_by: GitHubUser;
  merge_method: 'merge' | 'squash' | 'rebase';
  commit_title: string;
  commit_message: string;
}

/**
 * Comment
 */
export interface Comment {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  body: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  issue_url?: string;
  author_association: AuthorAssociation;
  performed_via_github_app?: GitHubApp | null;
  reactions?: Reactions;
}

/**
 * GitHub App
 */
export interface GitHubApp {
  id: number;
  slug: string;
  node_id: string;
  owner: GitHubUser;
  name: string;
  description: string | null;
  external_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  permissions: Record<string, string>;
  events: string[];
}

/**
 * Reactions
 */
export interface Reactions {
  url: string;
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

/**
 * PR File
 */
export interface PRFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

/**
 * Check Run Status
 */
export type CheckRunStatus = 'queued' | 'in_progress' | 'completed';

/**
 * Check Run Conclusion
 */
export type CheckRunConclusion =
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale'
  | 'timed_out';

/**
 * Check Run Output
 */
export interface CheckRunOutput {
  title: string;
  summary: string;
  text?: string;
  annotations?: CheckRunAnnotation[];
  images?: CheckRunImage[];
}

/**
 * Check Run Annotation
 */
export interface CheckRunAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  end_column?: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
  raw_details?: string;
}

/**
 * Check Run Image
 */
export interface CheckRunImage {
  alt: string;
  image_url: string;
  caption?: string;
}

/**
 * Check Run Data (for creation)
 */
export interface CheckRunData {
  name: string;
  head_sha: string;
  status?: CheckRunStatus;
  conclusion?: CheckRunConclusion;
  started_at?: string;
  completed_at?: string;
  details_url?: string;
  external_id?: string;
  output?: CheckRunOutput;
  actions?: CheckRunAction[];
}

/**
 * Check Run Update (for updates)
 */
export interface CheckRunUpdate {
  name?: string;
  status?: CheckRunStatus;
  conclusion?: CheckRunConclusion;
  completed_at?: string;
  details_url?: string;
  external_id?: string;
  output?: CheckRunOutput;
  actions?: CheckRunAction[];
}

/**
 * Check Run Action
 */
export interface CheckRunAction {
  label: string;
  description: string;
  identifier: string;
}

/**
 * Check Run
 */
export interface CheckRun {
  id: number;
  head_sha: string;
  node_id: string;
  external_id: string | null;
  url: string;
  html_url: string | null;
  details_url: string | null;
  status: CheckRunStatus;
  conclusion: CheckRunConclusion | null;
  started_at: string;
  completed_at: string | null;
  output: CheckRunOutput;
  name: string;
  check_suite: {
    id: number;
  } | null;
  app: GitHubApp | null;
  pull_requests: PullRequest[];
}

/**
 * Permission Level
 */
export type PermissionLevel = 'admin' | 'write' | 'read' | 'none';

/**
 * Permission
 */
export interface Permission {
  permission: PermissionLevel;
  role_name: string;
  user?: GitHubUser;
}

/**
 * Rate Limit Info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

/**
 * Rate Limit Response
 */
export interface RateLimitResponse {
  resources: {
    core: RateLimitResource;
    search: RateLimitResource;
    graphql: RateLimitResource;
    integration_manifest: RateLimitResource;
    source_import: RateLimitResource;
    code_scanning_upload: RateLimitResource;
    actions_runner_registration: RateLimitResource;
    scim: RateLimitResource;
  };
  rate: RateLimitResource;
}

/**
 * Rate Limit Resource
 */
export interface RateLimitResource {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

/**
 * Client Configuration
 */
export interface ClientConfig {
  baseUrl?: string;
  userAgent?: string;
  timeout?: number;
  maxRetries?: number;
  throttle?: {
    onRateLimit?: (retryAfter: number, options: any) => boolean;
    onSecondaryRateLimit?: (retryAfter: number, options: any) => boolean;
  };
  retry?: {
    enabled?: boolean;
    doNotRetry?: string[];
  };
  log?: {
    debug?: (...args: any[]) => void;
    info?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
  };
}

/**
 * GitHub Error
 */
export interface GitHubError extends Error {
  status?: number;
  response?: {
    status: number;
    url: string;
    headers: Record<string, string>;
    data: {
      message: string;
      documentation_url?: string;
      errors?: Array<{
        resource: string;
        field: string;
        code: string;
      }>;
    };
  };
}

/**
 * Retry Options
 */
export interface RetryOptions {
  maxRetries?: number;
  retryableStatuses?: number[];
  backoffMultiplier?: number;
  initialDelay?: number;
}

/**
 * File Content Response
 */
export interface FileContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  encoding?: string;
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
  _links: {
    self: string;
    git: string | null;
    html: string | null;
  };
}

/**
 * Commit
 */
export interface Commit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

/**
 * Required Permissions
 */
export const REQUIRED_PERMISSIONS = {
  contents: 'read',
  issues: 'write',
  pullRequests: 'write',
  checks: 'write',
} as const;

/**
 * Default Configuration
 */
export const DEFAULT_CONFIG: Required<ClientConfig> = {
  baseUrl: 'https://api.github.com',
  userAgent: 'github-api-client/1.0.0',
  timeout: 30000,
  maxRetries: 3,
  throttle: {
    onRateLimit: (retryAfter: number) => retryAfter < 60,
    onSecondaryRateLimit: (retryAfter: number) => retryAfter < 60,
  },
  retry: {
    enabled: true,
    doNotRetry: ['400', '401', '403', '404', '422'],
  },
  log: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
};
