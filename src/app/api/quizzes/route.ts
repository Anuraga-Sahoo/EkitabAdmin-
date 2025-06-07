// src/app/api/quizzes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { QuizFormData, Quiz, Question } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const quizData = (await request.json()) as QuizFormData;

    if (!quizData || !quizData.title || !quizData.testType || !quizData.questions || quizData.questions.length === 0) {
      return NextResponse.json({ message: 'Invalid quiz data provided.' }, { status: 400 });
    }
    if (quizData.timerMinutes !== undefined && (typeof quizData.timerMinutes !== 'number' || quizData.timerMinutes < 0)) {
      return NextResponse.json({ message: 'Invalid timer value provided.' }, { status: 400 });
    }

    for (const q of quizData.questions) {
        if (q.marks === undefined || q.marks <= 0) {
            return NextResponse.json({ message: `Question "${q.text.substring(0,20)}..." must have positive marks.` }, { status: 400 });
        }
        if (q.negativeMarks !== undefined && q.negativeMarks < 0) {
            return NextResponse.json({ message: `Question "${q.text.substring(0,20)}..." negative marks must be non-negative.` }, { status: 400 });
        }
    }

    const { quizzesCollection } = await connectToDatabase();

    const quizToInsert = {
      ...quizData,
      questions: quizData.questions.map(q => ({
        ...q,
        id: new ObjectId().toHexString(),
        marks: q.marks, // Ensure marks are included
        negativeMarks: q.negativeMarks === undefined ? 0 : q.negativeMarks, // Default negativeMarks to 0
        options: q.options.map(opt => ({
          ...opt,
          id: new ObjectId().toHexString(),
        })),
      })),
      status: 'Draft', 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await quizzesCollection.insertOne(quizToInsert as any);

    if (result.insertedId) {
      return NextResponse.json({ message: 'Quiz created successfully', quizId: result.insertedId }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Failed to create quiz' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to create quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create quiz', error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { quizzesCollection } = await connectToDatabase();
    const quizzesFromDb = await quizzesCollection.find({}).sort({ createdAt: -1 }).toArray();

    const quizzes: Quiz[] = quizzesFromDb.map(quizDoc => {
      const { _id, ...rest } = quizDoc;
      return {
        _id: _id.toHexString(),
        ...rest,
        // Ensure questions have marks and negativeMarks, defaulting if necessary
        questions: (rest.questions as Question[] || []).map(q => ({
            ...q,
            marks: q.marks === undefined ? 1 : q.marks,
            negativeMarks: q.negativeMarks === undefined ? 0 : q.negativeMarks,
        })),
      } as Quiz; 
    });

    return NextResponse.json(quizzes, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch quizzes', error: errorMessage }, { status: 500 });
  }
}