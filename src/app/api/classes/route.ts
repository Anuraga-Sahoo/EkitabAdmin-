
// src/app/api/classes/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { ClassItem } from '@/lib/types';

export async function GET() {
  try {
    const { classesCollection } = await connectToDatabase();
    const classesFromDb = await classesCollection.find({}).sort({ name: 1 }).toArray();

    const classes: ClassItem[] = classesFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return {
        _id: _id.toHexString(),
        name: rest.name,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      } as ClassItem;
    });

    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch classes', error: errorMessage }, { status: 500 });
  }
}
