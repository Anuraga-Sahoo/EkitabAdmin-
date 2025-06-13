
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TiptapEditor from '@/components/editor/TiptapEditor';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, FileText, Edit, Trash2, Eye, XCircle, PlusCircle, Ban, Save } from "lucide-react";
import type { NotificationItem } from '@/lib/types';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';

export default function ManageNotificationsPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);
  const [notificationToPreview, setNotificationToPreview] = useState<NotificationItem | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!editingNotificationId;

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch notifications');
      }
      const data: NotificationItem[] = await response.json();
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setFetchError(errorMessage);
      toast({ title: "Error Fetching Notifications", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingNotificationId(null);
  };
  
  const handleEditClick = async (notification: NotificationItem) => {
    setEditingNotificationId(notification._id);
    setTitle(notification.title);
    setContent(notification.contentHTML);
    // Scroll to top or to the form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      toast({ title: "Content Required", description: "Please enter some content.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const payload = { title: title.trim(), contentHTML: content };
    const endpoint = isEditMode ? `/api/notifications/${editingNotificationId}` : '/api/notifications/create';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        toast({
          title: isEditMode ? "Notification Updated" : "Notification Created",
          description: `Notification "${result.title || payload.title}" ${isEditMode ? 'updated' : 'saved'} successfully.`,
        });
        resetForm();
        fetchNotifications();
      } else {
        toast({
          title: isEditMode ? "Error Updating" : "Error Creating",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} notification:`, error);
      toast({ title: "Network Error", description: "Could not connect to server.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notifications/${notificationToDelete._id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notification');
      }
      toast({ title: "Notification Deleted", description: `Notification "${notificationToDelete.title}" deleted.` });
      fetchNotifications();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Delete Failed", description: (error instanceof Error ? error.message : "Unknown error"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setNotificationToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              {isEditMode ? <Edit className="mr-2 h-6 w-6" /> : <PlusCircle className="mr-2 h-6 w-6" />}
              {isEditMode ? 'Edit Notification' : 'Create New Notification'}
            </CardTitle>
            <CardDescription>
              {isEditMode ? `Editing: "${notifications.find(n => n._id === editingNotificationId)?.title || ''}"` : 'Compose and save a new notification.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notificationTitle" className="font-semibold">Notification Title</Label>
              <Input
                id="notificationTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., System Maintenance Alert"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Notification Content</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isEditMode ? <Save className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />)}
              {isEditMode ? 'Update Notification' : 'Create Notification'}
            </Button>
            {isEditMode && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                <Ban className="mr-2 h-5 w-5" /> Cancel Edit
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Existing Notifications</CardTitle>
          <CardDescription>View, preview, edit, or delete previously created notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading notifications...</p>
            </div>
          )}
          {!isLoadingNotifications && fetchError && (
            <div className="text-center py-10 text-destructive">
              <p>Error: {fetchError}</p>
            </div>
          )}
          {!isLoadingNotifications && !fetchError && notifications.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No notifications found. Create one above!</p>
          )}
          {!isLoadingNotifications && !fetchError && notifications.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                    <TableCell>{format(new Date(item.createdAt), 'PPp')}</TableCell>
                    <TableCell>{item.updatedAt ? format(new Date(item.updatedAt), 'PPp') : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setNotificationToPreview(item)} aria-label="Preview notification">
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} aria-label="Edit notification" className="hover:bg-accent/50">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setNotificationToDelete(item)} aria-label="Delete notification" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {notificationToPreview && (
        <AlertDialog open={!!notificationToPreview} onOpenChange={() => setNotificationToPreview(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-headline">{notificationToPreview.title}</AlertDialogTitle>
              <AlertDialogDescription>
                Preview of the notification content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto p-4 border rounded-md bg-background">
              <div dangerouslySetInnerHTML={{ __html: notificationToPreview.contentHTML }} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNotificationToPreview(null)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {notificationToDelete && (
        <AlertDialog open={!!notificationToDelete} onOpenChange={() => setNotificationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the notification titled <span className="font-semibold">"{notificationToDelete.title}"</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNotificationToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

