import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath: string, folder: string = "quiz_images") => {
  try {
    if (!localFilePath) return null;
    
    // The uploader can directly handle local file paths and data URIs.
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "auto",
    });
    
    // If the input was a local file path (not a data URI), delete it.
    if (!localFilePath.startsWith('data:')) {
      await fs.unlink(localFilePath);
    }
    return uploadResult;
  } catch (error) {
    // If it was a file path, attempt to unlink it even on failure.
    if (!localFilePath.startsWith('data:')) {
      try {
          await fs.unlink(localFilePath);
      } catch (unlinkError) {
          console.error('Error deleting temporary file after failed upload:', unlinkError);
      }
    }
    console.error('Cloudinary Upload Error:', error);
    return null;
  }
};


export const uploadDataUriToCloudinary = async (dataUri: string, folder: string = "quiz_images") => {
    try {
        if (!dataUri) return null;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: folder,
            resource_type: "auto",
        });

        return uploadResult;

    } catch (error) {
        console.error('Cloudinary Data URI Upload Error:', error);
        return null;
    }
}


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
