/**
 * IoOperation - Framework-agnostic monad for I/O operations
 * 
 * Combines Result pattern, progress tracking, and activity indication
 * for operations that can fail, need progress updates, or require UI feedback.
 */

export { IoOperation, fromPromise, success, failure } from './IoOperation';
export type { IoResult, ProgressCallback, ActivityTracker } from './IoOperation';

export { IoActivityTracker, useIoActivityTracker } from './IoActivityTracker';

// Example files are not exported - they're for reference only
