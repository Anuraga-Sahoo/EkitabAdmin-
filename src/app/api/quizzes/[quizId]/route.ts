
// src/app/api/quizzes/[quizId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { QuizStatus, Quiz, QuizFormData, Question } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const quizId = params.quizId;

    if (!quizId || !ObjectId.isValid(quizId)) {
      return NextResponse.json({ message: 'Invalid Quiz ID provided.' }, { status: 400 });
    }

    const { quizzesCollection } = await connectToDatabase();
    const quizDoc = await quizzesCollection.findOne({ _id: new ObjectId(quizId) });

    if (!quizDoc) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    const quiz: Quiz = {
      _id: quizDoc._id.toHexString(),
      title: quizDoc.title,
      testType: quizDoc.testType,
      classType: quizDoc.classType,
      subject: quizDoc.subject,
      chapter: quizDoc.chapter,
      tags: quizDoc.tags,
      timerMinutes: quizDoc.timerMinutes,
      questions: (quizDoc.questions as Question[] || []).map(q => ({
        ...q,
        id: q.id || new ObjectId().toHexString(), 
        marks: q.marks === undefined ? 1 : q.marks, 
        negativeMarks: q.negativeMarks === undefined ? 0 : q.negativeMarks, 
        options: q.options.map(o => ({
            ...o,
            id: o.id || new ObjectId().toHexString() 
        }))
      })),
      status: quizDoc.status,
      createdAt: quizDoc.createdAt,
      updatedAt: quizDoc.updatedAt,
    };

    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch quiz', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const quizId = params.quizId;
    const body = await request.json();

    if (!quizId || !ObjectId.isValid(quizId)) {
      return NextResponse.json({ message: 'Invalid Quiz ID provided.' }, { status: 400 });
    }

    const { quizzesCollection } = await connectToDatabase();

    if (body.status && Object.keys(body).length === 1) {
      const { status } = body as { status: QuizStatus };
      if (!['Published', 'Draft', 'Private'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status provided. Must be Published, Draft, or Private.' }, { status: 400 });
      }
      const result = await quizzesCollection.updateOne(
        { _id: new ObjectId(quizId) },
        { $set: { status: status, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
      }
      if (result.modifiedCount === 0 && result.matchedCount === 1) {
         return NextResponse.json({ message: 'Quiz status is already up to date.', quizId }, { status: 200 });
      }
      return NextResponse.json({ message: 'Quiz status updated successfully', quizId }, { status: 200 });
    }

    const quizData = body as Omit<QuizFormData, 'questions'> & { questions: Array<Omit<QuizFormData['questions'][0], 'options' | 'marks' | 'negativeMarks'> & { marks: number; negativeMarks?: number; options: Array<QuizFormData['questions'][0]['options'][0] & {id?: string}>, id?: string }> };


    if (!quizData.title || !quizData.testType || !quizData.questions || quizData.questions.length === 0) {
      return NextResponse.json({ message: 'Invalid quiz data provided for update.' }, { status: 400 });
    }
     if (quizData.timerMinutes !== undefined && (typeof quizData.timerMinutes !== 'number' || quizData.timerMinutes < 0)) {
      return NextResponse.json({ message: 'Invalid timer value provided.' }, { status: 400 });
    }

    for (const q of quizData.questions) {
        if (q.marks === undefined || typeof q.marks !== 'number' || q.marks <= 0) {
             return NextResponse.json({ message: `Question "${q.text.substring(0,20)}..." must have positive marks.` }, { status: 400 });
        }
        if (q.negativeMarks !== undefined && (typeof q.negativeMarks !== 'number' || q.negativeMarks < 0)) {
            return NextResponse.json({ message: `Question "${q.text.substring(0,20)}..." negative marks must be non-negative.` }, { status: 400 });
        }
    }

    const quizToUpdate = {
      ...quizData,
      questions: quizData.questions.map(q => ({
        ...q,
        id: q.id || new ObjectId().toHexString(), 
        marks: q.marks,
        negativeMarks: q.negativeMarks === undefined ? 0 : q.negativeMarks,
        options: q.options.map(opt => ({
          ...opt,
          id: opt.id || new ObjectId().toHexString(), 
        })),
      })),
      updatedAt: new Date(),
    };
    
    const { _id, ...updateData } = quizToUpdate as any;


    const result = await quizzesCollection.updateOne(
      { _id: new ObjectId(quizId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Quiz not found for update.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quiz updated successfully', quizId }, { status: 200 });

  } catch (error) {
    console.error('Failed to update quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to update quiz', error: errorMessage }, { status: 500 });
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
