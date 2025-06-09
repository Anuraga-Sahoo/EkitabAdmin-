
// src/lib/mongodb.ts
import { MongoClient, Db, Collection } from 'mongodb';
import type { Quiz, User, Exam, ClassItem, SubjectItem, ChapterItem } from './types';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'database'; // Default to 'database' if not set

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
}

// Extend the NodeJS.Global interface to include our mongo cache
declare global {
  // eslint-disable-next-line no-var
  var mongo: MongoCache | undefined;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

if (process.env.NODE_ENV === 'development') {
  if (!global.mongo) {
    global.mongo = { client: null, db: null };
  }
  cachedClient = global.mongo.client;
  cachedDb = global.mongo.db;
}

interface DatabaseCollections {
  client: MongoClient;
  db: Db;
  quizzesCollection: Collection<Quiz>;
  usersCollection: Collection<Omit<User, '_id'>>; 
  examsCollection: Collection<Omit<Exam, '_id'>>; 
  classesCollection: Collection<Omit<ClassItem, '_id'>>;
  subjectsCollection: Collection<Omit<SubjectItem, '_id'>>;
  chaptersCollection: Collection<Omit<ChapterItem, '_id'>>;
}

export async function connectToDatabase(): Promise<DatabaseCollections> {
  if (cachedClient && cachedDb) {
    return { 
      client: cachedClient, 
      db: cachedDb, 
      quizzesCollection: cachedDb.collection<Quiz>('quizzes'),
      usersCollection: cachedDb.collection<Omit<User, '_id'>>('users'),
      examsCollection: cachedDb.collection<Omit<Exam, '_id'>>('exams'),
      classesCollection: cachedDb.collection<Omit<ClassItem, '_id'>>('classes'),
      subjectsCollection: cachedDb.collection<Omit<SubjectItem, '_id'>>('subjects'),
      chaptersCollection: cachedDb.collection<Omit<ChapterItem, '_id'>>('chapters'),
    };
  }

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB);

  if (process.env.NODE_ENV === 'development') {
    global.mongo!.client = client;
    global.mongo!.db = db;
  } else {
    cachedClient = client;
    cachedDb = db;
  }
  
  const quizzesCollection = db.collection<Quiz>('quizzes');
  const usersCollection = db.collection<Omit<User, '_id'>>('users');
  const examsCollection = db.collection<Omit<Exam, '_id'>>('exams');
  const classesCollection = db.collection<Omit<ClassItem, '_id'>>('classes');
  const subjectsCollection = db.collection<Omit<SubjectItem, '_id'>>('subjects');
  const chaptersCollection = db.collection<Omit<ChapterItem, '_id'>>('chapters');

  return { client, db, quizzesCollection, usersCollection, examsCollection, classesCollection, subjectsCollection, chaptersCollection };
}
