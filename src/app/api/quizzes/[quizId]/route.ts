// src/app/api/quizzes/[quizId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { QuizStatus, Quiz, QuizFormData, Question, Section, Exam } from '@/lib/types';
import { uploadOnCloudinary } from '@/lib/cloudinary';

// Helper to check if a string is a data URI
const isDataURI = (uri: string) => uri.startsWith('data:image');

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
    sections: finalSections,
  } as Omit<Quiz, '_id'>; 
}


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
    
    const adaptedQuizData = adaptQuizToSectionsFormat(quizDoc);

    const quiz: Quiz = {
      _id: quizDoc._id.toHexString(),
      title: quizDoc.title, 
      testType: quizDoc.testType,
      classId: quizDoc.classId,
      subjectId: quizDoc.subjectId,
      chapterId: quizDoc.chapterId,
      associatedExamId: quizDoc.associatedExamId,
      associatedExamName: quizDoc.associatedExamName,
      tags: quizDoc.tags,
      timerMinutes: quizDoc.timerMinutes,
      sections: adaptedQuizData.sections,
      status: quizDoc.status,
      createdAt: quizDoc.createdAt,
      updatedAt: quizDoc.updatedAt,
    };

    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
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

    const { quizzesCollection, examsCollection } = await connectToDatabase();
    
    // Fetch current quiz to compare associatedExamId
    const currentQuizDoc = await quizzesCollection.findOne({ _id: new ObjectId(quizId) });
    if (!currentQuizDoc) {
      return NextResponse.json({ message: 'Quiz not found for update.' }, { status: 404 });
    }
    const currentAssociatedExamId = currentQuizDoc.associatedExamId;


    // Handle simple status update
    if (body.status && Object.keys(body).length === 1) {
      const { status } = body as { status: QuizStatus };
      if (!['Published', 'Draft', 'Private'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status. Must be Published, Draft, or Private.' }, { status: 400 });
      }
      const result = await quizzesCollection.updateOne(
        { _id: new ObjectId(quizId) },
        { $set: { status: status, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
      if (result.modifiedCount === 0) return NextResponse.json({ message: 'Quiz status already up to date.', quizId }, { status: 200 });
      return NextResponse.json({ message: 'Quiz status updated successfully', quizId }, { status: 200 });
    }

    // Handle full quiz update
    const quizData = body as Omit<QuizFormData, 'questions'> & { sections: Array<Omit<Section, 'questions'> & { questions: Array<Omit<Question, 'options'> & { options: Array<OptionType> }> }> };

    // Process image uploads
    for (const section of quizData.sections) {
      for (const question of section.questions) {
        if (question.imageUrl && isDataURI(question.imageUrl)) {
          const uploadResult = await uploadOnCloudinary(question.imageUrl);
          if (uploadResult?.secure_url) {
            question.imageUrl = uploadResult.secure_url;
          } else {
             throw new Error(`Failed to upload image for question: ${question.text.substring(0, 20)}...`);
          }
        }
        for (const option of question.options) {
          if (option.imageUrl && isDataURI(option.imageUrl)) {
             const uploadResult = await uploadOnCloudinary(option.imageUrl);
             if (uploadResult?.secure_url) {
                option.imageUrl = uploadResult.secure_url;
             } else {
                throw new Error(`Failed to upload image for an option in question: ${question.text.substring(0, 20)}...`);
             }
          }
        }
      }
    }


    if (!quizData.title || !quizData.testType || !quizData.sections || quizData.sections.length === 0) {
      return NextResponse.json({ message: 'Invalid quiz data for update. Title, Test Type, and Sections are required.' }, { status: 400 });
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
        id: section.id || new ObjectId().toHexString(), 
        questions: section.questions.map(q => {
          if (q.marks === undefined || typeof q.marks !== 'number' || q.marks <= 0) {
            throw new Error(`Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" must have positive marks.`);
          }
          if (q.negativeMarks !== undefined && (typeof q.negativeMarks !== 'number' || q.negativeMarks < 0)) {
            throw new Error(`Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" negative marks must be non-negative.`);
          }
          return {
            ...q,
            id: q.id || new ObjectId().toHexString(), 
            marks: q.marks,
            negativeMarks: q.negativeMarks === undefined ? 0 : q.negativeMarks,
            options: q.options.map(opt => ({
              ...opt,
              id: opt.id || new ObjectId().toHexString(), 
            })),
          };
        }),
      };
    });


    const quizToUpdatePayload = {
      ...quizData,
      sections: processedSections,
      updatedAt: new Date(),
    };
    
    // Remove _id if it exists in quizData to prevent trying to update it.
    const { _id, ...updateData } = quizToUpdatePayload as any; 

    const result = await quizzesCollection.updateOne(
      { _id: new ObjectId(quizId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Quiz not found for update.' }, { status: 404 });
    }
    
    // Handle exam association changes
    const newAssociatedExamId = quizData.associatedExamId;

    if (currentAssociatedExamId !== newAssociatedExamId) {
      // Remove from old exam if it existed
      if (currentAssociatedExamId && ObjectId.isValid(currentAssociatedExamId)) {
        await examsCollection.updateOne(
          { _id: new ObjectId(currentAssociatedExamId) },
          { $pull: { quizIds: quizId } }
        );
      }
      // Add to new exam if it exists
      if (newAssociatedExamId && ObjectId.isValid(newAssociatedExamId)) {
        await examsCollection.updateOne(
          { _id: new ObjectId(newAssociatedExamId) },
          { $addToSet: { quizIds: quizId } }
        );
      }
    }


    return NextResponse.json({ message: 'Quiz updated successfully', quizId }, { status: 200 });

  } catch (error) {
    console.error('Failed to update quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
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

    const { quizzesCollection, examsCollection } = await connectToDatabase();
    
    // Before deleting quiz, remove its ID from any associated exam
    const quizDoc = await quizzesCollection.findOne({ _id: new ObjectId(quizId) });
    if (quizDoc && quizDoc.associatedExamId && ObjectId.isValid(quizDoc.associatedExamId)) {
        await examsCollection.updateOne(
            { _id: new ObjectId(quizDoc.associatedExamId) },
            { $pull: { quizIds: quizId } }
        );
    }
    // Note: Similar logic could be added for chapters, classes, subjects if quizIds are stored there and need cleanup.

    const result = await quizzesCollection.deleteOne({ _id: new ObjectId(quizId) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Quiz deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Quiz not found or already deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ message: 'Failed to delete quiz', error: errorMessage }, { status: 500 });
  }
}