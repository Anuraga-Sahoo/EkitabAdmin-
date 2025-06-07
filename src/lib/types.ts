
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
  marks: number; // Marks for correct answer
  negativeMarks?: number; // Marks to deduct for wrong answer, defaults to 0
};

export type QuizStatus = 'Published' | 'Draft' | 'Private';

export type Quiz = {
  _id: string; // MongoDB's default ID field, always present when fetched
  title: string;
  testType: 'Previous Year' | 'Mock' | 'Practice Test';
  classType?: '11th' | '12th';
  subject?: 'Physics' | 'Chemistry' | 'Biology';
  chapter?: string;
  tags?: string[];
  timerMinutes?: number;
  questions: Question[];
  status: QuizStatus;
  createdAt?: Date;
  updatedAt?: Date;
  // examId?: string; // Optional: if you want to link Quiz back to Exam directly
};

// For form state, we don't need MongoDB's _id or generated question/option IDs initially
export type QuizFormData = Omit<Quiz, '_id' | 'questions' | 'createdAt' | 'updatedAt' | 'status'> & {
  questions: Array<Omit<Question, 'id' | 'options'> & {
    options: Array<Omit<Option, 'id'>>;
  }>;
};

export type User = {
  _id: string; // from MongoDB, will be string after conversion
  name: string;
  email: string;
  mobileNumber?: string;
  joinedDate: Date | string; // Store as Date in DB, will be string after JSON serialization
  lastLogin?: Date | string; // Store as Date in DB, will be string after JSON serialization
};

export type Exam = {
  _id: string; // MongoDB's default ID field
  name: string;
  createdAt: Date;
  updatedAt?: Date;
  quizIds?: string[]; // Array of Quiz IDs associated