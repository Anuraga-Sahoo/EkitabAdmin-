
// src/app/api/chapters/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { ChapterItem } from '@/lib/types';

export async function GET() {
  try {
    const { chaptersCollection } = await connectToDatabase();
    const chaptersFromDb = await chaptersCollection.find({}).sort({ name: 1 }).toArray();

    const chapters: ChapterItem[] = chaptersFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return {
        _id: _id.toHexString(),
        name: rest.name,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      } as ChapterItem;
    });

    return NextResponse.json(chapters, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch chapters', error: errorMessage }, { status: 500 });
  }
}
