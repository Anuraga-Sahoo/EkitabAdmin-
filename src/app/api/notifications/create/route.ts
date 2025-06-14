
// src/app/api/notifications/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NotificationItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, contentHTML } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'Notification title is required and must be a non-empty string.' }, { status: 400 });
    }
    if (!contentHTML || typeof contentHTML !== 'string' || contentHTML.trim() === '' || contentHTML.trim() === '<p></p>') {
      return NextResponse.json({ message: 'Notification content is required and cannot be empty.' }, { status: 400 });
    }
    
    const { notificationsCollection, usersCollection } = await connectToDatabase();

    // Fetch all users to get their IDs
    const allUsers = await usersCollection.find({}, { projection: { _id: 1 } }).toArray();
    const userIds = allUsers.map(user => user._id.toHexString());
    const isReadStatus = userIds.map(uid => ({ userId: uid, read: false }));

    const newNotification: Omit<NotificationItem, '_id' | 'updatedAt'> = {
      title: title.trim(),
      contentHTML: contentHTML, // Store HTML directly
      createdAt: new Date(),
      userIds: userIds,
      isRead: isReadStatus,
    };

    const result = await notificationsCollection.insertOne(newNotification as any); // Cast as any because Omit doesn't perfectly match what MongoDB expects for insertOne

    if (result.insertedId) {
        return NextResponse.json({ 
            message: `Notification "${newNotification.title}" created successfully.`, 
            notificationId: result.insertedId,
            title: newNotification.title 
        }, { status: 201 });
    } else {
        return NextResponse.json({ message: 'Failed to create notification entry.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create notification:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create notification', error: errorMessage }, { status: 500 });
  }
}
