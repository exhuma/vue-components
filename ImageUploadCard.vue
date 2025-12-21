<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>{{ icon }}</v-icon>
      {{ title }}
    </v-card-title>
    <v-card-text>
      <div v-if="loading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else>
        <!-- Display current image -->
        <div v-if="imageExists" class="mb-4">
          <v-img :src="imageUrl" max-height="200" contain class="mb-2" />
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            @click="$emit('delete')"
          >
            <v-icon start>mdi-delete</v-icon>
            {{ removeLabel }}
          </v-btn>
        </div>

        <!-- No image placeholder -->
        <div
          v-else
          class="text-center pa-4 text-medium-emphasis drop-zone"
          :class="{ 'drop-zone-active': isDragging }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @dragenter.prevent="isDragging = true"
        >
          <v-icon size="48">{{
            isDragging ? "mdi-image-plus" : "mdi-image-off"
          }}</v-icon>
          <p>{{ noImageLabel }}</p>
          <p v-if="!isDragging" class="text-caption">{{ dropHintLabel }}</p>
        </div>

        <!-- File input -->
        <v-file-input
          v-model="fileInput"
          accept="image/*"
          :label="uploadLabel"
          prepend-icon="mdi-camera"
          variant="outlined"
          density="comfortable"
          :loading="uploading"
          @update:model-value="handleFileSelect"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import type { ImageManager } from "./types/imageManager";

interface Props {
  imageName: string;
  title: string;
  icon?: string;
  uploadLabel: string;
  removeLabel: string;
  noImageLabel: string;
  dropHintLabel?: string;
  imageUrl: string;
  imageManagerKey?: string;
}

interface Emits {
  (e: "upload-success"): void;
  (e: "upload-error", error: Error): void;
  (e: "delete"): void;
  (e: "image-exists-changed", exists: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "mdi-image",
  dropHintLabel: "Or drag and drop an image here",
  imageManagerKey: "imageManager",
});

const emit = defineEmits<Emits>();

const imageManager = inject<ImageManager>(props.imageManagerKey);

const loading = ref(false);
const uploading = ref(false);
const imageExists = ref(false);
const fileInput = ref<File[]>([]);
const isDragging = ref(false);

async function checkImageExists() {
  loading.value = true;
  try {
    const response = await fetch(props.imageUrl);
    imageExists.value = response.ok;
    emit("image-exists-changed", response.ok);
  } catch {
    imageExists.value = false;
    emit("image-exists-changed", false);
  } finally {
    loading.value = false;
  }
}

async function uploadImage(file: File) {
  if (!imageManager) {
    console.error("ImageManager not provided via dependency injection");
    emit("upload-error", new Error("ImageManager not available"));
    return;
  }

  uploading.value = true;
  try {
    await imageManager.uploadImage(props.imageName, file);
    imageExists.value = true;
    fileInput.value = [];
    emit("upload-success");
    emit("image-exists-changed", true);
  } catch (error) {
    console.error(`Failed to upload ${props.imageName}:`, error);
    emit("upload-error", error as Error);
  } finally {
    uploading.value = false;
  }
}

async function handleFileSelect(files: File | File[]) {
  const fileArray = Array.isArray(files) ? files : [files];
  if (!fileArray || fileArray.length === 0) {
    return;
  }

  await uploadImage(fileArray[0]);
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }

  const file = files[0];
  if (!file.type.startsWith("image/")) {
    console.warn("Dropped file is not an image");
    emit("upload-error", new Error("File must be an image"));
    return;
  }

  await uploadImage(file);
}

onMounted(() => {
  checkImageExists();
});

defineExpose({
  refresh: checkImageExists,
});
</script>

<style scoped>
.v-img {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.drop-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone-active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
