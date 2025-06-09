
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

export type Section = {
  id: string; // Client-side ID during form manipulation, can be DB ID if persisted
  name?: string;
  questionLimit?: number; // Optional: How many questions this section can hold
  timerMinutes?: number; // Optional: Timer specific to this section
  questions: Question[];
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
  timerMinutes?: number; // Overall quiz timer
  sections: Section[]; // Questions are now within sections
  status: QuizStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

// For form state, reflect the new structure with sections
export type QuizFormData = Omit<Quiz, '_id' | 'sections' | 'createdAt' | 'updatedAt' | 'status'> & {
  sections: Array<Omit<Section, 'id' | 'questions'> & {
    id?: string; // Allow id for existing sections
    questions: Array<Omit<Question, 'id' | 'options'> & {
      id?: string; // Allow id for existing questions
      options: Array<Omit<Option, 'id'> & { id?: string }>;
    }>;
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
};

export type ClassItem = {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type SubjectItem = {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type ChapterItem = {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
};
