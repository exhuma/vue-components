# VersionMonitor Component

A Vue 3 component that detects stale JavaScript code in the client's browser and notifies users when a new version of the application is deployed.

## Features

- Periodically checks for application version changes
- Non-intrusive notification via Vuetify snackbar at the top of the screen
- Customizable check interval and messaging
- Automatic cleanup on component unmount
- Uncached version checking to ensure fresh data

## How It Works

1. At build time, a Vite plugin generates a `version.json` file containing the application version from `package.json`
2. Nginx is configured to serve `version.json` without caching
3. The component periodically fetches `version.json` with cache-busting headers
4. When a version mismatch is detected, a snackbar notification appears
5. Users can reload the page to get the latest version

## Usage

Add the component to your main App.vue:

```vue
<template>
  <v-app>
    <!-- Your app content -->

    <VersionMonitor />
  </v-app>
</template>

<script setup lang="ts">
import VersionMonitor from "@shared-components/VersionMonitor.vue";
</script>
```

## Props

| Prop               | Type     | Default                        | Description                                                                |
| ------------------ | -------- | ------------------------------ | -------------------------------------------------------------------------- |
| `appName`          | `string` | (from `__APP_NAME__`)          | Unique identifier for the app (prevents conflicts when multiple apps open) |
| `checkIntervalMs`  | `number` | `300000` (5 minutes)           | How often to check for version updates (in milliseconds)                   |
| `message`          | `string` | `"A new version is available"` | The message shown in the notification                                      |
| `reloadButtonText` | `string` | `"Reload"`                     | The text on the reload button                                              |

## Examples

### Custom check interval (every 2 minutes)

```vue
<VersionMonitor :check-interval-ms="120000" />
```

### Custom messages

```vue
<VersionMonitor
  message="New features available!"
  reload-button-text="Update Now"
/>
```

## Setup Requirements

### 1. Vite Configuration

The Vite config must include the app name definition (already configured in both admin and public apps):

```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf-8"),
);
const version = packageJson.version;

export default defineConfig({
  plugins: [
    vue(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_NAME__: JSON.stringify("admin"), // or "public", etc.
  },
});
```

Make sure to also declare the constant in your `env.d.ts`:

```typescript
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
```

### 2. Nginx Configuration

Add the following location block to prevent caching of `version.json`:

```nginx
# Never cache version.json
location = /version.json {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

## Technical Details

- Uses `fetch()` with cache-busting headers (`Cache-Control: no-cache`, `Pragma: no-cache`)
- Stores the initial version on mount to compare against future checks
- Stops checking once a version mismatch is detected
- Gracefully handles fetch failures (logs warning but doesn't show notification)
- Automatically cleans up interval on component unmount
- Uses BroadcastChannel API with app-specific channel names to coordinate between tabs
- Only one tab per application performs version checks (leader election), preventing redundant network requests
- The `appName` prop ensures that multiple applications (admin, public, etc.) can run simultaneously without conflicts

## Browser Compatibility

Compatible with all modern browsers that support:

- ES6 async/await
- Fetch API
- BroadcastChannel API (optional, falls back to single-tab checking)
- Vue 3
- Vuetify 3
