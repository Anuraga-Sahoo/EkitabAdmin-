
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizFormData, Question as QuestionType, Option as OptionType, Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QuestionEditor } from './QuestionEditor';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

let nextQuestionId = 0;
const generateQuestionClientId = () => `client-question-${nextQuestionId++}`;
const generateOptionClientId = () => `client-option-${nextQuestionId++}`; // Separate counter for options if needed

const initialQuestionState: Omit<QuestionType, 'id' | 'options' | 'aiTags'> & { options: Array<Omit<OptionType, 'id' | 'aiTags'>>, aiTags?: string[] } = {
  text: '',
  imageUrl: undefined,
  options: [{ text: '', imageUrl: undefined, isCorrect: false }],
  explanation: '',
  aiTags: [],
};

const NONE_VALUE = "_none_";

interface QuizUploadFormProps {
  initialQuizData?: Quiz | null;
  quizId?: string;
  onSuccessfulSubmit?: () => void;
}

export function QuizUploadForm({ initialQuizData, quizId, onSuccessfulSubmit }: QuizUploadFormProps) {
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState('');
  const [testType, setTestType] = useState<'Previous Year' | 'Mock' | 'Practice Test' | ''>('');
  const [classType, setClassType] = useState<'11th' | '12th' | typeof NONE_VALUE | ''>('');
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology' | typeof NONE_VALUE | ''>('');
  const [chapter, setChapter] = useState('');
  const [tags, setTags] = useState('');
  const [timerMinutes, setTimerMinutes] = useState<string>('');
  const [questions, setQuestions] = useState<(Omit<QuestionType, 'aiTags'> & { clientId: string; aiTags?: string[] })[]>([
    { ...initialQuestionState, id: generateQuestionClientId(), clientId: generateQuestionClientId(), options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const isEditMode = !!initialQuizData && !!quizId;

  useEffect(() => {
    if (isEditMode && initialQuizData) {
      setQuizTitle(initialQuizData.title || '');
      setTestType(initialQuizData.testType || '');
      setClassType(initialQuizData.classType || NONE_VALUE);
      setSubject(initialQuizData.subject || NONE_VALUE);
      setChapter(initialQuizData.chapter || '');
      setTags((initialQuizData.tags || []).join(', '));
      setTimerMinutes(initialQuizData.timerMinutes?.toString() || '');
      
      const formQuestions = initialQuizData.questions.map(dbQuestion => ({
        ...dbQuestion,
        id: dbQuestion.id, // Preserve DB ID
        clientId: dbQuestion.id || generateQuestionClientId(), // Use DB ID as clientId for existing, or generate for safety
        aiTags: dbQuestion.aiTags || [],
        options: dbQuestion.options.map(dbOption => ({
          ...dbOption,
          id: dbOption.id, // Preserve DB ID
          aiTags: dbOption.aiTags || [],
        })),
      }));
      setQuestions(formQuestions);
    }
  }, [initialQuizData, isEditMode]);


  const isPracticeTest = testType === 'Practice Test';

  const handleAddQuestion = () => {
    const newQuestionId = generateQuestionClientId();
    setQuestions([...questions, { ...initialQuestionState, id: newQuestionId, clientId: newQuestionId, options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) }]);
  };

  const handleQuestionChange = useCallback((index: number, data: Partial<Omit<QuestionType, 'id'>>) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, ...data, id: q.id } : q)) // Ensure q.id is preserved
    );
  }, []);

  const handleRemoveQuestion = useCallback((index: number) => {
    if (questions.length > 1) {
      setQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
    } else {
      toast({ title: "Cannot remove", description: "A quiz must have at least one question.", variant: "destructive" });
    }
  }, [questions.length, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!quizTitle || !testType) {
      toast({ title: "Missing Fields", description: "Please fill in Quiz Title and Test Type.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    const parsedTimerMinutes = timerMinutes ? parseInt(timerMinutes, 10) : undefined;
    if (timerMinutes && (isNaN(parsedTimerMinutes!) || parsedTimerMinutes! < 0)) {
        toast({ title: "Invalid Timer", description: "Timer must be a non-negative number.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    const finalClassType = classType === NONE_VALUE || classType === '' ? undefined : classType;
    const finalSubject = subject === NONE_VALUE || subject === '' ? undefined : subject;

    // Prepare questions, stripping temporary clientId and ensuring options also strip their temporary clientIds
    // if they were only used for local keying and not representing DB IDs.
    // For edit mode, existing `id` fields from DB should be preserved.
    const questionsForPayload = questions.map(({ clientId, ...qData }) => {
        const { options, ...restOfQData } = qData;
        return {
            ...restOfQData, // This includes the original `id` if it was from the DB
            id: qData.id, // Explicitly carry over the question's DB ID
            options: options.map(opt => {
                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { aiTags, ...restOfOpt } = opt; // Keep original option ID
                return { ...restOfOpt, id: opt.id, aiTags: opt.aiTags || [] }; // Explicitly carry over option's DB ID
            }),
            aiTags: qData.aiTags || []
        };
    });


    const formData: QuizFormData | Omit<Quiz, '_id' | 'createdAt' | 'updatedAt' | 'status'> = {
      title: quizTitle,
      testType: testType as 'Previous Year' | 'Mock' | 'Practice Test',
      classType: finalClassType as '11th' | '12th' | undefined,
      subject: finalSubject as 'Physics' | 'Chemistry' | 'Biology' | undefined,
      chapter: chapter,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      timerMinutes: parsedTimerMinutes,
      questions: questionsForPayload
    };
    
    if (formData.questions.some(q => !q.text || q.options.length === 0 || q.options.every(opt => !opt.text))) {
      toast({ title: "Incomplete Questions", description: "Ensure all questions have text and at least one option with text.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }
    if (formData.questions.some(q => !q.options.some(opt => opt.isCorrect))) {
       toast({ title: "No Correct Answer", description: "Each question must have at least one correct answer selected.", variant: "destructive"});
       setIsSubmitting(false);
      return;
    }

    const endpoint = isEditMode ? `/api/quizzes/${quizId}` : '/api/quizzes';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        if (isEditMode) {
            if(onSuccessfulSubmit) {
                onSuccessfulSubmit();
            } else {
                 toast({
                    title: 'Quiz Updated!',
                    description: `Quiz "${(formData as Quiz).title}" has been successfully updated.`,
                });
                router.push('/quizzes');
            }
        } else {
            toast({
                title: 'Quiz Saved!',
                description: `Quiz "${formData.title}" has been successfully saved.`,
            });
            setQuizTitle('');
            setTestType('');
            setClassType(NONE_VALUE);
            setSubject(NONE_VALUE);
            setChapter('');
            setTags('');
            setTimerMinutes(''); 
            const newQId = generateQuestionClientId();
            setQuestions([{ ...initialQuestionState, id: newQId, clientId: newQId, options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) }]);
        }
      } else {
        toast({
          title: isEditMode ? 'Error Updating Quiz' : 'Error Saving Quiz',
          description: result.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Error',
        description: 'Could not connect to the server. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</CardTitle>
          <CardDescription>{isEditMode ? `Editing quiz: ${initialQuizData?.title}` : 'Fill in the details below to create a new quiz.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quizTitle" className="font-semibold">Quiz Title</Label>
              <Input id="quizTitle" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="e.g., Physics Mock Test 1" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType" className="font-semibold">Test Type</Label>
              <Select
                value={testType}
                onValueChange={(value) => setTestType(value as 'Previous Year' | 'Mock' | 'Practice Test' | '')}
                required
              >
                <SelectTrigger id="testType"><SelectValue placeholder="Select test type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Previous Year">Previous Year Test</SelectItem>
                  <SelectItem value="Mock">Mock Test</SelectItem>
                  <SelectItem value="Practice Test">Practice Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPracticeTest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
              <div className="space-y-2">
                <Label htmlFor="classType" className="font-semibold">Class</Label>
                <Select value={classType} onValueChange={(value) => setClassType(value as '11th' | '12th' | typeof NONE_VALUE | '')}>
                  <SelectTrigger id="classType"><SelectValue placeholder="Select class (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    <SelectItem value="11th">Class 11th</SelectItem>
                    <SelectItem value="12th">Class 12th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Subject</Label>
                <Select value={subject} onValueChange={(value) => setSubject(value as 'Physics' | 'Chemistry' | 'Biology' | typeof NONE_VALUE | '')}>
                  <SelectTrigger id="subject"><SelectValue placeholder="Select subject (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter" className="font-semibold">Chapter</Label>
                <Input id="chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g., Thermodynamics (optional)" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2">
              <Label htmlFor="tags" className="font-semibold">Tags (comma-separated)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., important, neet, jee (optional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timerMinutes" className="font-semibold">Timer (minutes)</Label>
              <Input
                id="timerMinutes"
                type="number"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                placeholder="e.g., 60 (optional)"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Questions</CardTitle>
          <CardDescription>Add and configure questions for this quiz.</CardDescription>
        </CardHeader>
        <CardContent>
          {questions.map((q, index) => (
            <QuestionEditor
              key={q.clientId} // Use clientId for React key, as DB id might not be unique if a question is duplicated before saving
              questionIndex={index}
              questionData={q} // Pass the whole question object, which includes DB `id` if present
              onQuestionChange={handleQuestionChange}
              onRemoveQuestion={handleRemoveQuestion}
            />
          ))}
          <Button type="button" variant="outline" onClick={handleAddQuestion} className="mt-4 w-full md:w-auto" disabled={isSubmitting}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add Question
          </Button>
        </CardContent>
      </Card>

      <CardFooter className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
          <Eye className="mr-2 h-5 w-5" /> Preview Quiz (Not Implemented)
        </Button>
        <Button type="submit" size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {isEditMode ? 'Update Quiz' : 'Save Quiz'}
        </Button>
      </CardFooter>
    </form>
  );
}
