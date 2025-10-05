<template>
  <v-dialog v-model="isVisible" width="500">
    <template #activator="{ props }">
      <slot name="button" v-bind="props">Default</slot>
    </template>

    <v-card>
      <v-card-title class="text-h5 bg-error">
        {{ title ?? "Confirm" }}
      </v-card-title>

      <v-card-text class="pt-4">
        <slot></slot>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="isVisible = false">{{
          rejectLabel ?? "Reject"
        }}</v-btn>
        <v-btn color="primary" variant="elevated" @click="onConfirmClicked">{{
          confirmLabel ?? "Confirm"
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  title?: string;
  confirmLabel?: string;
  rejectLabel?: string;
}>();

const emit = defineEmits<{
  (e: "confirmed"): void;
}>();

const isVisible = ref(false);

function onConfirmClicked() {
  emit("confirmed");
  isVisible.value = false;
}
</script>
