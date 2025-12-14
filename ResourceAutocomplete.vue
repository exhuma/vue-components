<template>
  <v-autocomplete
    v-model="internalValue"
    v-model:search="search"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    clearable
    :loading="loading"
    :label="label"
    :density="density"
    :hide-details="hideDetails"
    :variant="variant"
    autocomplete="off"
  />
</template>

<script setup lang="ts">
import { debounce } from "lodash";
import { ref, watch, onMounted } from "vue";

interface BaseItem {
  id: string;
  name: string;
}

interface Repository<T extends BaseItem> {
  get(id: string): Promise<T | null | undefined>;
  getInitialSet(): Promise<T[]>;
  query(params: { name: string }): Promise<{ items: T[] }>;
}

interface Props {
  label: string;
  modelValue?: string;
  repository: Repository<any>;
  itemTitle?: string;
  itemValue?: string;
  density?: "default" | "comfortable" | "compact";
  hideDetails?: boolean | "auto";
  variant?:
    | "outlined"
    | "filled"
    | "underlined"
    | "plain"
    | "solo"
    | "solo-inverted"
    | "solo-filled";
}

const props = withDefaults(defineProps<Props>(), {
  itemTitle: "name",
  itemValue: "id",
  density: "compact",
  hideDetails: "auto",
  variant: "outlined",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "item-selected", value: any): void;
}>();

const internalValue = ref(props.modelValue || "");
const search = ref("");
const items = ref<any[]>([]);
const loading = ref(false);

// Fetch initial set of items on mount
onMounted(async () => {
  loading.value = true;
  try {
    items.value = await props.repository.getInitialSet();
  } catch (error) {
    console.error("Failed to fetch initial items:", error);
  } finally {
    loading.value = false;
  }
});

// Load the initial item if modelValue is provided
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && !items.value.find((item) => item.id === newValue)) {
      loading.value = true;
      try {
        const item = await props.repository.get(newValue);
        if (item && !items.value.find((i) => i.id === item.id)) {
          items.value = [item, ...items.value];
        }
      } finally {
        loading.value = false;
      }
    }
    internalValue.value = newValue || "";
  },
  { immediate: true },
);

watch(
  search,
  debounce(async (query: string) => {
    if (!query) {
      // When search is cleared, reload the initial set
      loading.value = true;
      try {
        items.value = await props.repository.getInitialSet();
      } catch (error) {
        console.error("Failed to fetch initial items:", error);
      } finally {
        loading.value = false;
      }
      return;
    }
    loading.value = true;
    try {
      const result = await props.repository.query({ name: query });
      items.value = result.items;
    } catch (error) {
      console.error("Failed to search items:", error);
    } finally {
      loading.value = false;
    }
  }, 300),
);

watch(internalValue, (newValue) => {
  emit("update:modelValue", newValue);
  const selectedItem = items.value.find((item) => item.id === newValue);
  if (selectedItem) {
    emit("item-selected", selectedItem);
  }
});
</script>
