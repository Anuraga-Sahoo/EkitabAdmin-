
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListFilter, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import type { Quiz } from '@/lib/types';

export default function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchQuizzes() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/quizzes');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch quizzes: ${response.statusText}`);
        }
        const data: Quiz[] = await response.json();
        setQuizzes(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          toast({ title: "Error", description: err.message, variant: "destructive" });
        } else {
          setError("An unknown error occurred");
          toast({ title: "Error", description: "An unknown error occurred while fetching quizzes.", variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuizzes();
  }, [toast]);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/quizzes/${quizToDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete quiz');
      }
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q._id !== quizToDelete._id));
      toast({ title: "Success", description: `Quiz "${quizToDelete.title}" deleted successfully.` });
    } catch (err) {
      if (err instanceof Error) {
        toast({ title: "Error deleting quiz", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Error deleting quiz", description: "An unknown error occurred.", variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
      setQuizToDelete(null);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.testType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Quiz['status']) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
      case 'Draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
      case 'Private': return 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Manage Quizzes</h1>
        <Link href="/quizzes/upload" passHref>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Quiz
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Quiz List</CardTitle>
          <CardDescription>View, edit, and manage all your quizzes.</CardDescription>
          <div className="flex flex-col md:flex-row items-center gap-2 pt-4">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quizzes..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="ml-auto flex h-8 gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Filter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading quizzes...</p>
            </div>
          )}
          {!isLoading && error && (
            <div className="text-center py-10 text-destructive">
              <p>Error: {error}</p>
              <p>Please try refreshing the page.</p>
            </div>
          )}
          {!isLoading && !error && filteredQuizzes.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
              <p>{quizzes.length === 0 ? "No quizzes found. Create one to get started!" : "No quizzes match your search."}</p>
            </div>
          )}
          {!isLoading && !error && filteredQuizzes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz._id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.testType}</TableCell>
                    <TableCell>{quiz.subject || 'N/A'}</TableCell>
                    <TableCell className="text-center">{quiz.questions.length}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                        {quiz.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Link href={`/quizzes/edit/${quiz._id}`} passHref>
                        <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setQuizToDelete(quiz)}>
                         <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {quizToDelete && (
        <AlertDialog open={!!quizToDelete} onOpenChange={() => setQuizToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the quiz titled 
                <span className="font-semibold"> "{quizToDelete.title}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setQuizToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuiz} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
