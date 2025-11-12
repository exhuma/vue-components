import { ref, computed } from "vue";
import type { IoOperation } from "./IoOperation";

interface TrackedJob {
  operation: IoOperation<any>;
  progress: number;
  isIndeterminate: boolean;
}

/**
 * Activity tracker that manages IoOperations and provides reactive state
 * for Vue components like JobTracker.
 *
 * This tracker maintains the progress state externally to keep IoOperation
 * framework-agnostic.
 */
export class IoActivityTracker {
  private _jobs = ref(new Map<string, TrackedJob>());
  private _nextId = 0;

  /**
   * Register an IoOperation for tracking
   */
  register(operation: IoOperation<any>): string {
    const id = `job-${++this._nextId}`;

    // Create tracked job with initial state
    const trackedJob: TrackedJob = {
      operation,
      progress: operation.progress,
      isIndeterminate: operation.isIndeterminate,
    };

    this._jobs.value.set(id, trackedJob);

    // Subscribe to progress updates and update our reactive state
    operation.onProgress((progress: number) => {
      const job = this._jobs.value.get(id);
      if (job) {
        // Update progress in place
        job.progress = progress;
        // Trigger reactivity by replacing the Map
        this._jobs.value = new Map(this._jobs.value);
      }
    });

    // Auto-unregister when operation completes
    operation.promise.finally(() => {
      // Small delay to show completion state briefly
      setTimeout(() => {
        console.log(`Auto-unregistering completed job ${id}`);
        this.unregister(operation);
      }, 500);
    });

    return id;
  }

  /**
   * Manually unregister an IoOperation
   */
  unregister(operation: IoOperation<any>): void {
    for (const [key, job] of this._jobs.value.entries()) {
      if (job.operation.id === operation.id) {
        this._jobs.value.delete(key);
        // Trigger reactivity
        this._jobs.value = new Map(this._jobs.value);
        break;
      }
    }
  }

  /**
   * Unregister by job ID
   */
  unregisterById(id: string): void {
    this._jobs.value.delete(id);
    // Trigger reactivity
    this._jobs.value = new Map(this._jobs.value);
  }

  /**
   * Get current tracked jobs (reactive)
   */
  get jobs(): TrackedJob[] {
    return Array.from(this._jobs.value.values()) as TrackedJob[];
  }

  /**
   * Check if any jobs are currently running
   */
  get hasActiveJobs(): boolean {
    return this._jobs.value.size > 0;
  }

  /**
   * Get count of active jobs
   */
  get activeJobCount(): number {
    return this._jobs.value.size;
  }

  /**
   * Check if any job has indeterminate progress
   */
  get hasIndeterminateJob(): boolean {
    console.log(this.jobs);
    return this.jobs.some((job) => job.isIndeterminate);
  }

  /**
   * Get an aggregated value of all the job processes
   */
  get overallProgress(): number {
    const determinateJobs = this.jobs.filter((job) => !job.isIndeterminate);
    if (determinateJobs.length === 0) {
      return 0;
    }
    const totalProgress = determinateJobs.reduce(
      (sum, job) => sum + job.progress,
      0,
    );
    return totalProgress / determinateJobs.length;
  }

  /**
   * Clear all jobs (useful for cleanup)
   */
  clear(): void {
    this._jobs.value.clear();
    // Trigger reactivity
    this._jobs.value = new Map(this._jobs.value);
  }
}

/**
 * Composable for using IoActivityTracker in Vue components
 */
export function useIoActivityTracker() {
  const tracker = new IoActivityTracker();

  // Create computed refs for reactive access
  const jobs = computed(() => tracker.jobs);
  const hasActiveJobs = computed(() => tracker.hasActiveJobs);
  const activeJobCount = computed(() => tracker.activeJobCount);
  const overallProgress = computed(() => tracker.overallProgress);
  const hasIndeterminateJob = computed(() => tracker.hasIndeterminateJob);

  return {
    tracker,
    jobs,
    hasIndeterminateJob,
    hasActiveJobs,
    activeJobCount,
    overallProgress,
    register: (operation: IoOperation<any>) => tracker.register(operation),
    unregister: (operation: IoOperation<any>) => tracker.unregister(operation),
    clear: () => tracker.clear(),
  };
}

/**
 * Global activity tracker instance (optional - you can also create your own)
 */
export const globalActivityTracker = new IoActivityTracker();
