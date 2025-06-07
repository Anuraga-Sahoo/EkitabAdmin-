
// src/app/api/exams/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Exam } from '@/lib/types';

export async function GET() {
  try {
    const { examsCollection } = await connectToDatabase();
    const examsFromDb = await examsCollection.find({}).sort({ name: 1 }).toArray(); // Sort by name for dropdown

    const exams: Exam[] = examsFromDb.map(examDoc => {
      const { _id, ...rest } = examDoc;
      return {
        _id: _id.toHexString(),
        name: rest.name, // Ensure name is explicitly included
        createdAt: rest.createdAt, // Ensure createdAt is explicitly included
        quizIds: rest.quizIds || [], // Ensure quizIds is an array
      } as Exam; // Cast to Exam after transformation
    });

    return NextResponse.json(exams, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch exams', error: errorMessage }, { status: 500 });
  }
}
