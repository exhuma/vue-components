<!--
A VueJS component providing a Vuetify "v-progress-linear" component that tracks
multiple jobs.

Each job is associated with a progress value ranging from -1 (indeterminate) to
100.

If any of the values is indeterminate, the progress-bar switches to
indeterminate mode. Otherwise it show the average value of each tracked
progress-value.
-->

<template>
  <v-progress-linear
    :indeterminate="isIndeterminate"
    :model-value="aggregateValue"
  ></v-progress-linear>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
const props = withDefaults(
  defineProps<{
    jobs?: number[];
  }>(),
  {
    modelValue: 0,
  },
);

const aggregateValue = computed({
  get: () => {
    const sum = props.jobs.reduce((agg, val) => agg + val, 0);
    return sum / props.jobs.length;
  },
});

const isIndeterminate = computed({
  get: () => {
    return props.jobs.find((val) => val < 0) !== undefined;
  },
});
</script>
