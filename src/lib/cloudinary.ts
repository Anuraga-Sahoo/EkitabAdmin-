import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public ID from a Cloudinary URL.
 * @param url The full Cloudinary URL.
 * @returns The public ID (e.g., "folder/image_name").
 */
export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        const regex = /v\d+\/(.+?)(?:\.\w+)?$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error("Error extracting public ID from URL:", error);
        return null;
    }
};


/**
 * Uploads a file to Cloudinary. This function can handle both a local file path
 * and a base64 encoded data URI.
 * @param fileToUpload - The local file path or data URI of the file to upload.
 * @param folder - The folder in Cloudinary to upload the file to.
 * @returns The upload result from Cloudinary or null on failure.
 */
export const uploadOnCloudinary = async (fileToUpload: string, folder: string = "quiz_images") => {
  try {
    if (!fileToUpload) return null;

    const uploadResult = await cloudinary.uploader.upload(fileToUpload, {
      folder: folder,
      resource_type: "auto",
    });

    if (fileToUpload && !fileToUpload.startsWith('data:') && fs.unlink) {
       try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        console.warn(`Failed to delete temporary file: ${fileToUpload}`, unlinkError);
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    
    if (fileToUpload && !fileToUpload.startsWith('data:')) {
      try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        // Suppress unlink error after an upload failure to prioritize the upload error.
      }
    }
    throw new Error('Cloudinary upload failed.');
  }
};


/**
 * Deletes a single image from Cloudinary.
 * @param publicId The public ID of the image to delete.
 * @returns The result of the deletion operation.
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary delete result:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

/**
 * Deletes multiple images from Cloudinary.
 * @param publicIds An array of public IDs of the images to delete.
 * @returns The result of the deletion operation.
 */
export const deleteMultipleFromCloudinary = async (publicIds: string[]) => {
    try {
        if (!publicIds || publicIds.length === 0) return null;
        const result = await cloudinary.api.delete_resources(publicIds);
        console.log("Cloudinary multiple delete result:", result);
        return result;
    } catch (error) {
        console.error("Cloudinary Multiple Delete Error:", error);
        throw new Error("Failed to delete multiple images from Cloudinary");
    }
};