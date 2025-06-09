
// src/app/api/classes/[classId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = params.classId;
    const body = await request.json();
    let { name } = body;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({ message: 'Invalid Class ID provided.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'New class name is required and must be a non-empty string.' }, { status: 400 });
    }

    name = name.trim().toUpperCase();

    const { classesCollection } = await connectToDatabase();

    const existingClassWithNewName = await classesCollection.findOne({ 
      name: name, 
      _id: { $ne: new ObjectId(classId) } 
    });

    if (existingClassWithNewName) {
      return NextResponse.json({ message: `A class named "${name}" already exists.` }, { status: 409 });
    }

    const result = await classesCollection.updateOne(
      { _id: new ObjectId(classId) },
      { $set: { name: name, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Class not found.' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return NextResponse.json({ message: 'Class name is already up to date or no change needed.', classId, newName: name }, { status: 200 });
    }

    return NextResponse.json({ message: 'Class updated successfully', classId, newName: name }, { status: 200 });

  } catch (error) {
    console.error('Failed to update class:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update class', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = params.classId;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({ message: 'Invalid Class ID provided.' }, { status: 400 });
    }

    const { classesCollection } = await connectToDatabase();
    const result = await classesCollection.deleteOne({ _id: new ObjectId(classId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Class not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Class deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete class:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete class', error: errorMessage }, { status: 500 });
  }
}
