
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListFilter, Search, Edit, Trash2, Loader2, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, QuizStatus } from '@/lib/types';

export default function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});


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

  const handleStatusChange = async (quizId: string, newStatus: QuizStatus) => {
    setIsUpdatingStatus(prev => ({ ...prev, [quizId]: true }));
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quiz status');
      }

      setQuizzes(prevQuizzes =>
        prevQuizzes.map(q => (q._id === quizId ? { ...q, status: newStatus, updatedAt: new Date() } : q))
      );
      toast({ title: "Success", description: `Quiz status updated to "${newStatus}".` });
    } catch (err) {
      if (err instanceof Error) {
        toast({ title: "Error updating status", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Error updating status", description: "An unknown error occurred.", variant: "destructive" });
      }
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [quizId]: false }));
    }
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.testType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status: QuizStatus) => {
    switch (status) {
      case 'Published': return 'border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50';
      case 'Draft': return 'border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/50';
      case 'Private': return 'border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/50';
      default: return 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50';
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`w-[120px] justify-between capitalize ${getStatusClass(quiz.status)} ${isUpdatingStatus[quiz._id] ? 'opacity-70 cursor-not-allowed' : ''}`} 
                            disabled={isUpdatingStatus[quiz._id]}
                          >
                            {isUpdatingStatus[quiz._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : quiz.status}
                            {!isUpdatingStatus[quiz._id] && <ChevronDown className="ml-1 h-4 w-4 opacity-60" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[120px]">
                          {(['Published', 'Draft', 'Private'] as QuizStatus[]).map((statusOption) => (
                            <DropdownMenuItem
                              key={statusOption}
                              disabled={quiz.status === statusOption || isUpdatingStatus[quiz._id]}
                              onClick={() => handleStatusChange(quiz._id, statusOption)}
                              className="capitalize"
                            >
                              {statusOption}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
