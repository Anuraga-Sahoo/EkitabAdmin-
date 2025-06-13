
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import TiptapEditor from '@/components/editor/TiptapEditor';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, FileText } from "lucide-react";

export default function CreateNotificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the notification.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!content.trim() || content === '<p></p>') { // Tiptap default empty state
      toast({
        title: "Content Required",
        description: "Please enter some content for the notification.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), contentHTML: content }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Notification Created",
          description: `Notification "${result.title}" saved successfully.`,
        });
        setTitle('');
        setContent('');
        // Optionally, redirect to a notifications list page if one exists
        // router.push('/notifications'); 
      } else {
        toast({
          title: "Error Creating Notification",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center">
        <FileText className="mr-3 h-8 w-8" /> Create New Notification
      </h1>
      
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Compose Notification</CardTitle>
            <CardDescription>Enter the title and content for your new notification.</CardDescription>
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
              <Label htmlFor="notificationContent" className="font-semibold">Notification Content</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Create Notification
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
