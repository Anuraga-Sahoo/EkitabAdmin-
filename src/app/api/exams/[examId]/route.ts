
// src/app/api/exams/[examId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = params.examId;
    const body = await request.json();
    const { quizId } = body;

    if (!examId || !ObjectId.isValid(examId)) {
      return NextResponse.json({ message: 'Invalid Exam ID provided.' }, { status: 400 });
    }
    if (!quizId || typeof quizId !== 'string') { // Assuming quizId is a string
      return NextResponse.json({ message: 'Quiz ID is required and must be a string.' }, { status: 400 });
    }

    const { examsCollection } = await connectToDatabase();

    // Add the quizId to the quizIds array of the exam
    // Use $addToSet to avoid duplicate quizIds
    const result = await examsCollection.updateOne(
      { _id: new ObjectId(examId) },
      { $addToSet: { quizIds: quizId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Exam not found.' }, { status: 404 });
    }
    
    // If modifiedCount is 0 but matchedCount is 1, it means the quizId was already in the set.
    // This is not an error, so we can still return success.
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return NextResponse.json({ message: 'Quiz already associated with this exam or no change needed.', examId }, { status: 200 });
    }

    return NextResponse.json({ message: 'Quiz associated with exam successfully', examId }, { status: 200 });

  } catch (error) {
    console.error('Failed to associate quiz with exam:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to associate quiz with exam', error: errorMessage }, { status: 500 });
  }
}
