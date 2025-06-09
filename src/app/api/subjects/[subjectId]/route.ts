
// src/app/api/subjects/[subjectId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const subjectId = params.subjectId;
    const body = await request.json();
    let { name } = body;

    if (!subjectId || !ObjectId.isValid(subjectId)) {
      return NextResponse.json({ message: 'Invalid Subject ID provided.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'New subject name is required and must be a non-empty string.' }, { status: 400 });
    }

    name = name.trim().toUpperCase();

    const { subjectsCollection } = await connectToDatabase();

    const existingSubjectWithNewName = await subjectsCollection.findOne({ 
      name: name, 
      _id: { $ne: new ObjectId(subjectId) } 
    });

    if (existingSubjectWithNewName) {
      return NextResponse.json({ message: `A subject named "${name}" already exists.` }, { status: 409 });
    }

    const result = await subjectsCollection.updateOne(
      { _id: new ObjectId(subjectId) },
      { $set: { name: name, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return NextResponse.json({ message: 'Subject name is already up to date or no change needed.', subjectId, newName: name }, { status: 200 });
    }

    return NextResponse.json({ message: 'Subject updated successfully', subjectId, newName: name }, { status: 200 });

  } catch (error) {
    console.error('Failed to update subject:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update subject', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const subjectId = params.subjectId;

    if (!subjectId || !ObjectId.isValid(subjectId)) {
      return NextResponse.json({ message: 'Invalid Subject ID provided.' }, { status: 400 });
    }

    const { subjectsCollection } = await connectToDatabase();
    const result = await subjectsCollection.deleteOne({ _id: new ObjectId(subjectId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Subject not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subject deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete subject:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete subject', error: errorMessage }, { status: 500 });
  }
}
