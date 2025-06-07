
// src/app/api/exams/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Exam } from '@/lib/types'; // Assuming Exam type is defined

function sanitizeExamName(name: string): string {
  return name.trim(); // Basic trimming, more complex sanitization can be added if needed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { examName } = body;

    if (!examName || typeof examName !== 'string' || examName.trim() === '') {
      return NextResponse.json({ message: 'Exam name is required and must be a non-empty string.' }, { status: 400 });
    }
    
    const originalName = examName;
    examName = sanitizeExamName(examName);

    if (!examName) {
        return NextResponse.json({ message: `The provided exam name "${originalName}" is invalid. Please provide a valid name.` }, { status: 400 });
    }

    // Convert examName to uppercase
    examName = examName.toUpperCase();
    
    const { examsCollection } = await connectToDatabase();

    // Check if an exam with this name already exists
    const existingExam = await examsCollection.findOne({ name: examName });
    if (existingExam) {
      return NextResponse.json({ message: `An exam named "${examName}" already exists. Please choose a different name.` }, { status: 409 }); // 409 Conflict
    }

    const newExam: Omit<Exam, '_id'> = {
      name: examName,
      createdAt: new Date(),
      quizIds: [], // Initialize with an empty array for quizIds
    };

    const result = await examsCollection.insertOne(newExam);

    if (result.insertedId) {
        return NextResponse.json({ message: `Exam "${examName}" created successfully.`, examId: result.insertedId }, { status: 201 });
    } else {
        return NextResponse.json({ message: 'Failed to create exam entry.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create exam:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create exam', error: errorMessage }, { status: 500 });
  }
}

