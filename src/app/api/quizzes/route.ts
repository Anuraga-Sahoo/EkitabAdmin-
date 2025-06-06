
// src/app/api/quizzes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { QuizFormData } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const quizData = (await request.json()) as QuizFormData;

    if (!quizData || !quizData.title || !quizData.testType || !quizData.questions || quizData.questions.length === 0) {
      return NextResponse.json({ message: 'Invalid quiz data provided.' }, { status: 400 });
    }
    
    const { quizzesCollection } = await connectToDatabase();

    // Transform QuizFormData to Quiz before insertion (add IDs)
    const quizToInsert = {
      ...quizData,
      // No need to generate top-level ID, MongoDB will do it.
      // But if you needed to, you'd do it here.
      questions: quizData.questions.map(q => ({
        ...q,
        id: new ObjectId().toHexString(), // Generate ID for each question
        options: q.options.map(opt => ({
          ...opt,
          id: new ObjectId().toHexString(), // Generate ID for each option
        })),
      })),
    };


    const result = await quizzesCollection.insertOne(quizToInsert as any); // Cast as any because MongoDB driver adds _id

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
