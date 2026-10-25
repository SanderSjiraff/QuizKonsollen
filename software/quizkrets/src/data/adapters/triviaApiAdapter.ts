/**
 * The Trivia API-adapter (https://the-trivia-api.com).
 *
 * Dokumentert per oktober 2026:
 * - Gratis for ikke-kommersiell bruk, Creative Commons BY-NC 4.0.
 *   Kildehenvisning: "The Trivia API (the-trivia-api.com)" vises i UI.
 * - Ingen API-nøkkel kreves; maks 50 spørsmål per kall.
 * - Rate limit uten nøkkel: 20 kall per 5 sekunder per IP (HTTP 429 ved overskridelse).
 * - Stabile spørsmåls-IDer fra API-et brukes direkte (prefikset 'tapi-').
 */

import type { Question, Difficulty } from '../../types';
import { migrateCategories, MIGRATION_MAP, CATEGORY_DEF_IDS, UNRESOLVED_CATEGORY } from '../../core/categories';
import { fisherYates } from '../../core/questionSelector';
import {
  type QuestionProvider,
  type ProviderCategory,
  type ProviderFetchResult,
} from './types';

const API_BASE = 'https://the-trivia-api.com/v2';
const CALL_LOG_KEY = 'quizkrets_triviaapi_calls';
const MAX_CALLS_PER_WINDOW = 20;
const WINDOW_MS = 5000;
/** Sikkerhetsmargin: maks 1 kall per 300 ms fra denne klienten. */
const MIN_SPACING_MS = 300;

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  easy: 'lett',
  medium: 'middels',
  hard: 'vanskelig',
};

const DIFFICULTY_TO_API: Record<Difficulty, string> = {
  lett: 'easy',
  middels: 'medium',
  vanskelig: 'hard',
};

/** The Trivia API-kategorier mappet til interne kategorier. */
export const TRIVIA_API_CATEGORIES: ProviderCategory[] = [
  { providerId: 'general_knowledge', name: 'Generell kunnskap', internalCategoryId: 'generell-kunnskap' },
  { providerId: 'history', name: 'Historie', internalCategoryId: 'historie' },
  { providerId: 'science', name: 'Vitenskap', internalCategoryId: 'vitenskap' },
  { providerId: 'geography', name: 'Geografi', internalCategoryId: 'geografi' },
  { providerId: 'film_and_tv', name: 'Film og TV', internalCategoryId: 'film-og-tv' },
  { providerId: 'music', name: 'Musikk', internalCategoryId: 'musikk' },
  { providerId: 'sport_and_leisure', name: 'Sport og fritid', internalCategoryId: 'sport' },
  { providerId: 'arts_and_literature', name: 'Kunst og litteratur', internalCategoryId: 'litteratur' },
  { providerId: 'society_and_culture', name: 'Samfunn og kultur', internalCategoryId: 'samfunn-og-kultur' },
  { providerId: 'food_and_drink', name: 'Mat og drikke', internalCategoryId: 'mat-og-drikke' },
];

interface TriviaApiQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: { text: string };
  correctAnswer: string;
  incorrectAnswers: string[];
  tags: string[];
  type: string;
  regions: string[];
  isNiche: boolean;
}

/** Tidsstempler for nylige kall (glidende rate-limit-vindu). */
function recentCalls(): number[] {
  try {
    const data = localStorage.getItem(CALL_LOG_KEY);
    const calls = data ? (JSON.parse(data) as unknown) : [];
    return Array.isArray(calls) && calls.every(c => typeof c === 'number')
      ? (calls as number[]).filter(t => Date.now() - t < WINDOW_MS)
      : [];
  } catch {
    return [];
  }
}

function logCall(): void {
  const calls = [...recentCalls(), Date.now()];
  localStorage.setItem(CALL_LOG_KEY, JSON.stringify(calls));
}

/**
 * Konverter ett råspørsmål fra The Trivia API til internt format.
 * Eksportert for enhetstester. Bruker API-ets stabile ID.
 *
 * Hovedkategorien mappes via leverandørtabellen (og MIGRATION_MAP).
 * Emneknapper (tags) tas med kun når de matcher kjente interne kategorier –
 * ukjente tags droppes i stedet for å flagge spørsmålet for gjennomgang.
 */
export function convertTriviaApiQuestion(q: TriviaApiQuestion): Question {
  const correctChoice = { id: 'a', text: q.correctAnswer };
  const incorrect = q.incorrectAnswers.map((ans, i) => ({
    id: String.fromCharCode(98 + i),
    text: ans,
  }));
  const choices = fisherYates([correctChoice, ...incorrect]);
  const correctChoiceIds = [choices.find(c => c.text === q.correctAnswer)?.id ?? 'a'];

  // Hovedkategori: kjent leverandørnavn → intern ID; ellers prøv migrering.
  const primary =
    TRIVIA_API_CATEGORIES.find(c => c.providerId === q.category)?.internalCategoryId ??
    MIGRATION_MAP[q.category] ??
    (CATEGORY_DEF_IDS.has(q.category) ? q.category : undefined);

  const categories = primary
    ? migrateCategories([primary]).filter(c => c !== UNRESOLVED_CATEGORY)
    : [UNRESOLVED_CATEGORY];

  // Tags: kun kjente interne kategorier tas med.
  for (const tag of q.tags) {
    const mapped = MIGRATION_MAP[tag] ?? (CATEGORY_DEF_IDS.has(tag) ? tag : undefined);
    if (mapped && !categories.includes(mapped)) {
      for (const c of migrateCategories([mapped])) {
        if (c !== UNRESOLVED_CATEGORY && !categories.includes(c)) categories.push(c);
      }
    }
  }

  return {
    id: `tapi-${q.id}`,
    text: q.question.text,
    type: q.type === 'boolean' ? 'true_false' : 'multiple_choice',
    difficulty: DIFFICULTY_MAP[q.difficulty] ?? 'middels',
    categories,
    choices,
    correctChoiceIds,
  };
}

export const triviaApiProvider: QuestionProvider = {
  id: 'trivia-api',
  name: 'The Trivia API',
  description:
    'Gratis API (CC BY-NC 4.0) med moderne spørsmål og stabile IDer. Ikke-kommersiell bruk.',
  licenseNote: 'The Trivia API (the-trivia-api.com), CC BY-NC 4.0',
  rateLimit: { callsPerWindow: MAX_CALLS_PER_WINDOW, windowMs: WINDOW_MS },
  categories: TRIVIA_API_CATEGORIES,

  msUntilReady(): number {
    const calls = recentCalls();
    if (calls.length >= MAX_CALLS_PER_WINDOW) {
      const oldest = calls[0];
      const waitWindow = WINDOW_MS - (Date.now() - oldest);
      if (waitWindow > 0) return waitWindow;
    }
    const last = calls[calls.length - 1];
    if (last !== undefined) {
      const spacing = MIN_SPACING_MS - (Date.now() - last);
      if (spacing > 0) return spacing;
    }
    return 0;
  },

  async fetchQuestions(params): Promise<ProviderFetchResult> {
    const wait = this.msUntilReady();
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    const url = new URL(`${API_BASE}/questions`);
    url.searchParams.set('limit', Math.min(Math.max(params.amount, 1), 50).toString());
    if (params.providerCategory) {
      url.searchParams.set('categories', params.providerCategory);
    }
    if (params.difficulty) {
      url.searchParams.set('difficulties', DIFFICULTY_TO_API[params.difficulty]);
    }
    // API-et leverer kun flervalgsspørsmål av typen text_choice/hybrid;
    // sant/usant filtreres bort lokalt dersom etterspurt.
    if (params.questionType === 'boolean') {
      throw new Error('The Trivia API støtter ikke sant/usant-spørsmål. Bruk Open Trivia DB.');
    }

    const response = await fetch(url.toString());
    if (response.status === 429) {
      throw new Error('The Trivia API har nådd rate-limit. Vent noen sekunder og prøv igjen.');
    }
    if (!response.ok) {
      throw new Error(`Nettverksfeil mot The Trivia API (HTTP ${response.status}).`);
    }
    const data = (await response.json()) as TriviaApiQuestion[];
    logCall();

    let hadInvalid = false;
    const questions = data
      .filter(q => q.type === 'text_choice' || q.type === 'multiple_choice')
      .map(q => {
        try {
          return convertTriviaApiQuestion(q);
        } catch {
          hadInvalid = true;
          return null;
        }
      })
      .filter((q): q is Question => q !== null);

    return { questions, hadInvalid };
  },
};
