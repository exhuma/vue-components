/**
 * Example showing how to integrate IoOperation with the existing repository pattern
 */

// Define a simple Model type for the example
export interface Model {
  id: string;
  name: string;
  color: string;
  weight: number;
  length: number;
  height: number;
  pictures: any[];
  smokingAllowed: boolean;
  tintedWindows: boolean;
  airConditioning: boolean;
  heatedSeats: boolean;
  navigationSystem: boolean;
  bluetoothAudio: boolean;
  cruiseControl: boolean;
  parkingSensors: boolean;
  backupCamera: boolean;
  sunroof: boolean;
  allWheelDrive: boolean;
  leatherSeats: boolean;
  automaticTransmission: boolean;
  electricWindows: boolean;
}

export interface PaginationArguments {
  page: number;
  size: number;
}

export interface QueryResult<T> {
  items: T[];
  total: number;
}

import { IoOperation, fromPromise, success } from "./IoOperation";

const FAKE_DELAY_MS = 1500;

export class IoModelRepository {
  /**
   * Query models with IoOperation - includes progress tracking for the fake delay
   */
  query(
    query: { [key: string]: any },
    pagination: PaginationArguments,
  ): IoOperation<QueryResult<Model>> {
    return new IoOperation<QueryResult<Model>>((resolve, reject, progress) => {
      console.log(`Querying models with query=${JSON.stringify(query)}`);

      progress(0.1); // Starting query

      // Simulate network request with progress updates
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressValue = Math.min(
          0.9,
          0.1 + (elapsed / FAKE_DELAY_MS) * 0.8,
        );
        progress(progressValue);
      }, 10);

      setTimeout(() => {
        clearInterval(interval);
        progress(1.0);

        // Simulate the actual data processing
        try {
          const mockData: QueryResult<Model> = {
            items: [
              {
                id: "1",
                name: "Ford Focus",
                color: "#0000ff",
                weight: 1345,
                length: 445,
                height: 148,
                pictures: [],
                smokingAllowed: true,
                tintedWindows: false,
                airConditioning: true,
                heatedSeats: true,
                navigationSystem: true,
                bluetoothAudio: true,
                cruiseControl: false,
                parkingSensors: false,
                backupCamera: true,
                sunroof: false,
                allWheelDrive: true,
                leatherSeats: true,
                automaticTransmission: true,
                electricWindows: false,
              },
            ],
            total: 1,
          };
          resolve(mockData);
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, FAKE_DELAY_MS);
    }, false);
  }

  /**
   * Simple operation - converted from Promise to IoOperation
   */
  get(id: string): IoOperation<Model> {
    // For simple operations without custom progress, use fromPromise helper
    return fromPromise(
      new Promise<Model>((resolve, reject) => {
        setTimeout(() => {
          if (id === "404") {
            reject(new Error("Model not found"));
            return;
          }

          resolve({
            id,
            name: "Test Model",
            color: "#000000",
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
          });
        }, FAKE_DELAY_MS);
      }),
    );
  }

  /**
   * Add operation with validation - demonstrates error handling
   */
  add(model: Omit<Model, "id">): IoOperation<Model> {
    return new IoOperation<Model>((resolve, reject, progress) => {
      progress(0.0);

      // Validation phase
      if (!model.name || model.name.trim().length === 0) {
        reject(new Error("Model name is required"));
        return;
      }

      progress(0.3); // Validation complete

      // Simulate network save with progress
      setTimeout(() => {
        progress(0.8); // Upload complete

        // Generate ID and final processing
        const savedModel: Model = {
          ...model,
          id: `model-${Date.now()}`,
        };

        progress(1.0);
        resolve(savedModel);
      }, FAKE_DELAY_MS);
    }, false);
  }

  /**
   * Bulk operation - demonstrates chaining multiple IoOperations
   */
  addMultiple(models: Omit<Model, "id">[]): IoOperation<Model[]> {
    if (models.length === 0) {
      return success([]);
    }

    // Chain operations with proper progress aggregation
    return models.reduce(
      (acc, model, index) => {
        return acc.flatMap((results) =>
          this.add(model).map((newModel) => [...results, newModel]),
        );
      },
      success([] as Model[]),
    );
  }

  /**
   * Operation that might fail - demonstrates error handling patterns
   */
  validateAndSave(model: Omit<Model, "id">): IoOperation<Model> {
    return this.validate(model)
      .flatMap((validatedModel) => this.add(validatedModel))
      .catch((error) => {
        // Could log error, show user-friendly message, etc.
        console.error("Failed to save model:", error);
        throw error; // Re-throw to maintain error state
      });
  }

  private validate(model: Omit<Model, "id">): IoOperation<Omit<Model, "id">> {
    return new IoOperation<Omit<Model, "id">>((resolve, reject, _) => {
      // Simulate validation checks
      setTimeout(() => {
        if (!model.name) {
          reject(new Error("Name is required"));
          return;
        }

        if (model.weight <= 0) {
          reject(new Error("Weight must be positive"));
          return;
        }

        resolve(model);
      }, 50);
    }, true);
  }
}

/**
 * Usage example showing how to integrate with Vue components and activity tracking
 */
export function createModelRepositoryExample() {
  const repository = new IoModelRepository();

  // Example: Query with automatic activity tracking
  const queryModels = (activityTracker: any) => {
    const operation = repository.query({}, { page: 1, size: 10 });

    // Explicit activity registration
    activityTracker.register(operation, "Loading models...");

    // Use the operation
    return operation
      .map((result) => {
        console.log(`Loaded ${result.items.length} models`);
        return result;
      })
      .catch((error) => {
        console.error("Failed to load models:", error);
        return { items: [], total: 0 };
      });
  };

  // Example: Chained operations with progress
  const createModelWorkflow = (modelData: Omit<Model, "id">) => {
    return repository.validateAndSave(modelData).flatMap((savedModel) =>
      // Could chain additional operations like uploading pictures
      success(savedModel),
    );
  };

  return {
    repository,
    queryModels,
    createModelWorkflow,
  };
}
