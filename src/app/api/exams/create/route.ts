
// src/app/api/exams/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Basic sanitization for collection names
// MongoDB collection names cannot contain '$', be an empty string,
// or be the system.profile collection. Also, names should not contain null character.
// More restrictive: alphanumeric and underscores only.
function sanitizeCollectionName(name: string): string {
  let sanitized = name.trim();
  // Replace spaces and common problematic characters with underscores
  sanitized = sanitized.replace(/[\s.$]/g, '_');
  // Remove any remaining characters not suitable for collection names (alphanumeric or underscore)
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
  return sanitized;
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { examName } = body;

    if (!examName || typeof examName !== 'string' || examName.trim() === '') {
      return NextResponse.json({ message: 'Exam name is required and must be a non-empty string.' }, { status: 400 });
    }
    
    const originalName = examName;
    examName = sanitizeCollectionName(examName);

    if (!examName) {
        return NextResponse.json({ message: `The provided exam name "${originalName}" resulted in an invalid collection name after sanitization. Please use alphanumeric characters and underscores.` }, { status: 400 });
    }
    
    // Further check if sanitized name is empty (e.g. if original was only '$')
    if (examName.length === 0) {
         return NextResponse.json({ message: `The provided exam name "${originalName}" is invalid for a collection name. Please use alphanumeric characters. ` }, { status: 400 });
    }


    const { db } = await connectToDatabase();

    // Check if collection already exists
    const collections = await db.listCollections({ name: examName }).toArray();
    if (collections.length > 0) {
      return NextResponse.json({ message: `An exam (collection) named "${examName}" already exists. Please choose a different name.` }, { status: 409 }); // 409 Conflict
    }

    await db.createCollection(examName);

    return NextResponse.json({ message: `Exam collection "${examName}" created successfully.`, collectionName: examName }, { status: 201 });

  } catch (error) {
    console.error('Failed to create exam collection:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create exam collection', error: errorMessage }, { status: 500 });
  }
}
