
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const { usersCollection } = await connectToDatabase();
    const usersFromDb = await usersCollection.find({}).sort({ joinedDate: -1 }).toArray();

    const users: User[] = usersFromDb.map(userDoc => {
      const { _id, ...rest } = userDoc;
      return {
        _id: _id.toHexString(),
        ...rest,
      } as User; 
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch users', error: errorMessage }, { status: 500 });
  }
}
