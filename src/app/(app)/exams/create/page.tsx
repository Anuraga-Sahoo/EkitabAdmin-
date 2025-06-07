
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export default function CreateExamPage() {
  const [examName, setExamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      toast({
        title: "Exam Name Required",
        description: "Please enter a name for the exam.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/exams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examName: examName.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Exam Created",
          description: `Exam "${examName.trim()}" added successfully.`,
        });
        setExamName(''); // Clear input after success
      } else {
        toast({
          title: "Error Creating Exam",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
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
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Create New Exam</h1>
      <Card className="shadow-lg max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Exam Details</CardTitle>
            <CardDescription>
              Enter a name for your new exam. This exam will be added to the list of available exams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examName" className="font-semibold">Exam Name</Label>
              <Input
                id="examName"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., Final Chemistry Exam, NEET Full Syllabus Test 3"
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a clear and descriptive name for the exam.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Save Exam
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
