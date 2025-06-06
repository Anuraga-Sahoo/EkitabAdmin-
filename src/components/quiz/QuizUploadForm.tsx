
'use client';

import { useState, useEffect } from 'react';
import type { QuizFormData, Question as QuestionType, Option as OptionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QuestionEditor } from './QuestionEditor';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Helper to generate unique IDs for questions client-side
let nextQuestionId = 0;
const generateQuestionClientId = () => `client-question-${nextQuestionId++}`;

const initialQuestionState: Omit<QuestionType, 'id' | 'options'> & { options: Array<Omit<OptionType, 'id'>> } = {
  text: '',
  imageUrl: undefined,
  aiTags: [],
  options: [{ text: '', imageUrl: undefined, isCorrect: false, aiTags: [] }],
  explanation: '',
};

export function QuizUploadForm() {
  const [quizTitle, setQuizTitle] = useState('');
  const [testType, setTestType] = useState<'Previous Year' | 'Mock' | 'Practice Test' | ''>('');
  const [classType, setClassType] = useState<'11th' | '12th' | ''>('');
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology' | ''>('');
  const [chapter, setChapter] = useState('');
  const [tags, setTags] = useState('');
  const [questions, setQuestions] = useState<(typeof initialQuestionState & { clientId: string })[]>([{ ...initialQuestionState, clientId: generateQuestionClientId() }]);

  const { toast } = useToast();

  const isPracticeTest = testType === 'Practice Test';

  const handleAddQuestion = () => {
    setQuestions([...questions, { ...initialQuestionState, clientId: generateQuestionClientId() }]);
  };

  const handleQuestionChange = (index: number, data: Partial<Omit<QuestionType, 'id'>>) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, ...data } : q))
    );
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast({ title: "Cannot remove", description: "A quiz must have at least one question.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizTitle || !testType) { // Check state variable `testType` which can be ''
      toast({ title: "Missing Fields", description: "Please fill in Quiz Title and Test Type.", variant: "destructive"});
      return;
    }

    const formData: QuizFormData = {
      title: quizTitle,
      testType: testType, // `testType` is now guaranteed to be one of the valid enum values due to the check above
      classType: classType ? classType : undefined, // Convert '' to undefined
      subject: subject ? subject : undefined,     // Convert '' to undefined
      chapter: chapter,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      questions: questions.map(({clientId, ...qData}) => qData) // Strip client ID
    };

    // Basic validation
    if (formData.questions.some(q => !q.text || q.options.length === 0 || q.options.every(opt => !opt.text))) {
      toast({ title: "Incomplete Questions", description: "Ensure all questions have text and at least one option with text.", variant: "destructive"});
      return;
    }
    if (formData.questions.some(q => !q.options.some(opt => opt.isCorrect))) {
       toast({ title: "No Correct Answer", description: "Each question must have at least one correct answer selected.", variant: "destructive"});
      return;
    }


    console.log('Quiz Data to Submit:', formData);
    // Here you would typically send the data to your backend API
    // e.g., await fetch('/api/quizzes', { method: 'POST', body: JSON.stringify(formData) });
    toast({
      title: 'Quiz Submitted (Simulated)',
      description: 'Quiz data has been prepared. Check console for output.',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Quiz</CardTitle>
          <CardDescription>Fill in the details below to create a new quiz.</CardDescription>
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
                onValueChange={(value) => setTestType(value as 'Previous Year' | 'Mock' | 'Practice Test')} 
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
                <Select value={classType} onValueChange={(value) => setClassType(value as '11th' | '12th')}>
                  <SelectTrigger id="classType"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11th">Class 11th</SelectItem>
                    <SelectItem value="12th">Class 12th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Subject</Label>
                <Select value={subject} onValueChange={(value) => setSubject(value as 'Physics' | 'Chemistry' | 'Biology')}>
                  <SelectTrigger id="subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter" className="font-semibold">Chapter</Label>
                <Input id="chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g., Thermodynamics" />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t mt-4">
            <Label htmlFor="tags" className="font-semibold">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., important, neet, jee" />
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
              key={q.clientId}
              questionIndex={index}
              questionData={q}
              onQuestionChange={handleQuestionChange}
              onRemoveQuestion={handleRemoveQuestion}
            />
          ))}
          <Button type="button" variant="outline" onClick={handleAddQuestion} className="mt-4 w-full md:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Question
          </Button>
        </CardContent>
      </Card>


      <CardFooter className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" className="w-full md:w-auto">
          <Eye className="mr-2 h-5 w-5" /> Preview Quiz (Not Implemented)
        </Button>
        <Button type="submit" size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-5 w-5" /> Save Quiz
        </Button>
      </CardFooter>
    </form>
  );
}
