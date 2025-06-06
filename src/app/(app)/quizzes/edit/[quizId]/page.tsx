
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizUploadForm } from '@/components/quiz/QuizUploadForm';
import type { Quiz } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [initialQuizData, setInitialQuizData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (quizId) {
      const fetchQuizData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/quizzes/${quizId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch quiz data: ${response.statusText}`);
          }
          const data: Quiz = await response.json();
          setInitialQuizData(data);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
            toast({ title: "Error", description: `Failed to load quiz: ${err.message}`, variant: "destructive" });
          } else {
            setError("An unknown error occurred");
             toast({ title: "Error", description: "An unknown error occurred while fetching quiz data.", variant: "destructive" });
          }
          // Optionally redirect if quiz not found or critical error
          // router.push('/quizzes'); 
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuizData();
    }
  }, [quizId, toast, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading quiz data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive font-headline">Error Loading Quiz</CardTitle>
          <CardDescription>There was a problem fetching the quiz data for editing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-4 rounded-md">{error}</p>
          <Button onClick={() => router.push('/quizzes')} className="mt-4">Back to Quizzes</Button>
        </CardContent>
      </Card>
    );
  }

  if (!initialQuizData) {
    // This case should ideally be handled by error state, but as a fallback:
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Quiz data not found.</p>
         <Button onClick={() => router.push('/quizzes')} className="mt-4">Back to Quizzes</Button>
      </div>
    );
  }
  
  const handleSuccessfulUpdate = () => {
    toast({
      title: 'Quiz Updated!',
      description: `Quiz "${initialQuizData.title}" has been successfully updated.`,
    });
    router.push('/quizzes');
  };


  return (
    <div className="container mx-auto py-8">
      <QuizUploadForm 
        initialQuizData={initialQuizData} 
        quizId={quizId}
        onSuccessfulSubmit={handleSuccessfulUpdate}
      />
    </div>
  );
}
