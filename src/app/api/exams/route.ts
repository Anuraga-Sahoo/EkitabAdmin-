
// src/app/api/exams/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Exam } from '@/lib/types';

export async function GET() {
  try {
    const { examsCollection } = await connectToDatabase();
    // Fetch exams, sort by name for general purpose use (e.g., dropdowns)
    // Client-side will handle specific sorting for the management table if needed.
    const examsFromDb = await examsCollection.find({}).sort({ name: 1 }).toArray();

    const exams: Exam[] = examsFromDb.map(examDoc => {
      const { _id, ...rest } = examDoc;
      // Ensure all fields from the Exam type are explicitly mapped or spread
      return {
        _id: _id.toHexString(),
        name: rest.name,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt, // Ensure updatedAt is included if present in `rest`
        quizIds: rest.quizIds || [],
      } as Exam; // Cast to Exam to ensure type conformity
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

