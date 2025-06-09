
// src/app/api/subjects/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { SubjectItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Subject name is required and must be a non-empty string.' }, { status: 400 });
    }
    
    name = name.trim().toUpperCase();
    
    const { subjectsCollection } = await connectToDatabase();

    const existingSubject = await subjectsCollection.findOne({ name: name });
    if (existingSubject) {
      return NextResponse.json({ message: `A subject named "${name}" already exists.` }, { status: 409 });
    }

    const newSubjectItem: Omit<SubjectItem, '_id' | 'updatedAt'> = {
      name: name,
      createdAt: new Date(),
    };

    const result = await subjectsCollection.insertOne(newSubjectItem);

    if (result.insertedId) {
        return NextResponse.json({ message: `Subject "${name}" created successfully.`, subjectId: result.insertedId, name: name }, { status: 201 });
    } else {
        return NextResponse.json({ message: 'Failed to create subject entry.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create subject:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create subject', error: errorMessage }, { status: 500 });
  }
}
