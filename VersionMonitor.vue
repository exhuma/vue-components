<template>
  <v-snackbar
    v-model="showUpdateNotification"
    :timeout="-1"
    location="top"
    color="info"
  >
    <div class="notification-content">
      <v-icon>mdi-update</v-icon>
      <span>{{ message }}</span>
    </div>
    <template #actions>
      <v-btn variant="text" @click="reloadPage">
        {{ reloadButtonText }}
      </v-btn>
      <v-btn
        variant="text"
        icon="mdi-close"
        @click="showUpdateNotification = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
  checkIntervalMs?: number;
  message?: string;
  reloadButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  checkIntervalMs: 300000, // 5 minutes
  message: "A new version is available",
  reloadButtonText: "Reload",
});

const showUpdateNotification = ref(false);
const currentVersion = ref<string | null>(null);
let intervalId: ReturnType<typeof setInterval> | null = null;

async function fetchVersion(): Promise<string | null> {
  try {
    const response = await fetch("/version.json", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch (error) {
    console.warn("Failed to fetch version:", error);
    return null;
  }
}

async function checkVersion() {
  const serverVersion = await fetchVersion();

  if (serverVersion === null) {
    return;
  }

  if (currentVersion.value === null) {
    currentVersion.value = serverVersion;
    return;
  }

  if (serverVersion !== currentVersion.value) {
    showUpdateNotification.value = true;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

function reloadPage() {
  window.location.reload();
}

onMounted(() => {
  checkVersion();
  intervalId = setInterval(checkVersion, props.checkIntervalMs);
});

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
