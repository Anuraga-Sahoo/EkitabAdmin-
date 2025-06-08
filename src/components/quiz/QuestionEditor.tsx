
'use client';

import { useState, useEffect } from 'react';
import type { Question, Option } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import { PlusCircle, Trash2, ImageUp, Edit3, HelpCircle, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuestionEditorProps {
  sectionIndex: number;
  questionIndex: number;
  questionData: Partial<Question> & { clientId: string; options: Array<Partial<Option> & { id: string }> };
  onQuestionChange: (sectionIndex: number, questionIndex: number, data: Partial<Omit<Question, 'id'>>) => void;
  onRemoveQuestion: (sectionIndex: number, questionIndex: number) => void;
  generateOptionId: () => string;
}

export function QuestionEditor({
  sectionIndex,
  questionIndex,
  questionData: initialQuestionData,
  onQuestionChange,
  onRemoveQuestion,
  generateOptionId,
}: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionData.text || '');
  const [questionImageUrl, setQuestionImageUrl] = useState(initialQuestionData.imageUrl || '');
  const [questionAiTags, setQuestionAiTags] = useState(initialQuestionData.aiTags || []);
  const [marks, setMarks] = useState<number>(initialQuestionData.marks === undefined ? 1 : initialQuestionData.marks);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialQuestionData.negativeMarks === undefined ? 0 : initialQuestionData.negativeMarks);
  
  const [options, setOptions] = useState<(Partial<Option> & { id: string })[]>(
    initialQuestionData.options.map(opt => ({
      ...opt,
      id: opt.id, // Rely on ID from QuizUploadForm
      aiTags: opt.aiTags || []
    }))
  );
  const [explanation, setExplanation] = useState(initialQuestionData.explanation || '');
  
  const [editorId, setEditorId] = useState<string | null>(null);

  useEffect(() => {
    // Ensure clientId is always available for editorId
    if (initialQuestionData.clientId) {
      setEditorId(`question-editor-${initialQuestionData.clientId}`);
    } else {
      // Fallback, though ideally QuizUploadForm always provides a clientId
      console.warn("QuestionEditor: initialQuestionData.clientId is missing. Generating temporary ID.");
      setEditorId(`question-editor-temp-${Math.random().toString(36).substring(2, 11)}`);
    }
  }, [initialQuestionData.clientId]);


  useEffect(() => {
    const updatedQuestionData: Partial<Omit<Question, 'id'>> & { id?: string; options: Array<Partial<Omit<Option, 'id'>> & { id?: string }> } = {
      id: initialQuestionData.id, 
      text: questionText,
      imageUrl: questionImageUrl,
      aiTags: questionAiTags,
      marks: marks,
      negativeMarks: negativeMarks,
      options: options.map(opt => ({
        id: opt.id, 
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        aiTags: opt.aiTags,
      })),
      explanation: explanation,
    };
    onQuestionChange(sectionIndex, questionIndex, updatedQuestionData);
  }, [questionText, questionImageUrl, questionAiTags, marks, negativeMarks, options, explanation, sectionIndex, questionIndex, onQuestionChange, initialQuestionData.id]);

  const handleOptionChange = (optionIndex: number, field: keyof Omit<Option, 'id'>, value: any) => {
    setOptions((prevOptions) =>
      prevOptions.map((opt, i) =>
        i === optionIndex ? { ...opt, [field]: value } : opt
      )
    );
  };
  
  const handleOptionImageUploaded = (optionIndex: number, dataUri: string, tags: string[]) => {
     setOptions((prevOptions) =>
      prevOptions.map((opt, i) =>
        i === optionIndex ? { ...opt, imageUrl: dataUri, aiTags: tags } : opt
      )
    );
  };

  const addOption = () => {
    if (options.length < 5) { 
      setOptions([...options, { id: generateOptionId(), text: '', isCorrect: false, aiTags: [] }]); 
    }
  };

  const removeOption = (optionIndex: number) => {
    if (options.length > 1) { 
      setOptions(options.filter((_, i) => i !== optionIndex));
    }
  };

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueString = e.target.value;
    const value = valueString === '' ? 0 : parseFloat(valueString); // Use parseFloat
    setMarks(isNaN(value) || value < 0 ? 0 : value);
  };
  
  const handleNegativeMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueString = e.target.value;
    const value = valueString === '' ? 0 : parseFloat(valueString); // Use parseFloat
    setNegativeMarks(isNaN(value) || value < 0 ? 0 : value);
  };

  if (!editorId) return <div>Loading editor...</div>;

  return (
    <Card className="mb-6 shadow-md bg-background/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-xl">Question {questionIndex + 1}</CardTitle>
          <CardDescription>Edit the question details, options, scoring, and explanation.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveQuestion(sectionIndex, questionIndex)} aria-label="Remove question">
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`${editorId}-q-text`} className="font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4" />Question Text</Label>
          <Textarea
            id={`${editorId}-q-text`}
            placeholder="Enter question text here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[100px] text-base"
          />
        </div>

        <div className="space-y-2">
           <Label className="font-semibold flex items-center gap-2"><ImageUp className="w-4 h-4" />Question Image (Optional)</Label>
          <ImageUploader
            onImageUploaded={(dataUri, tags) => {
              setQuestionImageUrl(dataUri);
              setQuestionAiTags(tags);
            }}
            idSuffix={`q-${questionIndex}-${editorId}`}
          />
          {questionImageUrl && <p className="text-xs text-muted-foreground">Image selected for question.</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${editorId}-q-marks`} className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4" />Marks for Correct Answer</Label>
            <Input
              id={`${editorId}-q-marks`}
              type="number"
              value={marks}
              onChange={handleMarksChange}
              placeholder="e.g., 4 or 2.5"
              min="0"
              step="any" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${editorId}-q-negative-marks`} className="font-semibold flex items-center gap-2"><TrendingDown className="w-4 h-4" />Marks for Incorrect Answer (Negative)</Label>
            <Input
              id={`${editorId}-q-negative-marks`}
              type="number"
              value={negativeMarks}
              onChange={handleNegativeMarksChange}
              placeholder="e.g., 1 or 0.5 (0 if no negative marking)"
              min="0"
              step="any" 
            />
             <p className="text-xs text-muted-foreground">Enter a positive value for deduction, e.g., '1' for -1. Defaults to 0.</p>
          </div>
        </div>


        <Separator />

        <div>
          <h4 className="text-lg font-semibold mb-3 font-headline">Options</h4>
          {options.map((option, optIndex) => (
            <Card key={option.id} className="mb-4 p-4 bg-card/50 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${editorId}-opt-text-${optIndex}`} className="font-medium">Option {optIndex + 1}</Label>
                  {options.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optIndex)} aria-label="Remove option">
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  id={`${editorId}-opt-text-${optIndex}`}
                  placeholder={`Enter text for option ${optIndex + 1}`}
                  value={option.text || ''}
                  onChange={(e) => handleOptionChange(optIndex, 'text', e.target.value)}
                  className="text-sm"
                />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Option Image (Optional)</Label>
                  <ImageUploader
                    onImageUploaded={(dataUri, tags) => handleOptionImageUploaded(optIndex, dataUri, tags)}
                    idSuffix={`q-${questionIndex}-opt-${optIndex}-${editorId}`}
                  />
                   {option.imageUrl && <p className="text-xs text-muted-foreground">Image selected for option.</p>}
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id={`${editorId}-opt-correct-${optIndex}`}
                    checked={!!option.isCorrect}
                    onCheckedChange={(checked) => handleOptionChange(optIndex, 'isCorrect', checked)}
                  />
                  <Label htmlFor={`${editorId}-opt-correct-${optIndex}`} className="text-sm font-medium">
                    Correct Answer
                  </Label>
                </div>
              </div>
            </Card>
          ))}
          {options.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
          )}
        </div>
        
        <Separator />

        <div className="space-y-2">
          <Label htmlFor={`${editorId}-q-explanation`} className="font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4" />Explanation (Optional)</Label>
          <Textarea
            id={`${editorId}-q-explanation`}
            placeholder="Enter explanation for the question (can include code snippets using markdown format for code font styling)..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="min-h-[100px] text-base font-body data-[code]:font-code"
          />
        </div>
      </CardContent>
    </Card>
  );
}
