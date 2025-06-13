
// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NotificationItem } from '@/lib/types';

export async function GET() {
  try {
    const { notificationsCollection } = await connectToDatabase();
    const notificationsFromDb = await notificationsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const notifications: NotificationItem[] = notificationsFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return {
        _id: _id.toHexString(),
        title: rest.title,
        contentHTML: rest.contentHTML,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      } as NotificationItem;
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
