<template>
  <div class="confirmed-button-wrapper">
    <!-- Default slot for trigger button - no props passed -->
    <slot @click="openDialog" :disabled="disabled" :open="openDialog"></slot>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="isVisible" width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-error text-white">
          {{ title }}
        </v-card-title>

        <v-card-text class="pt-4">
          <slot name="content"> Are you sure you want to proceed? </slot>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="onCancelClicked">
            {{ rejectLabel }}
          </v-btn>
          <v-btn color="error" variant="elevated" @click="onConfirmClicked">
            {{ confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

export interface ConfirmedButtonProps {
  title?: string;
  confirmLabel?: string;
  rejectLabel?: string;
  disabled?: boolean;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<ConfirmedButtonProps>(), {
  title: "Confirm",
  confirmLabel: "Confirm",
  rejectLabel: "Cancel",
  disabled: false,
  modelValue: false,
});

const emit = defineEmits<{
  (e: "confirmed"): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const internalVisible = ref(false);

const isVisible = computed({
  get: () => props.modelValue || internalVisible.value,
  set: (value: boolean) => {
    internalVisible.value = value;
    emit("update:modelValue", value);
  },
});

function openDialog() {
  if (!props.disabled) {
    isVisible.value = true;
  }
}

function onConfirmClicked() {
  emit("confirmed");
  isVisible.value = false;
}

function onCancelClicked() {
  isVisible.value = false;
}

// Expose methods for parent components
defineExpose({
  open: openDialog,
  close: () => (isVisible.value = false),
});
</script>

<style scoped>
.confirmed-button-wrapper {
  display: inline-block;
}
</style>
