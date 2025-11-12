# IoOperation Implementation Notes

## Design Decision: Framework-Agnostic Core with Reactive Adapter

### Problem
The initial implementation had Vue reactivity issues because `IoOperation`'s internal `_currentProgress` property wasn't reactive, so computed properties in the tracker didn't update when progress changed.

### Solution: Option 5 - External State Store

We chose to keep `IoOperation` completely framework-agnostic while moving the progress state management to the Vue-specific `IoActivityTracker`.

## Architecture

### IoOperation (Framework-Agnostic)
- Pure JavaScript/TypeScript class
- No framework dependencies
- Uses callback pattern for progress updates
- Can be ported to Python or other frameworks

```typescript
class IoOperation<T> {
  private _currentProgress: number = 0;  // Internal only
  
  onProgress(callback: (progress: number) => void) {
    // Subscribes to progress updates
  }
  
  get progress(): number {
    return this._currentProgress;  // For initial read only
  }
}
```

### IoActivityTracker (Vue-Specific)
- Maintains reactive state externally
- Stores `TrackedJob` objects with progress values
- Subscribes to IoOperation progress callbacks
- Triggers Vue reactivity by recreating the Map on updates

```typescript
interface TrackedJob {
  operation: IoOperation<any>;
  progress: number;           // Reactive state
  isIndeterminate: boolean;   // Reactive state
}

class IoActivityTracker {
  private _jobs = ref(new Map<string, TrackedJob>());
  
  register(operation: IoOperation<any>) {
    // Subscribe to progress and update reactive state
    operation.onProgress(progress => {
      const job = this._jobs.value.get(id);
      if (job) {
        job.progress = progress;
        // Trigger reactivity by replacing Map
        this._jobs.value = new Map(this._jobs.value);
      }
    });
  }
}
```

## Benefits

1. **Framework Independence**: `IoOperation` has zero Vue dependencies
2. **Portability**: Can be used with React, Angular, Svelte, or even Python
3. **Clean Separation**: Reactivity concerns are isolated to the adapter layer
4. **Testability**: Core logic can be tested without framework overhead
5. **Performance**: Only the tracker's Map is reactive, not individual operations

## Key Changes

### Before
- Progress state lived inside `IoOperation`
- Vue couldn't track changes to plain class properties
- Computed properties didn't re-evaluate on progress updates

### After
- Progress state lives in `IoActivityTracker`
- IoOperation just notifies via callbacks
- Tracker updates reactive Map, triggering Vue's reactivity
- Computed properties work correctly

## Usage Example

```typescript
// In a Vue component
const { register, overallProgress, hasActiveJobs } = useIoActivityTracker();

const loadData = async () => {
  const operation = repository.query({}, { page: 1, size: 10 });
  
  // Register for tracking - tracker handles reactivity
  register(operation);
  
  // Progress updates automatically flow to UI
  const result = await operation.toPromise();
};
```

## Future Considerations

- Could create adapters for other frameworks (React, Angular, etc.)
- Python version would use similar callback pattern with different reactivity
- The core `IoOperation` monad can evolve independently of any framework
