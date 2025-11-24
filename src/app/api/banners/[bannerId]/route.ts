
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  try {
    const { bannerId } = params;

    if (!bannerId || !ObjectId.isValid(bannerId)) {
      return NextResponse.json({ message: 'Invalid Banner ID provided.' }, { status: 400 });
    }

    const { bannersCollection } = await connectToDatabase();
    
    // Find the banner to get the public_id for Cloudinary deletion
    const bannerToDelete = await bannersCollection.findOne({ _id: new ObjectId(bannerId) });

    if (!bannerToDelete) {
      return NextResponse.json({ message: 'Banner not found.' }, { status: 404 });
    }

    // Delete from Cloudinary
    if (bannerToDelete.publicId) {
      await deleteFromCloudinary(bannerToDelete.publicId);
    }

    // Delete from MongoDB
    const deleteResult = await bannersCollection.deleteOne({ _id: new ObjectId(bannerId) });

    if (deleteResult.deletedCount === 0) {
      // This case is unlikely if findOne succeeded, but good practice to have
      return NextResponse.json({ message: 'Banner not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Banner deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete banner:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to delete banner', error: errorMessage }, { status: 500 });
  }
}
