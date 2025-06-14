
// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NotificationItem } from '@/lib/types';

export async function GET() {
  try {
    const { notificationsCollection } = await connectToDatabase();
    const notificationsFromDb = await notificationsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const notifications: NotificationItem[] = notificationsFromDb.map(doc => {
      return {
        _id: doc._id.toHexString(),
        title: doc.title,
        contentHTML: doc.contentHTML,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        userIds: doc.userIds || [], 
        isRead: doc.isRead || [], 
      };
    });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to fetch notifications', error: errorMessage }, { status: 500 });
  }
}
