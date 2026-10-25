/**
 * Quizhistorikk – lagrer faktiske data fra hver quiz.
 *
 * Bakoverkompatibilitet: gamle oppføringer (uten playerStats/answers/etc.)
 * leses uten krasj; manglende felter får nøytrale standardverdier i UI-et.
 */

import type { GameMode } from '../types';
import type { AnswerRecord, PlayerStats } from '../core/scoring';

export interface QuizHistoryPlayer {
  id: number;
  name: string;
  score: number;
  color: string;
}

/** Format brukt fra og med v2 (full statistikk). */
export interface QuizHistory {
  id: string;
  date: string;
  quizName: string;
  mode: GameMode | string;
  players: QuizHistoryPlayer[];
  totalQuestions: number;
  /** Spilletid i millisekunder. Gamle oppføringer har 0. */
  duration: number;
  /** Spørsmåls-IDer som inngikk, i rekkefølge. */
  questionIds: string[];
  /** Full svarhistorikk per spiller. Kan mangle i gamle oppføringer. */
  answers?: AnswerRecord[];
  /** Statistikk per spiller (beregnet ved avslutning). Kan mangle i gamle. */
  playerStats?: PlayerStats[];
  /** Antall riktige svar per spiller (forenklet visning). Kan mangle i gamle. */
  correctByPlayer?: Record<number, number>;
}

const HISTORY_KEY = 'quizkrets_history';
const MAX_ENTRIES = 100;

export function saveQuizHistory(history: QuizHistory): void {
  try {
    const existing = getQuizHistory();
    existing.unshift(history);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, MAX_ENTRIES)));
  } catch (error) {
    console.error('Kunne ikke lagre historikk:', error);
  }
}

export function getQuizHistory(): QuizHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Sikre minimumsform på gamle oppføringer
    return parsed.map((h: Partial<QuizHistory>) => ({
      id: typeof h.id === 'string' ? h.id : `quiz-${Math.random().toString(36).slice(2)}`,
      date: typeof h.date === 'string' ? h.date : new Date().toISOString(),
      quizName: typeof h.quizName === 'string' ? h.quizName : 'Quiz',
      mode: typeof h.mode === 'string' ? h.mode : 'classic',
      players: Array.isArray(h.players) ? h.players : [],
      totalQuestions: typeof h.totalQuestions === 'number' ? h.totalQuestions : 0,
      duration: typeof h.duration === 'number' ? h.duration : 0,
      questionIds: Array.isArray(h.questionIds) ? h.questionIds : [],
      answers: Array.isArray(h.answers) ? h.answers : undefined,
      playerStats: Array.isArray(h.playerStats) ? h.playerStats : undefined,
      correctByPlayer:
        h.correctByPlayer && typeof h.correctByPlayer === 'object' ? h.correctByPlayer : undefined,
    }));
  } catch {
    return [];
  }
}

export function deleteQuizHistory(id: string): void {
  try {
    const existing = getQuizHistory();
    const filtered = existing.filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Kunne ikke slette historikk:', error);
  }
}

export function clearQuizHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

/** Bakoverkompatibelt alias. */
export const clearAllHistory = clearQuizHistory;
