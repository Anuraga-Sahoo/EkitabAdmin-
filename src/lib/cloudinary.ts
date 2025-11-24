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

    // The fileToUpload can be a local path or a data URI.
    // Cloudinary's uploader can handle both directly.
    const uploadResult = await cloudinary.uploader.upload(fileToUpload, {
      folder: folder,
      resource_type: "auto",
    });

    // If the input was a local file path (and not a data URI), we should clean it up.
    // This part is useful if other parts of the app upload from the filesystem.
    if (!fileToUpload.startsWith('data:')) {
      try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        console.warn(`Failed to delete temporary file: ${fileToUpload}`, unlinkError);
      }
    }
    
    return uploadResult;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    
    // Attempt to clean up local file even on failed upload
    if (fileToUpload && !fileToUpload.startsWith('data:')) {
      try {
        await fs.unlink(fileToUpload);
      } catch (unlinkError) {
        // Suppress unlink error after an upload failure to prioritize the upload error.
      }
    }
    // We re-throw the error so the calling function knows the upload failed.
    throw new Error('Cloudinary upload failed.');
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
