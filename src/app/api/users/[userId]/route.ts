
// src/app/api/users/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid User ID provided.' }, { status: 400 });
    }

    const { usersCollection } = await connectToDatabase();
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not found or already deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to delete user', error: errorMessage }, { status: 500 });
  }
}
