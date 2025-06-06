
// src/app/api/quizzes/[quizId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { QuizStatus } from '@/lib/types';

// Placeholder for GET single quiz (if needed for edit page)
// export async function GET(request: NextRequest, { params }: { params: { quizId: string } }) {
//   // ...
// }

export async function PUT(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const quizId = params.quizId;
    const body = await request.json();
    const { status } = body as { status: QuizStatus };

    if (!quizId || !ObjectId.isValid(quizId)) {
      return NextResponse.json({ message: 'Invalid Quiz ID provided.' }, { status: 400 });
    }

    if (!status || !['Published', 'Draft', 'Private'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status provided. Must be Published, Draft, or Private.' }, { status: 400 });
    }

    const { quizzesCollection } = await connectToDatabase();
    const result = await quizzesCollection.updateOne(
      { _id: new ObjectId(quizId) },
      { $set: { status: status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }
    
    // If modifiedCount is 0 but matchedCount is 1, it means the status was already set to the new value.
    // This is not an error, so we can return a success response.
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return NextResponse.json({ message: 'Quiz status is already up to date.', quizId }, { status: 200 });
    }

    return NextResponse.json({ message: 'Quiz status updated successfully', quizId }, { status: 200 });
  } catch (error) {
    console.error('Failed to update quiz status:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update quiz status', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const quizId = params.quizId;

    if (!quizId || !ObjectId.isValid(quizId)) {
      return NextResponse.json({ message: 'Invalid Quiz ID provided.' }, { status: 400 });
    }

    const { quizzesCollection } = await connectToDatabase();
    const result = await quizzesCollection.deleteOne({ _id: new ObjectId(quizId) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Quiz deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Quiz not found or already deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete quiz', error: errorMessage }, { status: 500 });
  }
}
