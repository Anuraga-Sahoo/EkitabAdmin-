
// src/app/api/notifications/[notificationId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NotificationItem } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const notificationId = params.notificationId;
    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: 'Invalid Notification ID provided.' }, { status: 400 });
    }

    const { notificationsCollection } = await connectToDatabase();
    const notificationDoc = await notificationsCollection.findOne({ _id: new ObjectId(notificationId) });

    if (!notificationDoc) {
      return NextResponse.json({ message: 'Notification not found.' }, { status: 404 });
    }
    
    const notification: NotificationItem = {
      _id: notificationDoc._id.toHexString(),
      title: notificationDoc.title,
      contentHTML: notificationDoc.contentHTML,
      createdAt: notificationDoc.createdAt,
      updatedAt: notificationDoc.updatedAt,
      userIds: notificationDoc.userIds || [],
      isRead: notificationDoc.isRead || [],
    };

    return NextResponse.json(notification, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch notification:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ message: 'Failed to fetch notification', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const notificationId = params.notificationId;
    const body = await request.json();
    const { title, contentHTML } = body; // Note: userIds and isRead are not updated here intentionally

    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: 'Invalid Notification ID provided.' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'Notification title is required.' }, { status: 400 });
    }
    if (!contentHTML || typeof contentHTML !== 'string' || contentHTML.trim() === '' || contentHTML.trim() === '<p></p>') {
      return NextResponse.json({ message: 'Notification content is required.' }, { status: 400 });
    }

    const { notificationsCollection } = await connectToDatabase();
    
    const updateData: Partial<Pick<NotificationItem, 'title' | 'contentHTML' | 'updatedAt'>> = {
      title: title.trim(),
      contentHTML: contentHTML,
      updatedAt: new Date(),
    };

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Notification not found for update.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification updated successfully', notificationId }, { status: 200 });

  } catch (error) {
    console.error('Failed to update notification:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ message: 'Failed to update notification', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const notificationId = params.notificationId;
    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: 'Invalid Notification ID provided.' }, { status: 400 });
    }

    const { notificationsCollection } = await connectToDatabase();
    const result = await notificationsCollection.deleteOne({ _id: new ObjectId(notificationId) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Notification deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Notification not found or already deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete notification:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ message: 'Failed to delete notification', error: errorMessage }, { status: 500 });
  }
}
