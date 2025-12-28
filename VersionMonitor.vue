<template>
  <v-snackbar
    v-model="showUpdatePrompt"
    :timeout="-1"
    color="primary"
    location="top"
    multi-line
  >
    <div class="d-flex flex-column">
      <span class="mb-2">A new version of the application is available.</span>
      <div class="d-flex gap-2">
        <v-btn variant="elevated" color="white" @click="handleReload">
          Reload Now
        </v-btn>
        <v-btn variant="text" @click="handleDismiss"> Dismiss </v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const showUpdatePrompt = ref(false);
const initialValidator = ref<string | null>(null);
const checkInterval = ref<number | null>(null);
const broadcastChannel = ref<BroadcastChannel | null>(null);
const isLeader = ref(false);
const leaderElectionTimeout = ref<number | null>(null);

const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds
const CHANNEL_NAME = "version-monitor";
const LEADER_ELECTION_TIMEOUT_MS = 100;

/**
 * Captures the initial ETag or Last-Modified header from index.html
 */
async function captureInitialValidator(): Promise<void> {
  try {
    const response = await fetch("/index.html", {
      method: "HEAD",
      cache: "no-store",
    });

    const etag = response.headers.get("ETag");
    const lastModified = response.headers.get("Last-Modified");

    initialValidator.value = etag || lastModified || null;
  } catch (error) {
    console.error("Failed to capture initial validator:", error);
  }
}

/**
 * Checks if index.html has changed by comparing validators
 */
async function checkForUpdate(): Promise<boolean> {
  if (!initialValidator.value) {
    return false;
  }

  try {
    const response = await fetch("/index.html", {
      method: "HEAD",
      cache: "no-store",
    });

    const etag = response.headers.get("ETag");
    const lastModified = response.headers.get("Last-Modified");
    const currentValidator = etag || lastModified || null;

    // Treat missing validator as a change if we had one initially
    if (!currentValidator || currentValidator !== initialValidator.value) {
      return true;
    }
  } catch (error) {
    console.error("Failed to check for update:", error);
  }

  return false;
}

/**
 * Establishes this tab as the leader for update checking
 */
function becomeLeader(): void {
  if (isLeader.value) {
    return;
  }
  isLeader.value = true;
  startPeriodicCheck();
}

/**
 * Starts periodic checking for updates (leader only)
 */
function startPeriodicCheck(): void {
  if (checkInterval.value) {
    return;
  }

  checkInterval.value = window.setInterval(async () => {
    const hasUpdate = await checkForUpdate();
    if (hasUpdate) {
      showUpdatePrompt.value = true;
      broadcastUpdateAvailable();
    }
  }, CHECK_INTERVAL_MS);
}

/**
 * Stops periodic checking
 */
function stopPeriodicCheck(): void {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
    checkInterval.value = null;
  }
}

/**
 * Broadcasts update availability to other tabs
 */
function broadcastUpdateAvailable(): void {
  if (broadcastChannel.value) {
    broadcastChannel.value.postMessage({ type: "update-available" });
  }
}

/**
 * Handles messages from other tabs
 */
function handleMessage(event: MessageEvent): void {
  if (event.data.type === "update-available") {
    showUpdatePrompt.value = true;
  } else if (event.data.type === "leader-check") {
    if (isLeader.value) {
      broadcastChannel.value?.postMessage({ type: "leader-response" });
    }
  } else if (event.data.type === "leader-response") {
    // Another tab is already the leader - cancel our election
    if (leaderElectionTimeout.value) {
      clearTimeout(leaderElectionTimeout.value);
      leaderElectionTimeout.value = null;
    }
    isLeader.value = false;
  }
}

/**
 * Initializes the broadcast channel and establishes leadership
 */
function initializeBroadcastChannel(): void {
  if (typeof BroadcastChannel === "undefined") {
    // Fallback for browsers without BroadcastChannel support
    becomeLeader();
    return;
  }

  broadcastChannel.value = new BroadcastChannel(CHANNEL_NAME);
  broadcastChannel.value.addEventListener("message", handleMessage);

  // Simple leader election: ask if there's already a leader
  broadcastChannel.value.postMessage({ type: "leader-check" });

  // If no leader responds within timeout, become the leader
  leaderElectionTimeout.value = window.setTimeout(() => {
    leaderElectionTimeout.value = null;
    if (!isLeader.value) {
      becomeLeader();
    }
  }, LEADER_ELECTION_TIMEOUT_MS);
}

/**
 * Handles the reload action
 */
function handleReload(): void {
  window.location.reload();
}

/**
 * Handles dismissing the update prompt
 */
function handleDismiss(): void {
  showUpdatePrompt.value = false;
}

/**
 * Cleans up resources
 */
function cleanup(): void {
  stopPeriodicCheck();
  if (leaderElectionTimeout.value) {
    clearTimeout(leaderElectionTimeout.value);
    leaderElectionTimeout.value = null;
  }
  if (broadcastChannel.value) {
    broadcastChannel.value.close();
  }
}

// Lifecycle hooks
onMounted(async () => {
  await captureInitialValidator();
  initializeBroadcastChannel();
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
