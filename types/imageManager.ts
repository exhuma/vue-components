/**
 * Interface for managing named images (upload and delete operations).
 * This interface should be implemented by any repository that handles
 * image management for the ImageUploadCard component.
 */
export interface ImageManager {
  /**
   * Upload an image file with the specified name.
   * @param imageName The name/identifier for the image (e.g., "logo", "watermark")
   * @param file The image file to upload
   * @returns A promise that resolves when the upload is complete
   */
  uploadImage(imageName: string, file: File): Promise<void>;

  /**
   * Delete an image with the specified name.
   * @param imageName The name/identifier for the image to delete
   * @returns A promise that resolves when the deletion is complete
   */
  deleteImage(imageName: string): Promise<void>;
}
