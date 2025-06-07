
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit, Trash2, XCircle } from "lucide-react";
import type { Exam } from '@/lib/types';
import { format } from 'date-fns';

export default function ManageExamsPage() {
  const [newExamName, setNewExamName] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [currentEditName, setCurrentEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [examToDeleteId, setExamToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const fetchExams = async () => {
    setIsLoadingExams(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/exams');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch exams');
      }
      const data: Exam[] = await response.json();
      setExams(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setFetchError(errorMessage);
      toast({ title: "Error Fetching Exams", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [toast]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) {
      toast({
        title: "Exam Name Required",
        description: "Please enter a name for the new exam.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingNew(true);
    try {
      const response = await fetch('/api/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName: newExamName.trim() }),
      });
      const result = await response.json();

      if (response.ok) {
        toast({ title: "Exam Created", description: `Exam "${result.examName || newExamName.trim().toUpperCase()}" added successfully.` });
        setNewExamName('');
        fetchExams(); // Refresh the list
      } else {
        toast({ title: "Error Creating Exam", description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleEditClick = (exam: Exam) => {
    setEditingExamId(exam._id);
    setCurrentEditName(exam.name);
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setCurrentEditName('');
  };

  const handleUpdateSubmit = async (examId: string) => {
    if (!currentEditName.trim()) {
      toast({ title: "Exam Name Required", description: "Exam name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentEditName.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Exam Updated", description: `Exam updated to "${result.newName}".` });
        setEditingExamId(null);
        setCurrentEditName('');
        fetchExams(); // Refresh list
      } else {
        toast({ title: "Error Updating Exam", description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update exam:", error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (examId: string) => {
    setExamToDeleteId(examId);
  };

  const handleConfirmDelete = async () => {
    if (!examToDeleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/exams/${examToDeleteId}`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Exam Deleted", description: result.message });
        fetchExams(); // Refresh list
      } else {
        toast({ title: "Error Deleting Exam", description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to delete exam:", error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setExamToDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Create & Manage Exams</h1>
      
      <Card className="shadow-lg max-w-2xl">
        <form onSubmit={handleCreateSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Create New Exam</CardTitle>
            <CardDescription>Enter a name for your new exam. It will be saved in uppercase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newExamName" className="font-semibold">New Exam Name</Label>
              <Input
                id="newExamName"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                placeholder="e.g., NEET Full Syllabus Test 3"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmittingNew} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmittingNew ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save New Exam
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Existing Exams</CardTitle>
          <CardDescription>View, edit, or delete existing exams.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExams && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading exams...</p>
            </div>
          )}
          {!isLoadingExams && fetchError && (
            <div className="text-center py-10 text-destructive">
              <p>Error: {fetchError}</p>
              <p>Please try refreshing the page.</p>
            </div>
          )}
          {!isLoadingExams && !fetchError && exams.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No exams found. Create one above to get started!</p>
          )}
          {!isLoadingExams && !fetchError && exams.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell>
                      {editingExamId === exam._id ? (
                        <Input
                          value={currentEditName}
                          onChange={(e) => setCurrentEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        exam.name
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(exam.createdAt), 'PPp')}</TableCell>
                    <TableCell>{exam.updatedAt ? format(new Date(exam.updatedAt), 'PPp') : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {editingExamId === exam._id ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleUpdateSubmit(exam._id)} 
                            disabled={isUpdating}
                            className="hover:bg-green-100 dark:hover:bg-green-800"
                            aria-label="Update exam name"
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600 dark:text-green-400" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleCancelEdit} 
                            disabled={isUpdating}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Cancel edit"
                          >
                            <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditClick(exam)}
                            className="hover:bg-accent/50"
                            aria-label="Edit exam name"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(exam._id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete exam"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {examToDeleteId && (
        <AlertDialog open={!!examToDeleteId} onOpenChange={() => setExamToDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this exam?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the exam named 
                <span className="font-semibold"> "{exams.find(e => e._id === examToDeleteId)?.name}"</span>.
                Associated quizzes will not be deleted but will no longer be linked to this exam.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExamToDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Exam
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
