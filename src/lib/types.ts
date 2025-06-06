export type Option = {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  aiTags?: string[];
};

export type Question = {
  id: string;
  text: string;
  imageUrl?: string;
  aiTags?: string[];
  options: Option[];
  explanation?: string;
};

export type Quiz = {
  id: string;
  title: string;
  testType: 'Previous Year' | 'Mock' | 'Practice Test';
  classType?: '11th' | '12th'; // Renamed from 'class' to avoid conflict with keyword
  subject?: 'Physics' | 'Chemistry' | 'Biology';
  chapter?: string;
  tags?: string[];
  questions: Question[];
};

// For form state
export type QuizFormData = Omit<Quiz, 'id' | 'questions'> & {
  questions: Array<Omit<Question, 'id' | 'options'> & {
    options: Array<Omit<Option, 'id'>>;
  }>;
};
