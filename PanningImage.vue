<template>
  <div class="panning-image">
    <img
      v-if="src"
      :src="src"
      class="panning-image__img"
      :style="{ animationDuration: `${duration}s` }"
      alt=""
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  src?: string | null;
  duration?: number;
}

withDefaults(defineProps<Props>(), {
  src: null,
  duration: 30,
});
</script>

<style scoped>
.panning-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111;
}

.panning-image__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: panning-image-pan ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes panning-image-pan {
  0% {
    transform: scale(1.12) translate(0%, 0%);
  }
  33% {
    transform: scale(1.12) translate(-3%, -2%);
  }
  66% {
    transform: scale(1.12) translate(2%, -3%);
  }
  100% {
    transform: scale(1.12) translate(-1.5%, 2%);
  }
}
</style>
