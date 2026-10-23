// Open Trivia Database API Client
// https://opentdb.com/api_config.php

import type { Question, Difficulty } from '../types';

export interface OpenTDBCategory {
  id: number;
  name: string;
}

export interface OpenTDBQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

const API_BASE = 'https://opentdb.com';
const LAST_CALL_KEY = 'opentdb_last_call';
const RATE_LIMIT_MS = 5500; // 5.5 sekunder for sikkerhetsmargin

// Mapper engelske kategorier til norske
const CATEGORY_MAP: Record<string, string> = {
  'General Knowledge': 'generell_kunnskap',
  'Entertainment: Books': 'underholdning_bøker',
  'Entertainment: Film': 'film',
  'Entertainment: Music': 'musikk',
  'Entertainment: Musicals & Theatres': 'teater',
  'Entertainment: Television': 'tv',
  'Entertainment: Video Games': 'videospill',
  'Entertainment: Board Games': 'brettspill',
  'Science & Nature': 'vitenskap_natur',
  'Science: Computers': 'data',
  'Science: Mathematics': 'matematikk',
  'Mythology': 'mytologi',
  'Sports': 'sport',
  'Geography': 'geografi',
  'History': 'historie',
  'Politics': 'politikk',
  'Art': 'kunst',
  'Celebrities': 'kjendiser',
  'Animals': 'dyr',
  'Vehicles': 'kjøretøy',
  'Entertainment: Comics': 'tegneserier',
  'Science: Gadgets': 'gadgets',
  'Entertainment: Japanese Anime & Manga': 'anime',
  'Entertainment: Cartoon & Animations': 'tegnefilm',
};

// Sjekk rate limiting
function canMakeRequest(): boolean {
  const lastCall = localStorage.getItem(LAST_CALL_KEY);
  if (!lastCall) return true;
  
  const timeSinceLastCall = Date.now() - parseInt(lastCall);
  return timeSinceLastCall >= RATE_LIMIT_MS;
}

function markRequest() {
  localStorage.setItem(LAST_CALL_KEY, Date.now().toString());
}

async function waitForRateLimit(): Promise<void> {
  const lastCall = localStorage.getItem(LAST_CALL_KEY);
  if (!lastCall) return;
  
  const timeSinceLastCall = Date.now() - parseInt(lastCall);
  const waitTime = RATE_LIMIT_MS - timeSinceLastCall;
  
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

export async function fetchCategories(): Promise<OpenTDBCategory[]> {
  await waitForRateLimit();
  
  const response = await fetch(`${API_BASE}/api_category.php`);
  const data = await response.json();
  
  markRequest();
  
  return data.trivia_categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
  }));
}

export async function fetchQuestions(params: {
  amount: number;
  category?: number;
  difficulty?: string;
  type?: string;
}): Promise<OpenTDBQuestion[]> {
  await waitForRateLimit();
  
  if (!canMakeRequest()) {
    throw new Error('Rate limit: Vent 5 sekunder mellom hvert kall');
  }
  
  const url = new URL(`${API_BASE}/api.php`);
  url.searchParams.set('amount', Math.min(params.amount, 50).toString());
  
  if (params.category) {
    url.searchParams.set('category', params.category.toString());
  }
  
  if (params.difficulty) {
    url.searchParams.set('difficulty', params.difficulty);
  }
  
  if (params.type) {
    url.searchParams.set('type', params.type);
  }
  
  // Hent og konverter encoding
  url.searchParams.set('encode', 'url3986');
  
  const response = await fetch(url.toString());
  const data: OpenTDBResponse = await response.json();
  
  markRequest();
  
  // Håndter response codes
  switch (data.response_code) {
    case 0: // Success
      return data.results;
    case 1:
      throw new Error('Ikke nok spørsmål tilgjengelig for disse kriteriene. Prøv færre spørsmål eller annen kategori.');
    case 2:
      throw new Error('Ugyldige parametere sendt til API-et.');
    case 5:
      throw new Error('Rate limit nådd. Vent 5 sekunder før neste forespørsel.');
    default:
      throw new Error(`API-feil (kode ${data.response_code})`);
  }
}

export function convertToQuizKretsFormat(otdbQuestions: OpenTDBQuestion[]): Question[] {
  return otdbQuestions.map((q, index) => {
    // Dekode URL-encoded tekst
    const decode = (text: string) => decodeURIComponent(text);
    
    // Generer unik ID
    const id = `otdb-${Date.now()}-${index}`;
    
    // Konverter vanskelighet
    const difficultyMap: Record<string, Difficulty> = {
      'easy': 'lett',
      'medium': 'middels',
      'hard': 'vanskelig',
    };
    
    // Lag alternativer
    const choices = [
      { id: 'a', text: decode(q.correct_answer) },
      ...q.incorrect_answers.map((ans, i) => ({
        id: String.fromCharCode(98 + i), // b, c, d, ...
        text: decode(ans),
      })),
    ].sort(() => Math.random() - 0.5); // Shuffle alternativer
    
    // Finn riktig svar-ID etter shuffling
    const correctChoice = choices.find(c => c.text === decode(q.correct_answer));
    const correctChoiceIds = correctChoice ? [correctChoice.id] : ['a'];
    
    // Konverter type
    const type = q.type === 'boolean' ? 'true_false' : 'multiple_choice';
    
    return {
      id,
      text: decode(q.question),
      type: type as any,
      difficulty: difficultyMap[q.difficulty] || 'middels',
      categories: [CATEGORY_MAP[q.category] || q.category.toLowerCase().replace(/\s+/g, '_')],
      choices,
      correctChoiceIds,
    };
  });
}

export function getCachedQuestions(): Question[] {
  try {
    const cached = localStorage.getItem('quizkrets_otdb_cache');
    if (!cached) return [];
    return JSON.parse(cached);
  } catch {
    return [];
  }
}

export function cacheQuestions(questions: Question[]): void {
  try {
    const existing = getCachedQuestions();
    // Unngå duplikater basert på spørsmålstekst
    const existingTexts = new Set(existing.map(q => q.text));
    const newQuestions = questions.filter(q => !existingTexts.has(q.text));
    
    const combined = [...existing, ...newQuestions];
    // Begrens cache til 1000 spørsmål
    const trimmed = combined.slice(-1000);
    
    localStorage.setItem('quizkrets_otdb_cache', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Kunne ikke cache spørsmål:', error);
  }
}

export function clearQuestionCache(): void {
  localStorage.removeItem('quizkrets_otdb_cache');
}

export function getCacheStats(): { total: number; byCategory: Record<string, number> } {
  const questions = getCachedQuestions();
  const byCategory: Record<string, number> = {};
  
  questions.forEach(q => {
    q.categories.forEach(cat => {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
  });
  
  return {
    total: questions.length,
    byCategory,
  };
}
