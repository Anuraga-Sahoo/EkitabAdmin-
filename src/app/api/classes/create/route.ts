
// src/app/api/classes/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { ClassItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Class name is required and must be a non-empty string.' }, { status: 400 });
    }
    
    name = name.trim().toUpperCase();
    
    const { classesCollection } = await connectToDatabase();

    const existingClass = await classesCollection.findOne({ name: name });
    if (existingClass) {
      return NextResponse.json({ message: `A class named "${name}" already exists.` }, { status: 409 });
    }

    const newClassItem: Omit<ClassItem, '_id' | 'updatedAt'> = {
      name: name,
      createdAt: new Date(),
    };

    const result = await classesCollection.insertOne(newClassItem);

    if (result.insertedId) {
        return NextResponse.json({ message: `Class "${name}" created successfully.`, classId: result.insertedId, name: name }, { status: 201 });
    } else {
        return NextResponse.json({ message: 'Failed to create class entry.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create class:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create class', error: errorMessage }, { status: 500 });
  }
}
