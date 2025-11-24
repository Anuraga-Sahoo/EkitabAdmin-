import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // If the input was a local file path (not a data URI), attempt to delete it.
    if (!fileToUpload.startsWith('data:')) {
      try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        // Log if the temporary file deletion fails, but don't fail the whole upload.
        console.warn(`Failed to delete temporary file: ${fileToUpload}`, unlinkError);
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    
    // If it was a file path that failed to upload, still try to clean up.
    if (!fileToUpload.startsWith('data:')) {
      try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        console.error('Error deleting temporary file after failed upload:', unlinkError);
      }
    }
    return null;
  }
};


export const deleteFromCloudinary = async (publicId: string) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};