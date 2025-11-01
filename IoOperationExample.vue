<!--
Example Vue component showing how to use IoOperation with the activity tracker
-->

<template>
  <v-container>
    <!-- Activity indicator -->
    <v-progress-linear
      :indeterminate="hasIndeterminateJob"
      :model-value="overallProgress * 100"
    />
    {{ overallProgress * 100 }}

    <v-row>
      <v-col>
        <v-btn @click="loadModels" :loading="hasActiveJobs">
          Load Models
        </v-btn>

        <v-btn @click="createModel" :disabled="hasActiveJobs" class="ml-2">
          Create Model
        </v-btn>

        <v-btn
          @click="createMultipleModels"
          :disabled="hasActiveJobs"
          class="ml-2"
        >
          Bulk Create (3 models)
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card v-if="models.length > 0">
          <v-card-title>Models</v-card-title>
          <v-list>
            <v-list-item
              v-for="model in models"
              :key="model.id"
              :title="model.name"
              :subtitle="`Weight: ${model.weight}kg`"
            />
          </v-list>
        </v-card>

        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Model, QueryResult } from "./IoModelRepository.example";
import { IoModelRepository } from "./IoModelRepository.example";
import { useIoActivityTracker } from "./IoActivityTracker";

// Setup activity tracking
const { register, hasActiveJobs, hasIndeterminateJob, overallProgress } =
  useIoActivityTracker();

// Component state
const models = ref<Model[]>([]);
const error = ref<string>("");
const repository = new IoModelRepository();

/**
 * Load models with automatic activity tracking and progress indication
 */
const loadModels = async () => {
  error.value = "";

  try {
    const operation = repository.query({}, { page: 1, size: 10 });

    // Register for activity tracking with description
    register(operation);
    operation.onProgress((progress: number) => {
      console.log(`Loading progress: ${Math.round(progress * 100)}%`);
    });

    // Use the operation with proper error handling
    const result = await operation
      .map((queryResult: QueryResult<Model>) => {
        console.log(`Successfully loaded ${queryResult.items.length} models`);
        return queryResult;
      })
      .catch((err: Error) => {
        // Handle error gracefully
        error.value = `Failed to load models: ${err.message}`;
        return { items: [], total: 0 };
      })
      .toPromise();

    models.value = result.items;
  } catch (err) {
    error.value = `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
};

/**
 * Create a single model with validation
 */
const createModel = async () => {
  error.value = "";

  try {
    const newModelData = {
      name: `Test Model ${Date.now()}`,
      color: "#ff0000",
      weight: 1500,
      length: 450,
      height: 150,
      pictures: [],
      smokingAllowed: false,
      tintedWindows: false,
      airConditioning: true,
      heatedSeats: false,
      navigationSystem: false,
      bluetoothAudio: true,
      cruiseControl: false,
      parkingSensors: false,
      backupCamera: false,
      sunroof: false,
      allWheelDrive: false,
      leatherSeats: false,
      automaticTransmission: true,
      electricWindows: true,
    };

    const operation = repository.validateAndSave(newModelData);
    register(operation);

    const createdModel = await operation
      .map((model: Model) => {
        console.log(`Created model: ${model.name}`);
        return model;
      })
      .toPromise();

    models.value.push(createdModel);
  } catch (err) {
    error.value = `Failed to create model: ${err instanceof Error ? err.message : String(err)}`;
  }
};

/**
 * Create multiple models with aggregated progress
 */
const createMultipleModels = async () => {
  error.value = "";

  try {
    const modelsToCreate = [
      {
        name: "Bulk Model 1",
        color: "#ff0000",
        weight: 1200,
        length: 400,
        height: 140,
      },
      {
        name: "Bulk Model 2",
        color: "#00ff00",
        weight: 1300,
        length: 420,
        height: 145,
      },
      {
        name: "Bulk Model 3",
        color: "#0000ff",
        weight: 1400,
        length: 440,
        height: 150,
      },
    ].map((partial) => ({
      ...partial,
      pictures: [],
      smokingAllowed: false,
      tintedWindows: false,
      airConditioning: true,
      heatedSeats: false,
      navigationSystem: false,
      bluetoothAudio: true,
      cruiseControl: false,
      parkingSensors: false,
      backupCamera: false,
      sunroof: false,
      allWheelDrive: false,
      leatherSeats: false,
      automaticTransmission: true,
      electricWindows: true,
    }));

    const operation = repository.addMultiple(modelsToCreate);
    register(operation);

    const createdModels = await operation
      .map((newModels: Model[]) => {
        console.log(`Created ${newModels.length} models`);
        return newModels;
      })
      .toPromise();

    models.value.push(...createdModels);
  } catch (err) {
    error.value = `Failed to create models: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// Example of monitoring operation progress manually
const loadModelsWithProgressLogging = async () => {
  const operation = repository.query({}, { page: 1, size: 10 });

  // Subscribe to progress updates
  operation.onProgress((progress: number) => {
    console.log(`Loading progress: ${Math.round(progress * 100)}%`);
  });

  register(operation);

  try {
    const result = await operation.toPromise();
    models.value = result.items;
  } catch (err) {
    error.value = `Failed to load: ${err instanceof Error ? err.message : String(err)}`;
  }
};
</script>

<style scoped>
.ml-2 {
  margin-left: 8px;
}
</style>
