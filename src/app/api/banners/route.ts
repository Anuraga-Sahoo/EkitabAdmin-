
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { uploadOnCloudinary } from '@/lib/cloudinary';
import type { Banner } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('bannerImage') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No image file provided.' }, { status: 400 });
    }

    // Write file to a temporary location
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = '/tmp';
    // Ensure the temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create a unique temporary file path
    const tempFilePath = path.join(tempDir, `banner-${Date.now()}-${file.name}`);
    await fs.writeFile(tempFilePath, buffer);

    const uploadResult = await uploadOnCloudinary(tempFilePath);

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
      throw new Error('Cloudinary upload failed.');
    }

    const { bannersCollection } = await connectToDatabase();
    
    const newBanner: Omit<Banner, '_id'> = {
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      createdAt: new Date(),
    };

    const result = await bannersCollection.insertOne(newBanner as any);

    if (!result.insertedId) {
      throw new Error('Failed to save banner details to database.');
    }

    return NextResponse.json({ 
        message: 'Banner uploaded successfully', 
        banner: {
            _id: result.insertedId.toHexString(),
            ...newBanner
        }
    }, { status: 201 });

  } catch (error) {
    console.error('Banner upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: 'Failed to upload banner', error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
    try {
        const { bannersCollection } = await connectToDatabase();
        const bannersFromDb = await bannersCollection.find({}).sort({ createdAt: -1 }).toArray();

        const banners: Banner[] = bannersFromDb.map(doc => ({
            _id: doc._id.toHexString(),
            imageUrl: doc.imageUrl,
            publicId: doc.publicId,
            createdAt: doc.createdAt,
        }));

        return NextResponse.json(banners, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to fetch banners', error: errorMessage }, { status: 500 });
    }
}
