import type { QuizPreset } from '../types';
import type { GameConfig } from '../hooks/useGameEngine';

interface StoredQuiz {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preset: QuizPreset;
}

const STORAGE_KEY = 'quizkrets_saved_quizzes';

/**
 * Map en QuizPreset til config-overstyringer for startGame (P1 #5).
 *
 * `categoryWeights` oppgis ALLTID eksplisitt (også som {} for preseter
 * uten vekter): startGame fletter configUpdates grunne over eksisterende
 * config, så vekter fra en tidligere quiz skal aldri følge med i en ny.
 */
export function presetToConfigUpdates(preset: QuizPreset): Partial<GameConfig> {
  const round = preset.rounds[0];
  return {
    quizName: preset.name,
    selectedCategories: preset.categories,
    selectedDifficulties: preset.difficulties,
    questionCount: preset.questionCount,
    gameMode: round?.mode ?? 'classic',
    timePerQuestion: round?.timeLimit ?? 20,
    pointsPerCorrect: round?.pointsPerCorrect ?? 100,
    pointsPerWrong: round?.pointsPerWrong ?? 0,
    bonusForSpeed: round?.bonusForSpeed ?? false,
    categoryWeights: preset.categoryWeights ?? {},
    customTheme: preset.customTheme,
  };
}

export interface SaveQuizResult {
  ok: boolean;
  message: string;
  error?: string;
}

export function saveQuizPreset(preset: QuizPreset): SaveQuizResult {
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
    return {
      ok: true,
      message: existingIndex >= 0 ? 'Quiz oppdatert.' : 'Quiz lagret.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Kunne ikke lagre quiz:', error);
    return {
      ok: false,
      message: 'Kunne ikke lagre quiz.',
      error: `Lagringsfeil: ${errorMessage}`,
    };
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
