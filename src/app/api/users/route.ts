
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const { usersCollection } = await connectToDatabase();
    // Assuming user documents in MongoDB have a 'createdAt' field for the join date.
    // Fetch users and sort by 'createdAt' in descending order.
    const usersFromDb = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

    const users: User[] = usersFromDb.map(doc => {
      // Explicitly map fields from the database document to the User type.
      // We are assuming 'doc' from the database has 'createdAt'.
      return {
        _id: doc._id.toHexString(),
        name: doc.name,
        email: doc.email,
        mobileNumber: doc.mobileNumber, // This will be undefined if not in the doc
        joinedDate: doc.createdAt, // Map 'createdAt' from DB to 'joinedDate' for the frontend User type
        lastLogin: doc.lastLogin, // This will be undefined if not in the doc
      };
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
