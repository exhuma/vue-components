<script setup lang="ts" generic="T extends { id: string }">
import type { QueryArguments, QueryResult } from "@/repository/types";
import type { ReadonlyHeaders } from "@/types/vuetify";
import { ref, watch } from "vue";
import type { VDataTableServer } from "vuetify/components";

const props = defineProps<{
  repository: {
    query: (args: QueryArguments) => Promise<QueryResult<T>>;
    remove: (id: string) => Promise<void>;
  };
  headers: ReadonlyHeaders;
  title: string;
  icon: string;
}>();

const serverItems = ref<T[]>([]);
const totalItems = ref(0);
const itemsPerPage = ref(10);
const loading = ref(true);
const search = ref("");

const sortBy = ref<VDataTableServer["$props"]["sortBy"]>([]);

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
  sortBy: VDataTableServer["$props"]["sortBy"];
}): void {
  loading.value = true;
  props.repository
    .query({ page, itemsPerPage, sortBy })
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

interface ResourceDataTableAPI {
  reload: () => void;
}

defineExpose<ResourceDataTableAPI>({
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
    item-value="id"
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
      v-for="header in headers.filter((h) => h.key)"
      v-slot:[`item.${header.key}`]="{ item }"
    >
      <slot :name="`item.${header.key}`" :item="item">
        {{ item[header.key as keyof T] }}
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
