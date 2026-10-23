import type { QuizPreset } from '../types';

interface StoredQuiz {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preset: QuizPreset;
}

const STORAGE_KEY = 'quizkrets_saved_quizzes';

export function saveQuizPreset(preset: QuizPreset): void {
  try {
    const saved = getSavedQuizzes();
    const existingIndex = saved.findIndex(q => q.id === preset.id);
    
    const quizData: StoredQuiz = {
      id: preset.id,
      name: preset.name,
      createdAt: existingIndex >= 0 ? saved[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preset,
    };

    if (existingIndex >= 0) {
      saved[existingIndex] = quizData;
    } else {
      saved.push(quizData);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error('Kunne ikke lagre quiz:', error);
  }
}

export function getSavedQuizzes(): StoredQuiz[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteSavedQuiz(id: string): void {
  try {
    const saved = getSavedQuizzes();
    const filtered = saved.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Kunne ikke slette quiz:', error);
  }
}

export function getSavedQuizById(id: string): StoredQuiz | undefined {
  const saved = getSavedQuizzes();
  return saved.find(q => q.id === id);
}

// Eksporter også for typesjekking
export type { StoredQuiz };
