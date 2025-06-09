
// src/app/api/chapters/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { ChapterItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Chapter name is required and must be a non-empty string.' }, { status: 400 });
    }
    
    name = name.trim().toUpperCase();
    
    const { chaptersCollection } = await connectToDatabase();

    const existingChapter = await chaptersCollection.findOne({ name: name });
    if (existingChapter) {
      return NextResponse.json({ message: `A chapter named "${name}" already exists.` }, { status: 409 });
    }

    const newChapterItem: Omit<ChapterItem, '_id' | 'updatedAt'> = {
      name: name,
      createdAt: new Date(),
    };

    const result = await chaptersCollection.insertOne(newChapterItem);

    if (result.insertedId) {
        return NextResponse.json({ message: `Chapter "${name}" created successfully.`, chapterId: result.insertedId, name: name }, { status: 201 });
    } else {
        return NextResponse.json({ message: 'Failed to create chapter entry.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create chapter:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create chapter', error: errorMessage }, { status: 500 });
  }
}
