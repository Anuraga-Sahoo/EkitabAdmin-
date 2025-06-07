
// src/app/api/exams/[examId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Existing PUT for associating quiz with exam
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
    if (!quizId || typeof quizId !== 'string') { 
      return NextResponse.json({ message: 'Quiz ID is required and must be a string.' }, { status: 400 });
    }

    const { examsCollection } = await connectToDatabase();

    const result = await examsCollection.updateOne(
      { _id: new ObjectId(examId) },
      { $addToSet: { quizIds: quizId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Exam not found.' }, { status: 404 });
    }
    
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

// New PATCH for updating exam name
export async function PATCH(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = params.examId;
    const body = await request.json();
    let { name } = body;

    if (!examId || !ObjectId.isValid(examId)) {
      return NextResponse.json({ message: 'Invalid Exam ID provided.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'New exam name is required and must be a non-empty string.' }, { status: 400 });
    }

    name = name.trim().toUpperCase();

    const { examsCollection } = await connectToDatabase();

    // Check if another exam (excluding the current one) already has this name
    const existingExamWithNewName = await examsCollection.findOne({ 
      name: name, 
      _id: { $ne: new ObjectId(examId) } 
    });

    if (existingExamWithNewName) {
      return NextResponse.json({ message: `An exam named "${name}" already exists. Please choose a different name.` }, { status: 409 });
    }

    const result = await examsCollection.updateOne(
      { _id: new ObjectId(examId) },
      { $set: { name: name, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Exam not found.' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return NextResponse.json({ message: 'Exam name is already up to date or no change needed.', examId }, { status: 200 });
    }

    return NextResponse.json({ message: 'Exam updated successfully', examId, newName: name }, { status: 200 });

  } catch (error) {
    console.error('Failed to update exam:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update exam', error: errorMessage }, { status: 500 });
  }
}

// New DELETE for deleting an exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = params.examId;

    if (!examId || !ObjectId.isValid(examId)) {
      return NextResponse.json({ message: 'Invalid Exam ID provided.' }, { status: 400 });
    }

    const { examsCollection } = await connectToDatabase();
    const result = await examsCollection.deleteOne({ _id: new ObjectId(examId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Exam not found or already deleted.' }, { status: 404 });
    }

    // Optionally: You might want to disassociate quizzes linked to this exam.
    // This would involve updating documents in the 'quizzes' collection.
    // For now, we are just deleting the exam entry.

    return NextResponse.json({ message: 'Exam deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete exam:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete exam', error: errorMessage }, { status: 500 });
  }
}
