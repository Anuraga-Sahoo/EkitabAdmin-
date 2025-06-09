
// src/app/api/quizzes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { QuizFormData, Quiz, Question, Section, ChapterItem } from '@/lib/types';
import { ObjectId } from 'mongodb';

// Helper to adapt old quiz structure (direct questions array) to new sections structure
function adaptQuizToSectionsFormat(quizDoc: any): Omit<Quiz, '_id'> {
  const { questions, sections, ...rest } = quizDoc;
  let finalSections: Section[] = [];

  if (sections && Array.isArray(sections) && sections.length > 0) {
    finalSections = sections.map(s => ({
      id: s.id || new ObjectId().toHexString(),
      name: s.name,
      questionLimit: s.questionLimit,
      timerMinutes: s.timerMinutes,
      questions: (s.questions || []).map((q: any) => ({
        ...q,
        id: q.id || new ObjectId().toHexString(),
        marks: q.marks === undefined ? 1 : parseFloat(String(q.marks)),
        negativeMarks: q.negativeMarks === undefined ? 0 : parseFloat(String(q.negativeMarks)),
        options: (q.options || []).map((opt: any) => ({
          ...opt,
          id: opt.id || new ObjectId().toHexString(),
        })),
      })),
    }));
  } else if (questions && Array.isArray(questions) && questions.length > 0) {
    // Old format: wrap questions in a default section
    finalSections = [{
      id: new ObjectId().toHexString(),
      name: 'Main Section', // Default name for adapted section
      questions: questions.map((q: any) => ({
        ...q,
        id: q.id || new ObjectId().toHexString(),
        marks: q.marks === undefined ? 1 : parseFloat(String(q.marks)),
        negativeMarks: q.negativeMarks === undefined ? 0 : parseFloat(String(q.negativeMarks)),
        options: (q.options || []).map((opt: any) => ({
          ...opt,
          id: opt.id || new ObjectId().toHexString(),
        })),
      })),
    }];
  }

  return {
    ...rest,
    classId: rest.classId,
    subjectId: rest.subjectId,
    chapterId: rest.chapterId,
    sections: finalSections,
  } as Omit<Quiz, '_id'>; // Cast needed as 'rest' doesn't know about sections
}


export async function POST(request: NextRequest) {
  try {
    const quizData = (await request.json()) as QuizFormData;

    if (!quizData || !quizData.title || !quizData.testType || !quizData.sections || quizData.sections.length === 0) {
      return NextResponse.json({ message: 'Invalid quiz data provided. Title, Test Type, and at least one Section are required.' }, { status: 400 });
    }
    if (quizData.timerMinutes !== undefined && (typeof quizData.timerMinutes !== 'number' || quizData.timerMinutes < 0)) {
      return NextResponse.json({ message: 'Invalid overall timer value provided.' }, { status: 400 });
    }

    const processedSections = quizData.sections.map(section => {
      if (section.timerMinutes !== undefined && (typeof section.timerMinutes !== 'number' || section.timerMinutes < 0)) {
        throw new Error(`Invalid timer for section "${section.name || 'Unnamed'}". Must be non-negative number.`);
      }
      if (section.questionLimit !== undefined && (typeof section.questionLimit !== 'number' || section.questionLimit < 0)) {
         throw new Error(`Invalid question limit for section "${section.name || 'Unnamed'}". Must be non-negative number.`);
      }
      if (!section.questions || section.questions.length === 0) {
        throw new Error(`Section "${section.name || 'Unnamed'}" must contain at least one question.`);
      }
      return {
        ...section,
        id: section.id || new ObjectId().toHexString(), // Use existing ID or generate new for section
        questions: section.questions.map(q => {
          const marks = q.marks === undefined ? 1 : parseFloat(String(q.marks));
          const negativeMarks = q.negativeMarks === undefined ? 0 : parseFloat(String(q.negativeMarks));

          if (marks <= 0) {
            throw new Error(`Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" must have positive marks.`);
          }
          if (negativeMarks < 0) {
            throw new Error(`Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" negative marks must be non-negative.`);
          }
          return {
            ...q,
            id: q.id || new ObjectId().toHexString(), // Use existing ID or generate new for question
            marks: marks, 
            negativeMarks: negativeMarks, 
            options: q.options.map(opt => ({
              ...opt,
              id: opt.id || new ObjectId().toHexString(), // Use existing ID or generate new for option
            })),
          };
        }),
      };
    });

    const { quizzesCollection, chaptersCollection } = await connectToDatabase();

    const quizToInsert: Omit<Quiz, '_id'> = {
      title: quizData.title,
      testType: quizData.testType,
      classId: quizData.classId,
      subjectId: quizData.subjectId,
      chapterId: quizData.chapterId,
      tags: quizData.tags,
      timerMinutes: quizData.timerMinutes,
      sections: processedSections,
      status: 'Draft', 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await quizzesCollection.insertOne(quizToInsert as any); 

    if (result.insertedId) {
      const newQuizId = result.insertedId.toHexString();

      if (quizData.chapterId && ObjectId.isValid(quizData.chapterId)) {
        try {
          await chaptersCollection.updateOne(
            { _id: new ObjectId(quizData.chapterId) },
            { $addToSet: { quizIds: newQuizId } } 
          );
        } catch (chapterUpdateError) {
          console.error('Failed to update chapter with new quizId:', chapterUpdateError);
        }
      }
      return NextResponse.json({ message: 'Quiz created successfully', quizId: newQuizId }, { status: 201 });
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
      const adaptedQuizData = adaptQuizToSectionsFormat(rest);
      return {
        _id: _id.toHexString(),
        ...adaptedQuizData,
        title: rest.title,
        testType: rest.testType,
        classId: rest.classId, 
        subjectId: rest.subjectId,
        chapterId: rest.chapterId,
        status: rest.status,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
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
