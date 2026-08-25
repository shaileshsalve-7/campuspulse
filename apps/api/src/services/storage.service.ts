export interface StorageService {
  upload(input: { originalName: string; mimeType: string; bytes: Buffer }): Promise<{ url: string }>;
}

/** Provider boundary for Cloudinary or S3. File streams never expose provider credentials to the browser. */
export const storageService: StorageService = {
  async upload() {
    throw new Error('No storage provider is configured. Supply an image URL or configure an API-side storage adapter.');
  },
};
