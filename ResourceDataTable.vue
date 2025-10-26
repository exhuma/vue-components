<script setup lang="ts" generic="T extends object">
import type { DataTableSortItem } from "vuetify";
import type {
  PaginationArguments,
  QueryResult,
  SortByItem,
} from "./types/query";
import type { ReadonlyHeaders } from "./types/vuetify";
import { ref, watch } from "vue";
import type { VDataTableServer } from "vuetify/components";
import type {ResourceDataTableApi } from "./types/ResourceDataTable";

const props = defineProps<{
  repository: {
    query: (
      query: { [key: string]: any },
      pagination: PaginationArguments,
    ) => Promise<QueryResult<T>>;
    remove: (id: string) => Promise<void>;
  };
  headers: ReadonlyHeaders;
  title: string;
  icon: string;
  itemValue?: string;
}>();

const serverItems = ref<T[]>([]);
const totalItems = ref(0);
const itemsPerPage = ref(10);
const loading = ref(true);
const search = ref("");

const sortBy = ref<DataTableSortItem[]>([]);

watch(
  sortBy,
  () => {
    loadItems({
      page: 1,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  },
  { deep: true },
);

function loadItems({
  page,
  itemsPerPage,
  sortBy,
}: {
  page: number;
  itemsPerPage: number;
  sortBy: SortByItem[];
}): void {
  loading.value = true;
  props.repository
    .query({}, { page, itemsPerPage, sortBy })
    .then(({ items, total }) => {
      serverItems.value = items;
      totalItems.value = total;
      loading.value = false;
    });
}

function reload() {
  loadItems({
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
}

function getTemplateItems(hdrs: ReadonlyHeaders): { slotName: string; slotRenderer: (item: T) => string; }[] {
  const output: {slotName: string; slotRenderer: (item: T) => string;}[] = []
  for (const header of hdrs ?? []) {
    if (!header.key) {
      continue;
    }
    const k = header.key;
    output.push({
      slotName: `item.${k}`,
      slotRenderer: (item) => item[k as keyof T] as unknown as string,
    });
  }
  return output
}

defineExpose<ResourceDataTableApi>({
  reload,
});
</script>

<template>
  <v-data-table-server
    v-model:items-per-page="itemsPerPage"
    v-model:sort-by="sortBy"
    :headers="headers"
    :items="serverItems"
    :search="search"
    :items-length="totalItems"
    :loading="loading"
    :item-value="itemValue || 'id'"
    @update:options="loadItems"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>
          <v-icon
            color="medium-emphasis"
            :icon="icon"
            size="x-small"
            start
          ></v-icon>
          {{ title }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <slot name="toolbar-actions"></slot>
      </v-toolbar>
    </template>

    <template
      v-for="tpl in getTemplateItems(headers)"
      v-slot:[`${tpl.slotName}`]="{ item }"
    >
      <slot :name="tpl.slotName" :item="item">
        {{ tpl.slotRenderer(item) }}
      </slot>
    </template>

    <template v-slot:no-data>
      <v-btn
        prepend-icon="mdi-backup-restore"
        rounded="lg"
        text="Reset data"
        variant="text"
        border
        @click="reload"
      ></v-btn>
    </template>
  </v-data-table-server>
</template>
