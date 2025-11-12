# IoOperation

A framework-agnostic monad for I/O operations that combines:

- **Result pattern** (success/failure handling)
- **Progress tracking** (0.0 to 1.0)
- **Activity indication** (for UI feedback)

## Quick Start

```typescript
import { IoOperation } from "./IoOperation";
import { useIoActivityTracker } from "./IoActivityTracker";

// Create an operation
const fetchUsers = (): IoOperation<User[]> => {
  return new IoOperation((resolve, reject, progress) => {
    progress(0.1); // Starting

    fetch("/api/users")
      .then((response) => {
        progress(0.5); // Got response
        return response.json();
      })
      .then((users) => {
        progress(1.0); // Complete
        resolve(users);
      })
      .catch(reject);
  }, false);
};

// Use in Vue component
const { register, overallProgress, hasActiveJobs } = useIoActivityTracker();

const loadUsers = async () => {
  const operation = fetchUsers();
  register(operation); // Auto-tracks progress

  const users = await operation.toPromise();
  // Handle users...
};
```

## Chaining Operations

```typescript
// Sequential operations with aggregated progress
const workflow = repository
  .validateData(input)
  .flatMap((validated) => repository.save(validated))
  .flatMap((saved) => repository.notify(saved.id))
  .map((result) => result.data);

register(workflow);
const finalResult = await workflow.toPromise();
```

## Error Handling

```typescript
const operation = fetchData().catch((error) => {
  console.error("Failed:", error);
  return fallbackData; // Provide fallback
});

// Or handle at the end
try {
  const data = await operation.toPromise();
} catch (error) {
  // Handle error
}
```

## Progress Tracking

```typescript
const operation = uploadFile(file);

// Manual progress monitoring
operation.onProgress((progress) => {
  console.log(`${Math.round(progress * 100)}%`);
});

// Automatic UI tracking
register(operation, "Uploading file...");
```

## Helper Functions

```typescript
import { fromPromise, success, failure } from "./IoOperation";

// Wrap existing Promise
const op1 = fromPromise(fetch("/api/data"));

// Immediate success
const op2 = success({ id: 1, name: "test" });

// Immediate failure
const op3 = failure(new Error("Not found"));
```

## Repository Pattern

```typescript
class UserRepository {
  getAll(): IoOperation<User[]> {
    return new IoOperation((resolve, reject, progress) => {
      progress(0.0);

      api
        .get("/users")
        .then((response) => {
          progress(0.8);
          resolve(response.data);
        })
        .catch(reject);
    }, false);
  }

  create(user: User): IoOperation<User> {
    return new IoOperation((resolve, reject, progress) => {
      // Validation
      if (!user.name) {
        reject(new Error("Name required"));
        return;
      }
      progress(0.3);

      // Save
      api
        .post("/users", user)
        .then((response) => {
          progress(1.0);
          resolve(response.data);
        })
        .catch(reject);
    }, false);
  }
}
```

## Vue Component Integration

```vue
<template>
  <v-progress-linear
    :indeterminate="hasIndeterminateJob"
    :model-value="overallProgress * 100"
  />

  <v-btn @click="loadData" :loading="hasActiveJobs"> Load Data </v-btn>
</template>

<script setup lang="ts">
import { useIoActivityTracker } from "./IoActivityTracker";

const { register, hasActiveJobs, overallProgress, hasIndeterminateJob } =
  useIoActivityTracker();

const loadData = async () => {
  const operation = repository.getAll();
  register(operation);

  const data = await operation
    .map((items) => items.filter((item) => item.active))
    .toPromise();
};
</script>
```

## API Reference

### IoOperation<T>

| Method                 | Description                   |
| ---------------------- | ----------------------------- |
| `map<U>(fn)`           | Transform success value       |
| `flatMap<U>(fn)`       | Chain another IoOperation     |
| `catch(fn)`            | Handle errors with fallback   |
| `onProgress(callback)` | Subscribe to progress updates |
| `toPromise()`          | Convert to Promise            |

### useIoActivityTracker()

Returns:

- `register(operation)` - Track an operation
- `hasActiveJobs` - Boolean, any jobs running
- `overallProgress` - Number (0.0-1.0), average progress
- `hasIndeterminateJob` - Boolean, any job with unknown progress

## Design Philosophy

**Framework-agnostic core**: `IoOperation` has zero Vue dependencies. The reactivity layer (`IoActivityTracker`) is separate, making it portable to React, Angular, or even Python.

**Explicit over implicit**: Activity tracking requires explicit `register()` calls. Progress updates require explicit `progress()` calls in operation constructors.

**Composable**: Operations chain naturally with `map` and `flatMap`, automatically aggregating progress across the chain.
