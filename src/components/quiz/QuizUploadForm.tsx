
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizFormData, Question as QuestionType, Option as OptionType, Quiz, Exam, Section as SectionType, ClassItem, SubjectItem, ChapterItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionEditor } from './QuestionEditor';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, Eye, Loader2, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

let nextQuestionSeed = 0;
const generateQuestionClientId = () => `client-question-${nextQuestionSeed++}`;

let nextOptionSeed = 0; 
const generateOptionClientId = () => `client-option-${nextOptionSeed++}`;

let nextSectionSeed = 0;
const generateSectionClientId = () => `client-section-${nextSectionSeed++}`;

const initialOptionState: Omit<OptionType, 'aiTags' | 'id'> & { id: string; aiTags?: string[] } = {
  id: generateOptionClientId(),
  text: '',
  imageUrl: undefined,
  isCorrect: false,
  aiTags: [],
};

const initialQuestionState: Omit<QuestionType, 'id' | 'options' | 'aiTags'> & { clientId: string; options: Array<typeof initialOptionState>, aiTags?: string[] } = {
  clientId: generateQuestionClientId(),
  text: '',
  imageUrl: undefined,
  marks: 1, 
  negativeMarks: 0, 
  options: [{ ...initialOptionState, id: generateOptionClientId() }],
  explanation: '',
  aiTags: [],
};

const initialSectionState: Omit<SectionType, 'id' | 'questions'> & { clientId: string; questions: Array<Omit<QuestionType, 'aiTags'> & { clientId: string; id?: string; aiTags?: string[]; options: Array<typeof initialOptionState> }> } = {
  clientId: generateSectionClientId(),
  name: '',
  questionLimit: undefined,
  timerMinutes: undefined,
  questions: [{ ...initialQuestionState, clientId: generateQuestionClientId(), options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) }],
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
  
  const [classId, setClassId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');

  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [allChapters, setAllChapters] = useState<ChapterItem[]>([]);
  
  const [tags, setTags] = useState('');
  const [overallTimerMinutes, setOverallTimerMinutes] = useState<string>('');
  
  const [sections, setSections] = useState<Array<SectionType & { clientId: string }>>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(NONE_VALUE);

  const [isMounted, setIsMounted] = useState(false);

  const { toast } = useToast();
  const isEditMode = !!initialQuizData && !!quizId;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (isEditMode && initialQuizData) {
      setQuizTitle(initialQuizData.title || '');
      setTestType(initialQuizData.testType || '');
      
      setClassId(initialQuizData.classId || '');
      setSubjectId(initialQuizData.subjectId || '');
      setChapterId(initialQuizData.chapterId || '');
      
      setTags((initialQuizData.tags || []).join(', '));
      setOverallTimerMinutes(initialQuizData.timerMinutes?.toString() || '');
      
      const formSections = (initialQuizData.sections || []).map(dbSection => ({
        ...dbSection,
        id: dbSection.id || generateSectionClientId(), 
        clientId: dbSection.id || generateSectionClientId(), 
        questions: dbSection.questions.map(dbQuestion => ({
          ...dbQuestion,
          id: dbQuestion.id, 
          clientId: dbQuestion.id || generateQuestionClientId(), 
          aiTags: dbQuestion.aiTags || [],
          marks: dbQuestion.marks === undefined ? 1 : parseFloat(String(dbQuestion.marks)), 
          negativeMarks: dbQuestion.negativeMarks === undefined ? 0 : parseFloat(String(dbQuestion.negativeMarks)), 
          options: dbQuestion.options.map(dbOption => ({
            ...dbOption,
            id: dbOption.id || generateOptionClientId(),
            aiTags: dbOption.aiTags || [],
          })),
        })),
      }));

      if (formSections.length > 0) {
        setSections(formSections);
      } else if ((initialQuizData as any).questions?.length > 0) { // Legacy support for quizzes without sections
        const defaultSectionId = generateSectionClientId();
        setSections([{
          id: defaultSectionId,
          clientId: defaultSectionId,
          name: "Main Section",
          questionLimit: undefined,
          timerMinutes: undefined,
          questions: (initialQuizData as any).questions.map((dbQuestion: any) => ({
            ...initialQuestionState, 
            ...dbQuestion,
            id: dbQuestion.id || generateQuestionClientId(), // Use existing or generate new
            clientId: dbQuestion.id || generateQuestionClientId(),
            aiTags: dbQuestion.aiTags || [],
            marks: dbQuestion.marks === undefined ? 1 : parseFloat(String(dbQuestion.marks)),
            negativeMarks: dbQuestion.negativeMarks === undefined ? 0 : parseFloat(String(dbQuestion.negativeMarks)),
            options: (dbQuestion.options || []).map((dbOption: any) => ({
              ...initialOptionState, 
              ...dbOption,
              id: dbOption.id || generateOptionClientId(),
              aiTags: dbOption.aiTags || [],
            })),
          })),
        }]);
      } else {
         const newSectionId = generateSectionClientId();
         setSections([{ ...initialSectionState, id: newSectionId, clientId: newSectionId, name: "Section 1" }]);
      }

    } else {
      const newSectionId = generateSectionClientId();
      setSections([{ ...initialSectionState, id: newSectionId, clientId: newSectionId, name: "Section 1" }]);
    }
  }, [initialQuizData, isEditMode, isMounted]);

  useEffect(() => {
    async function fetchExams() {
      try {
        const response = await fetch('/api/exams');
        if (!response.ok) {
          throw new Error('Failed to fetch exams');
        }
        const data: Exam[] = await response.json();
        setExamsList(data);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        toast({ title: "Error", description: "Could not load exams for selection.", variant: "destructive"});
      }
    }
    
    async function fetchTaxonomyItems(endpoint: string, setter: React.Dispatch<React.SetStateAction<any[]>>, itemName: string) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${itemName}`);
        const data = await response.json();
        setter(data);
      } catch (error) {
        console.error(`Failed to fetch ${itemName}:`, error);
        toast({ title: "Error", description: `Could not load ${itemName} for selection.`, variant: "destructive"});
      }
    }

    if (isMounted) {
      fetchExams();
      fetchTaxonomyItems('/api/classes', setAllClasses, 'classes');
      fetchTaxonomyItems('/api/subjects', setAllSubjects, 'subjects');
      fetchTaxonomyItems('/api/chapters', setAllChapters, 'chapters');
    }
  }, [toast, isMounted]);

  const isPracticeTest = testType === 'Practice Test';
  const showExamDropdown = testType === 'Mock' || testType === 'Previous Year';

  const handleAddSection = () => {
    const newSectionId = generateSectionClientId();
    setSections([...sections, { 
        ...initialSectionState, 
        id: newSectionId, 
        clientId: newSectionId,
        name: `Section ${sections.length + 1}`,
        questions: [{ ...initialQuestionState, clientId: generateQuestionClientId(), options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) }]
    }]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length > 1) {
      setSections(prevSections => prevSections.filter((_, i) => i !== sectionIndex));
    } else {
      toast({ title: "Cannot remove", description: "A quiz must have at least one section.", variant: "destructive" });
    }
  };

  const handleSectionChange = (sectionIndex: number, field: keyof Omit<SectionType, 'id' | 'questions' | 'clientId'>, value: string | number | undefined) => {
    setSections(prevSections =>
      prevSections.map((sec, i) =>
        i === sectionIndex ? { ...sec, [field]: value } : sec
      )
    );
  };
  
  const handleAddQuestionToSection = (sectionIndex: number) => {
    const newQuestionClientId = generateQuestionClientId();
    setSections(prevSections =>
      prevSections.map((section, i) => {
        if (i === sectionIndex) {
          return {
            ...section,
            questions: [
              ...section.questions,
              { ...initialQuestionState, clientId: newQuestionClientId, options: initialQuestionState.options.map(o => ({...o, id: generateOptionClientId()})) }
            ]
          };
        }
        return section;
      })
    );
  };

  const handleQuestionChange = useCallback((sectionIndex: number, questionIndex: number, data: Partial<Omit<QuestionType, 'id'>>) => {
    setSections(prevSections =>
      prevSections.map((section, sIndex) => {
        if (sIndex === sectionIndex) {
          return {
            ...section,
            questions: section.questions.map((q, qIndex) =>
              qIndex === questionIndex ? { ...q, ...data, id: q.id, clientId: q.clientId } : q // Preserve existing id and clientId
            ),
          };
        }
        return section;
      })
    );
  }, []);
  
  const handleRemoveQuestionInSection = useCallback((sectionIndex: number, questionIndex: number) => {
    setSections(prevSections =>
      prevSections.map((section, sIndex) => {
        if (sIndex === sectionIndex) {
          if (section.questions.length > 1) {
            return {
              ...section,
              questions: section.questions.filter((_, qIndex) => qIndex !== questionIndex),
            };
          } else {
            toast({ title: "Cannot remove", description: "A section must have at least one question.", variant: "destructive" });
            return section; 
          }
        }
        return section;
      })
    );
  }, [toast]);


  const associateQuizWithExam = async (quizIdToAssociate: string, examIdToAssociate: string) => {
    if (!quizIdToAssociate || examIdToAssociate === NONE_VALUE || examIdToAssociate === '') return;
    try {
      const response = await fetch(`/api/exams/${examIdToAssociate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quizIdToAssociate }),
      });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to associate quiz with exam.');
      }
      toast({ title: 'Exam Association', description: 'Quiz successfully associated with the selected exam.' });
    } catch (error) {
      console.error('Failed to associate quiz with exam:', error);
      toast({ title: 'Exam Association Failed', description: (error instanceof Error ? error.message : 'An unknown error occurred.'), variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!quizTitle || !testType) {
      toast({ title: "Missing Fields", description: "Please fill in Quiz Title and Test Type.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    const parsedOverallTimerMinutes = overallTimerMinutes ? parseInt(overallTimerMinutes, 10) : undefined;
    if (overallTimerMinutes && (isNaN(parsedOverallTimerMinutes!) || parsedOverallTimerMinutes! < 0)) {
        toast({ title: "Invalid Overall Timer", description: "Overall timer must be a non-negative number.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    const finalClassId = (isPracticeTest && classId && classId !== NONE_VALUE) ? classId : undefined;
    const finalSubjectId = (isPracticeTest && subjectId && subjectId !== NONE_VALUE) ? subjectId : undefined;
    const finalChapterId = (isPracticeTest && chapterId && chapterId !== NONE_VALUE) ? chapterId : undefined;

    const sectionsForPayload = sections.map(({ clientId, id: sectionDbId, ...sectionData }) => {
      const parsedSectionTimer = sectionData.timerMinutes ? parseInt(String(sectionData.timerMinutes), 10) : undefined;
      if (sectionData.timerMinutes && (isNaN(parsedSectionTimer!) || parsedSectionTimer! < 0)) {
          toast({ title: `Invalid Timer for Section "${sectionData.name || 'Unnamed'}"`, description: "Section timer must be a non-negative number.", variant: "destructive"});
          setIsSubmitting(false); 
          throw new Error(`Invalid timer for section "${sectionData.name || 'Unnamed'}"`); 
      }
       const parsedQuestionLimit = sectionData.questionLimit ? parseInt(String(sectionData.questionLimit), 10) : undefined;
       if (sectionData.questionLimit && (isNaN(parsedQuestionLimit!) || parsedQuestionLimit! < 0)) {
          toast({ title: `Invalid Question Limit for Section "${sectionData.name || 'Unnamed'}"`, description: "Question limit must be a non-negative number.", variant: "destructive"});
          setIsSubmitting(false);
          throw new Error(`Invalid question limit for section "${sectionData.name || 'Unnamed'}"`);
       }

      return {
        ...sectionData,
        id: sectionDbId, // Use existing db id if available (edit mode), otherwise it's fine if undefined for new sections
        timerMinutes: parsedSectionTimer,
        questionLimit: parsedQuestionLimit,
        questions: sectionData.questions.map(({ clientId: qClientId, id: questionDbId, ...qData }) => {
          const { options, ...restOfQData } = qData;
          const parsedMarks = typeof restOfQData.marks === 'string' ? parseFloat(restOfQData.marks) : restOfQData.marks;
          const parsedNegativeMarks = typeof restOfQData.negativeMarks === 'string' ? parseFloat(restOfQData.negativeMarks) : restOfQData.negativeMarks;
          
          if(parsedMarks === undefined || isNaN(parsedMarks) || parsedMarks <= 0){
             throw new Error(`Marks for Question "${restOfQData.text.substring(0,20)}..." must be a positive number.`);
          }
          if(parsedNegativeMarks === undefined || isNaN(parsedNegativeMarks) || parsedNegativeMarks < 0){
             throw new Error(`Negative marks for Question "${restOfQData.text.substring(0,20)}..." must be a non-negative number.`);
          }

          return {
            ...restOfQData, 
            id: questionDbId, // Use existing db id if available (edit mode), otherwise it's fine if undefined for new questions
            marks: parsedMarks,
            negativeMarks: parsedNegativeMarks, 
            options: options.map(opt => ({ ...opt, id: opt.id, aiTags: opt.aiTags || [] })), // Preserve option ID
            aiTags: qData.aiTags || []
          };
        })
      };
    });


    const quizPayloadBase: Partial<Quiz> = {
      title: quizTitle,
      testType: testType as 'Previous Year' | 'Mock' | 'Practice Test',
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      timerMinutes: parsedOverallTimerMinutes,
      sections: sectionsForPayload
    };

    if (isPracticeTest) {
      quizPayloadBase.classId = finalClassId;
      quizPayloadBase.subjectId = finalSubjectId;
      quizPayloadBase.chapterId = finalChapterId;
    }

    const formData: QuizFormData | Omit<Quiz, '_id' | 'createdAt' | 'updatedAt' | 'status'> = quizPayloadBase as any;

    
    try {
      for (const section of formData.sections) {
          if (!section.name || section.name.trim() === '') {
            toast({ title: "Section Name Required", description: `Please provide a name for Section ${sections.indexOf(section as any) + 1}.`, variant: "destructive"});
            setIsSubmitting(false); return;
          }
          if (section.questions.length === 0) {
              toast({ title: "Empty Section", description: `Section "${section.name || 'Unnamed'}" must have at least one question.`, variant: "destructive"});
              setIsSubmitting(false); return;
          }
          for (const q of section.questions) {
              if (!q.text || q.options.length === 0 || q.options.every(opt => !opt.text && !opt.imageUrl)) { 
                  toast({ title: "Incomplete Questions", description: `Ensure all questions in section "${section.name || 'Unnamed'}" have text and at least one option with text or an image.`, variant: "destructive"});
                  setIsSubmitting(false); return;
              }
              if (!q.options.some(opt => opt.isCorrect)) {
                  toast({ title: "No Correct Answer", description: `Each question in section "${section.name || 'Unnamed'}" must have at least one correct answer.`, variant: "destructive"});
                  setIsSubmitting(false); return;
              }
              if (q.marks <= 0) {
                  toast({ title: "Invalid Marks", description: `Marks for Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" must be positive.`, variant: "destructive"});
                  setIsSubmitting(false); return;
              }
              if (q.negativeMarks === undefined || q.negativeMarks < 0) {
                   toast({ title: "Invalid Negative Marks", description: `Negative marks for Question "${q.text.substring(0,20)}..." in section "${section.name || 'Unnamed'}" must be non-negative.`, variant: "destructive"});
                  setIsSubmitting(false); return;
              }
          }
      }
    } catch (error) {
       console.error('Client-side validation error:', error);
       toast({ title: 'Validation Error', description: (error instanceof Error) ? error.message : 'An unexpected validation error occurred.', variant: 'destructive' });
       setIsSubmitting(false);
       return;
    }


    const endpoint = isEditMode ? `/api/quizzes/${quizId}` : '/api/quizzes';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok) {
        const savedQuizId = result.quizId || quizId; 
        if (showExamDropdown && selectedExamId !== NONE_VALUE && selectedExamId !== '' && savedQuizId) {
          await associateQuizWithExam(savedQuizId, selectedExamId);
        }
        if (isEditMode) {
            if(onSuccessfulSubmit) onSuccessfulSubmit();
            else {
                 toast({ title: 'Quiz Updated!', description: `Quiz "${(formData as Quiz).title}" has been successfully updated.` });
                router.push('/quizzes');
            }
        } else {
            toast({ title: 'Quiz Saved!', description: `Quiz "${formData.title}" has been successfully saved.` });
            setQuizTitle(''); setTestType(''); 
            setClassId(''); setSubjectId(''); setChapterId('');
            setSelectedExamId(NONE_VALUE); setTags(''); setOverallTimerMinutes(''); 
            const newSId = generateSectionClientId();
            setSections([{ ...initialSectionState, id: newSId, clientId: newSId, name: "Section 1" }]);
        }
      } else {
        toast({ title: isEditMode ? 'Error Updating Quiz' : 'Error Saving Quiz', description: result.message || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: 'Submission Error', description: (error instanceof Error && (error.message.startsWith("Invalid timer") || error.message.startsWith("Invalid question limit") || error.message.startsWith("Marks for Question") || error.message.startsWith("Negative marks for Question") || error.message.startsWith("Section Name Required"))) ? error.message : 'Could not connect to the server. Please try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading form...</p>
      </div>
    );
  }


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
              <Select value={testType} onValueChange={(value) => { setTestType(value as any); if (value === 'Practice Test') setSelectedExamId(NONE_VALUE); }} required >
                <SelectTrigger id="testType"><SelectValue placeholder="Select test type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Previous Year">Previous Year Test</SelectItem>
                  <SelectItem value="Mock">Mock Test</SelectItem>
                  <SelectItem value="Practice Test">Practice Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showExamDropdown && (
             <div className="space-y-2 pt-4 border-t mt-4">
              <Label htmlFor="examType" className="font-semibold">Exam Association</Label>
              <Select value={selectedExamId} onValueChange={(value) => setSelectedExamId(value as any)} disabled={examsList.length === 0} >
                <SelectTrigger id="examType"><SelectValue placeholder={examsList.length === 0 ? "No exams available" : "Select exam (optional)"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {examsList.map((exam) => (<SelectItem key={exam._id} value={exam._id}>{exam.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {examsList.length === 0 && <p className="text-xs text-muted-foreground">No exams found. Create an exam first to associate.</p>}
            </div>
          )}

          {isPracticeTest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t mt-4">
              <div className="space-y-2">
                <Label htmlFor="classId" className="font-semibold">Class</Label>
                <Select value={classId} onValueChange={(value) => setClassId(value === NONE_VALUE ? '' : value)} >
                  <SelectTrigger id="classId"><SelectValue placeholder="Select class (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None (General)</SelectItem>
                    {allClasses.map((cls) => (<SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectId" className="font-semibold">Subject</Label>
                <Select value={subjectId} onValueChange={(value) => setSubjectId(value === NONE_VALUE ? '' : value)} >
                  <SelectTrigger id="subjectId"><SelectValue placeholder="Select subject (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None (General)</SelectItem>
                    {allSubjects.map((subj) => (<SelectItem key={subj._id} value={subj._id}>{subj.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapterId" className="font-semibold">Chapter</Label>
                 <Select value={chapterId} onValueChange={(value) => setChapterId(value === NONE_VALUE ? '' : value)} >
                  <SelectTrigger id="chapterId"><SelectValue placeholder="Select chapter (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None (General)</SelectItem>
                    {allChapters.map((chap) => (<SelectItem key={chap._id} value={chap._id}>{chap.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t mt-4">
            <div className="space-y-2">
              <Label htmlFor="tags" className="font-semibold">Tags (comma-separated)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., important, neet (optional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overallTimerMinutes" className="font-semibold">Overall Quiz Timer (minutes)</Label>
              <Input id="overallTimerMinutes" type="number" value={overallTimerMinutes} onChange={(e) => setOverallTimerMinutes(e.target.value)} placeholder="e.g., 180 (optional)" min="0" />
            </div>
          </div>
        </CardContent>
      </Card>

    {isMounted && sections.length > 0 && (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Sections & Questions</CardTitle>
          <CardDescription>Organize your quiz into sections and add questions to each.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card key={section.clientId} className="p-4 border shadow-md bg-background/50">
              <CardHeader className="px-2 py-3">
                <div className="flex justify-between items-center mb-3">
                  <CardTitle className="font-headline text-xl">
                    Section {sectionIndex + 1}
                  </CardTitle>
                  {sections.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSection(sectionIndex)} aria-label="Remove section" disabled={isSubmitting}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  )}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor={`sectionName-${section.clientId}`} className="text-sm font-medium">Section Name</Label>
                        <Input 
                            id={`sectionName-${section.clientId}`} 
                            value={section.name || ''} 
                            onChange={(e) => handleSectionChange(sectionIndex, 'name', e.target.value)} 
                            placeholder="e.g., Physics Part A"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`sectionQuestionLimit-${section.clientId}`} className="text-sm font-medium">No. of Questions</Label>
                        <Input 
                            id={`sectionQuestionLimit-${section.clientId}`}
                            type="number" 
                            value={section.questionLimit === undefined ? '' : section.questionLimit} 
                            onChange={(e) => handleSectionChange(sectionIndex, 'questionLimit', e.target.value ? parseInt(e.target.value) : undefined)} 
                            placeholder="e.g., 10 (optional)"
                            min="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`sectionTimer-${section.clientId}`} className="text-sm font-medium">Section Timer (minutes)</Label>
                        <Input 
                            id={`sectionTimer-${section.clientId}`}
                            type="number" 
                            value={section.timerMinutes === undefined ? '' : section.timerMinutes} 
                            onChange={(e) => handleSectionChange(sectionIndex, 'timerMinutes', e.target.value ? parseInt(e.target.value) : undefined)} 
                            placeholder="e.g., 30 (optional)"
                            min="0"
                        />
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="px-2 py-3 mt-4 border-t">
                <h4 className="text-lg font-semibold mb-3 font-body">Questions for this Section:</h4>
                {section.questions.map((q, qIndex) => (
                  <QuestionEditor
                    key={q.clientId} 
                    sectionIndex={sectionIndex}
                    questionIndex={qIndex}
                    questionData={q} 
                    onQuestionChange={handleQuestionChange} 
                    onRemoveQuestion={handleRemoveQuestionInSection} 
                    generateOptionId={generateOptionClientId} 
                  />
                ))}
                <Button type="button" variant="outline" onClick={() => handleAddQuestionToSection(sectionIndex)} className="mt-2 w-full md:w-auto" disabled={isSubmitting}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Question to Section {sectionIndex + 1}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Separator className="my-6" />
          <Button type="button" variant="default" onClick={handleAddSection} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            <FileText className="mr-2 h-5 w-5" /> Add New Section
          </Button>
        </CardContent>
      </Card>
    )}
      <CardFooter className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
          <Eye className="mr-2 h-5 w-5" /> Preview Quiz (Not Implemented)
        </Button>
        <Button type="submit" size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<Save className="mr-2 h-5 w-5" />)}
          {isEditMode ? 'Update Quiz' : 'Save Quiz'}
        </Button>
      </CardFooter>
    </form>
  );
}
