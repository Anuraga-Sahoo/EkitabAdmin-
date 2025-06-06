
// src/app/api/quizzes/[quizId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Placeholder for GET single quiz (if needed for edit page)
// export async function GET(request: NextRequest, { params }: { params: { quizId: string } }) {
//   // ...
// }

// Placeholder for PUT (update quiz)
// export async function PUT(request: NextRequest, { params }: { params: { quizId: string } }) {
//   // ...
// }

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
