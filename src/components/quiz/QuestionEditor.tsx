
'use client';

import { useState, useEffect } from 'react';
import type { Question, Option } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import { PlusCircle, Trash2, ImageUp, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuestionEditorProps {
  questionIndex: number;
  questionData: Partial<Question> & { clientId: string; options: Array<Partial<Option> & { id: string /* or clientId if new */}> };
  onQuestionChange: (index: number, data: Partial<Omit<Question, 'id'>>) => void;
  onRemoveQuestion: (index: number) => void;
}

// Helper to generate unique IDs for options client-side
let nextClientOptionId = 0;
const generateClientOptionId = () => `client-option-${nextClientOptionId++}`;


export function QuestionEditor({
  questionIndex,
  questionData: initialQuestionData,
  onQuestionChange,
  onRemoveQuestion,
}: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionData.text || '');
  const [questionImageUrl, setQuestionImageUrl] = useState(initialQuestionData.imageUrl || '');
  const [questionAiTags, setQuestionAiTags] = useState(initialQuestionData.aiTags || []);
  
  // Options now expect `id` (which can be DB id or client-generated for new ones)
  const [options, setOptions] = useState<(Partial<Option> & { id: string })[]>(
    (initialQuestionData.options || [{ id: generateClientOptionId(), text: '', isCorrect: false }]).map(opt => ({
      ...opt,
      id: opt.id || generateClientOptionId(), // Ensure every option has an ID (DB or client)
      aiTags: opt.aiTags || []
    }))
  );
  const [explanation, setExplanation] = useState(initialQuestionData.explanation || '');
  
  const [editorId, setEditorId] = useState<string | null>(null);
  useEffect(() => {
    setEditorId(`question-editor-${initialQuestionData.clientId || Math.random().toString(36).substring(2, 11)}`);
  }, [initialQuestionData.clientId]);


  useEffect(() => {
    // When reporting changes, we send data structure expected by QuizFormData (no clientIds)
    // but preserve original DB IDs if they exist on questionData.id and option.id
    const updatedQuestionData: Partial<Omit<Question, 'id'>> & { id?: string; options: Array<Partial<Omit<Option, 'id'>> & { id?: string }> } = {
      id: initialQuestionData.id, // Preserve original question DB ID
      text: questionText,
      imageUrl: questionImageUrl,
      aiTags: questionAiTags,
      options: options.map(opt => ({
        id: opt.id, // Preserve original option DB ID (or client-generated one if new)
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        aiTags: opt.aiTags,
      })),
      explanation: explanation,
    };
    onQuestionChange(questionIndex, updatedQuestionData);
  }, [questionText, questionImageUrl, questionAiTags, options, explanation, questionIndex, onQuestionChange, initialQuestionData.id]);

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
    if (options.length < 5) { // Max 5 options
      setOptions([...options, { id: generateClientOptionId(), text: '', isCorrect: false, aiTags: [] }]);
    }
  };

  const removeOption = (optionIndex: number) => {
    if (options.length > 1) { // Min 1 option
      setOptions(options.filter((_, i) => i !== optionIndex));
    }
  };

  if (!editorId) return <div>Loading editor...</div>;

  return (
    <Card className="mb-6 shadow-md bg-background/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-xl">Question {questionIndex + 1}</CardTitle>
          <CardDescription>Edit the question details, options, and explanation.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveQuestion(questionIndex)} aria-label="Remove question">
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

        <Separator />

        <div>
          <h4 className="text-lg font-semibold mb-3 font-headline">Options</h4>
          {options.map((option, optIndex) => (
            <Card key={option.id} className="mb-4 p-4 bg-card/50 shadow-sm"> {/* Use option.id for key */}
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
