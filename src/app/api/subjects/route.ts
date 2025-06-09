
// src/app/api/subjects/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { SubjectItem } from '@/lib/types';

export async function GET() {
  try {
    const { subjectsCollection } = await connectToDatabase();
    const subjectsFromDb = await subjectsCollection.find({}).sort({ name: 1 }).toArray();

    const subjects: SubjectItem[] = subjectsFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return {
        _id: _id.toHexString(),
        name: rest.name,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      } as SubjectItem;
    });

    return NextResponse.json(subjects, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch subjects', error: errorMessage }, { status: 500 });
  }
}
