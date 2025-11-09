/**
 * TypeScript type definitions for GitHub Check Runs Integration (Feature 5, Task 5.6)
 * Defines interfaces for creating and managing GitHub check runs
 */

/**
 * Check run status
 */
export type CheckRunStatus = 'queued' | 'in_progress' | 'completed';

/**
 * Check run conclusion
 */
export type Conclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required'
  | 'skipped';

/**
 * Annotation level
 */
export type AnnotationLevel = 'notice' | 'warning' | 'failure';

/**
 * Check context for creating a check run
 */
export interface CheckContext {
  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Check run name */
  name: string;

  /** Git commit SHA */
  head_sha: string;

  /** Branch name (optional) */
  head_branch?: string;

  /** External ID for tracking (optional) */
  external_id?: string;

  /** Details URL (optional) */
  details_url?: string;

  /** Started timestamp (optional) */
  started_at?: string;
}

/**
 * Check run object returned by GitHub API
 */
export interface CheckRun {
  /** Check run ID */
  id: number;

  /** Check run name */
  name: string;

  /** Git commit SHA */
  head_sha: string;

  /** Check run status */
  status: CheckRunStatus;

  /** Check run conclusion (only for completed status) */
  conclusion?: Conclusion;

  /** Started timestamp */
  started_at?: string;

  /** Completed timestamp */
  completed_at?: string;

  /** Check run output */
  output?: CheckRunOutput;

  /** External ID */
  external_id?: string;

  /** Details URL */
  details_url?: string;

  /** HTML URL for viewing on GitHub */
  html_url?: string;

  /** Check run URL */
  url?: string;
}

/**
 * Check run output containing results and annotations
 */
export interface CheckRunOutput {
  /** Title of check run */
  title: string;

  /** Summary of results (supports markdown) */
  summary: string;

  /** Detailed text (supports markdown, optional) */
  text?: string;

  /** Annotations for specific lines in files */
  annotations?: Annotation[];

  /** Images to display in check run */
  images?: CheckRunImage[];

  /** Number of annotations (GitHub limit: 50 per request) */
  annotations_count?: number;

  /** URL for full annotation list */
  annotations_url?: string;
}

/**
 * Annotation for specific file/line in repository
 */
export interface Annotation {
  /** File path in repository */
  path: string;

  /** Start line number (1-indexed) */
  start_line: number;

  /** End line number (1-indexed) */
  end_line: number;

  /** Start column (optional, 1-indexed) */
  start_column?: number;

  /** End column (optional, 1-indexed) */
  end_column?: number;

  /** Annotation level */
  annotation_level: AnnotationLevel;

  /** Annotation message */
  message: string;

  /** Annotation title (optional) */
  title?: string;

  /** Raw details (optional, markdown) */
  raw_details?: string;
}

/**
 * Image to display in check run
 */
export interface CheckRunImage {
  /** Alt text for image */
  alt: string;

  /** Image URL (must be publicly accessible) */
  image_url: string;

  /** Caption (optional) */
  caption?: string;
}

/**
 * Progress information for in-progress check runs
 */
export interface Progress {
  /** Summary message */
  summary: string;

  /** Number of tests completed */
  testsCompleted?: number;

  /** Total number of tests */
  testsTotal?: number;

  /** Current progress percentage (0-100) */
  percentage?: number;

  /** Additional progress details */
  details?: string;
}

/**
 * Request to create a check run
 */
export interface CreateCheckRunRequest {
  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Check run name */
  name: string;

  /** Git commit SHA */
  head_sha: string;

  /** Details URL (optional) */
  details_url?: string;

  /** External ID (optional) */
  external_id?: string;

  /** Status (defaults to 'queued') */
  status?: CheckRunStatus;

  /** Started timestamp (optional) */
  started_at?: string;

  /** Conclusion (only if status is 'completed') */
  conclusion?: Conclusion;

  /** Completed timestamp (only if status is 'completed') */
  completed_at?: string;

  /** Output (optional) */
  output?: CheckRunOutput;

  /** Actions (optional) */
  actions?: CheckRunAction[];
}

/**
 * Request to update a check run
 */
export interface UpdateCheckRunRequest {
  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Check run ID */
  check_run_id: number;

  /** Check run name (optional) */
  name?: string;

  /** Details URL (optional) */
  details_url?: string;

  /** External ID (optional) */
  external_id?: string;

  /** Started timestamp (optional) */
  started_at?: string;

  /** Status (optional) */
  status?: CheckRunStatus;

  /** Conclusion (only if status is 'completed') */
  conclusion?: Conclusion;

  /** Completed timestamp (only if status is 'completed') */
  completed_at?: string;

  /** Output (optional) */
  output?: CheckRunOutput;

  /** Actions (optional) */
  actions?: CheckRunAction[];
}

/**
 * Action button in check run
 */
export interface CheckRunAction {
  /** Action label */
  label: string;

  /** Action description */
  description: string;

  /** Action identifier */
  identifier: string;
}

/**
 * Batch of annotations (GitHub allows max 50 per request)
 */
export interface AnnotationBatch {
  /** Batch number (for tracking) */
  batchNumber: number;

  /** Annotations in this batch */
  annotations: Annotation[];

  /** Whether this is the final batch */
  isFinal: boolean;
}

/**
 * Check run update payload
 */
export interface CheckRunUpdatePayload {
  /** Status */
  status?: CheckRunStatus;

  /** Conclusion */
  conclusion?: Conclusion;

  /** Output */
  output?: CheckRunOutput;

  /** Completed timestamp */
  completed_at?: string;
}

/**
 * GitHub API error response
 */
export interface GitHubError {
  /** Error message */
  message: string;

  /** Documentation URL */
  documentation_url?: string;

  /** Error details */
  errors?: Array<{
    resource?: string;
    field?: string;
    code?: string;
    message?: string;
  }>;
}

/**
 * Check suite information
 */
export interface CheckSuite {
  /** Check suite ID */
  id: number;

  /** Git commit SHA */
  head_sha: string;

  /** Check suite status */
  status: 'queued' | 'in_progress' | 'completed';

  /** Check suite conclusion */
  conclusion?: Conclusion;

  /** Before SHA (for comparison) */
  before?: string;

  /** After SHA (for comparison) */
  after?: string;
}

/**
 * Repository information
 */
export interface Repository {
  /** Repository owner */
  owner: string;

  /** Repository name */
  name: string;

  /** Full repository name (owner/name) */
  full_name: string;

  /** Repository URL */
  html_url?: string;
}

/**
 * Commit information
 */
export interface Commit {
  /** Commit SHA */
  sha: string;

  /** Commit message */
  message?: string;

  /** Author information */
  author?: {
    name?: string;
    email?: string;
    date?: string;
  };

  /** Committer information */
  committer?: {
    name?: string;
    email?: string;
    date?: string;
  };
}

/**
 * Pull request reference
 */
export interface PullRequest {
  /** Pull request number */
  number: number;

  /** Pull request title */
  title?: string;

  /** Pull request URL */
  html_url?: string;

  /** Head commit SHA */
  head_sha?: string;

  /** Base branch */
  base_ref?: string;

  /** Head branch */
  head_ref?: string;
}

/**
 * Check run event payload (from webhooks)
 */
export interface CheckRunEvent {
  /** Action that triggered the event */
  action: 'created' | 'completed' | 'rerequested' | 'requested_action';

  /** Check run object */
  check_run: CheckRun;

  /** Repository */
  repository: Repository;

  /** Requested action (for requested_action events) */
  requested_action?: CheckRunAction;
}

/**
 * Configuration for check runner
 */
export interface CheckRunnerConfig {
  /** GitHub token for API access */
  token: string;

  /** GitHub API base URL (for GitHub Enterprise) */
  baseUrl?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum retries for failed requests */
  maxRetries?: number;

  /** Whether to batch annotations */
  batchAnnotations?: boolean;

  /** Maximum annotations per batch (default: 50) */
  maxAnnotationsPerBatch?: number;
}

/**
 * Validation result for check run data
 */
export interface ValidationResult {
  /** Whether data is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}
