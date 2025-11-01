/**
 * IoOperation<T> - A monad that combines Result pattern, activity tracking, and progress indication
 * for all I/O operations that can fail, need activity indication, and may report progress.
 */

export type IoResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

export type ProgressCallback = (progress: number) => void;

export interface ActivityTracker {
  register(operation: IoOperation<any>): void;
  unregister(operation: IoOperation<any>): void;
}

export class IoOperation<T> {
  private _promise: Promise<IoResult<T>>;
  private _progressCallbacks: ProgressCallback[] = [];
  private _currentProgress: number = 0;
  private _isCompleted: boolean = false;
  private _isIndeterminate: boolean = false;
  private _id: string;

  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (error: Error) => void,
      progress: (value: number) => void,
    ) => void,
    isIndeterminate: boolean,
  ) {
    this._id = `io-op-${Math.random().toString(36).slice(2, 11)}`;
    this._isIndeterminate = isIndeterminate;
    this._promise = new Promise<IoResult<T>>((resolve) => {
      executor(
        // Success callback
        (value: T) => {
          this._currentProgress = 1.0;
          this._isCompleted = true;
          this._notifyProgress(1.0);
          resolve({ success: true, data: value });
        },
        // Error callback
        (error: Error) => {
          this._isCompleted = true;
          resolve({ success: false, error });
        },
        // Progress callback
        (progress: number) => {
          this._currentProgress = Math.max(0, Math.min(1, progress));
          this._notifyProgress(this._currentProgress);
        },
      );
    });
  }

  /**
   * Subscribe to progress updates (0.0 to 1.0)
   */
  onProgress(callback: ProgressCallback): this {
    this._progressCallbacks.push(callback);
    // Immediately notify with current progress
    callback(this._currentProgress);
    return this;
  }

  /**
   * Get unique operation ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get current progress value (0.0 to 1.0)
   */
  get progress(): number {
    return this._currentProgress;
  }

  /**
   * Check if operation is completed
   */
  get isCompleted(): boolean {
    return this._isCompleted;
  }

  /**
   * Get the underlying promise for the result
   */
  get promise(): Promise<IoResult<T>> {
    return this._promise;
  }

  /**
   * Check if operation progress is indeterminate
   */
  get isIndeterminate(): boolean {
    return this._isIndeterminate;
  }

  private _notifyProgress(progress: number): void {
    this._progressCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * Monadic interface to chain an operation when the operation succeeds.
   *
   * *fn* is applied only when the IO-Operation succeeded. Otherwise reject with
   * an error
   */
  map<U>(fn: (value: T) => U): IoOperation<U> {
    return new IoOperation<U>((resolve, reject, progress) => {
      // Forward progress from this operation
      this.onProgress(progress);

      this._promise.then((result) => {
        if (result.success) {
          try {
            const mapped = fn(result.data);
            resolve(mapped);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        } else {
          reject(result.error);
        }
      });
    }, this._isIndeterminate);
  }

  /**
   * Monadic "flatMap" operation to chain another action which itself returns an
   * IoOperation.
   */
  flatMap<U>(fn: (value: T) => IoOperation<U>): IoOperation<U> {
    return new IoOperation<U>((resolve, reject, progress) => {
      // First operation gets 50% of total progress
      this.onProgress((p) => progress(p * 0.5));

      this._promise.then((result) => {
        if (result.success) {
          try {
            const nextOperation = fn(result.data);

            // Second operation gets remaining 50% of progress
            nextOperation.onProgress((p) => progress(0.5 + p * 0.5));

            nextOperation.promise.then((nextResult) => {
              if (nextResult.success) {
                resolve(nextResult.data);
              } else {
                reject(nextResult.error);
              }
            });
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        } else {
          reject(result.error);
        }
      });
    }, this._isIndeterminate);
  }

  /**
   * Handle errors by providing a fallback value
   */
  catch(fn: (error: Error) => T): IoOperation<T> {
    return new IoOperation<T>((resolve, reject, progress) => {
      this.onProgress(progress);

      this._promise.then((result) => {
        if (result.success) {
          resolve(result.data);
        } else {
          try {
            const fallback = fn(result.error);
            resolve(fallback);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });
    }, this._isIndeterminate);
  }

  /**
   * Convert to a regular Promise, losing the progress tracking
   */
  async toPromise(): Promise<T> {
    const result = await this._promise;
    if (result.success) {
      return result.data;
    } else {
      throw result.error;
    }
  }
}

/**
 * Helper function to create an IoOperation from a regular Promise
 */
export function fromPromise<T>(
  promise: Promise<T>,
  isIndeterminate: boolean = true,
): IoOperation<T> {
  return new IoOperation<T>((resolve, reject, progress) => {
    // No progress tracking for regular promises
    progress(0);

    promise.then(resolve).catch(reject);
  }, isIndeterminate);
}

/**
 * Helper function to create an immediately successful IoOperation
 */
export function success<T>(value: T): IoOperation<T> {
  return new IoOperation<T>((resolve) => {
    resolve(value);
  }, false);
}

/**
 * Helper function to create an immediately failed IoOperation
 */
export function failure<T>(error: Error): IoOperation<T> {
  return new IoOperation<T>((_, reject) => {
    reject(error);
  }, false);
}
