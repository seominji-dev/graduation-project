/**
 * Application Constants
 * Centralized configuration for hardcoded values
 */

// =============================================================================
// MLFQ (Multi-Level Feedback Queue) Scheduler Constants
// =============================================================================

/** Number of priority queue levels in MLFQ */
export const MLFQ_QUEUE_LEVELS = 4;

/** Time quanta for each MLFQ queue level (in milliseconds) */
export const MLFQ_TIME_QUANTA = [1000, 3000, 8000, Infinity] as const;

/** Queue names for MLFQ levels */
export const MLFQ_QUEUE_NAMES = ['mlfq-q0', 'mlfq-q1', 'mlfq-q2', 'mlfq-q3'] as const;

// =============================================================================
// Aging Manager Constants
// =============================================================================

/** Interval for running aging process (in milliseconds) */
export const AGING_INTERVAL_MS = 60000; // 60 seconds

/** Wait time threshold to start aging a job (in milliseconds) */
export const AGING_THRESHOLD_MS = 120000; // 2 minutes

/** Maximum number of priority promotions per job */
export const MAX_AGE_PROMOTIONS = 2;

// =============================================================================
// Boost Manager Constants
// =============================================================================

/** Interval for periodic boost of all jobs to Q0 (in milliseconds) */
export const BOOST_INTERVAL_MS = 5000; // 5 seconds

// =============================================================================
// BullMQ Job Options
// =============================================================================

/** Default number of retry attempts for failed jobs */
export const DEFAULT_JOB_ATTEMPTS = 3;

/** Default backoff delay for retries (in milliseconds) */
export const DEFAULT_BACKOFF_DELAY_MS = 1000;

// =============================================================================
// WFQ (Weighted Fair Queuing) Constants
// =============================================================================

/** Default estimated service time for LLM requests (in milliseconds) */
export const DEFAULT_ESTIMATED_SERVICE_TIME_MS = 5000;

// =============================================================================
// Tenant Weight Constants
// =============================================================================

/** Default weight for jobs without tenant specification */
export const DEFAULT_JOB_WEIGHT = 10;

/** Tenant tier weights */
export const TENANT_TIER_WEIGHTS = {
  ENTERPRISE: 100,
  PREMIUM: 50,
  STANDARD: 10,
  FREE: 1,
} as const;

// =============================================================================
// Job Fetch Limits
// =============================================================================

/** Maximum number of waiting jobs to fetch at once */
export const MAX_WAITING_JOBS_FETCH = 100;

/** Maximum number of jobs to fetch for boosting */
export const MAX_BOOST_JOBS_FETCH = 1000;

// =============================================================================
// LLM Service Constants
// =============================================================================

/** Default temperature for LLM requests */
export const DEFAULT_LLM_TEMPERATURE = 0.7;

/** Default max tokens for LLM responses */
export const DEFAULT_LLM_MAX_TOKENS = 1000;

/** Default Ollama model */
export const DEFAULT_OLLAMA_MODEL = 'llama2';

/** Default OpenAI model */
export const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';

// =============================================================================
// Priority Calculation
// =============================================================================

/** Priority multiplier for BullMQ priority value calculation */
export const PRIORITY_MULTIPLIER = 2;
