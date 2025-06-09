
// src/app/api/chapters/[chapterId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const chapterId = params.chapterId;
    const body = await request.json();
    let { name } = body;

    if (!chapterId || !ObjectId.isValid(chapterId)) {
      return NextResponse.json({ message: 'Invalid Chapter ID provided.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'New chapter name is required and must be a non-empty string.' }, { status: 400 });
    }

    name = name.trim().toUpperCase();

    const { chaptersCollection } = await connectToDatabase();

    const existingChapterWithNewName = await chaptersCollection.findOne({ 
      name: name, 
      _id: { $ne: new ObjectId(chapterId) } 
    });

    if (existingChapterWithNewName) {
      return NextResponse.json({ message: `A chapter named "${name}" already exists.` }, { status: 409 });
    }

    const result = await chaptersCollection.updateOne(
      { _id: new ObjectId(chapterId) },
      { $set: { name: name, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Chapter not found.' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return NextResponse.json({ message: 'Chapter name is already up to date or no change needed.', chapterId, newName: name }, { status: 200 });
    }

    return NextResponse.json({ message: 'Chapter updated successfully', chapterId, newName: name }, { status: 200 });

  } catch (error) {
    console.error('Failed to update chapter:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update chapter', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const chapterId = params.chapterId;

    if (!chapterId || !ObjectId.isValid(chapterId)) {
      return NextResponse.json({ message: 'Invalid Chapter ID provided.' }, { status: 400 });
    }

    const { chaptersCollection } = await connectToDatabase();
    const result = await chaptersCollection.deleteOne({ _id: new ObjectId(chapterId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Chapter not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chapter deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete chapter:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete chapter', error: errorMessage }, { status: 500 });
  }
}
