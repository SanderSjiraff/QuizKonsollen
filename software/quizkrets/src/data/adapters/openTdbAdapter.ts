/**
 * Open Trivia Database-adapter (https://opentdb.com).
 *
 * - Gratis, ingen API-nøkkel. Rate limit: 1 kall per 5 sekunder per IP.
 * - API-et gir ingen spørsmåls-IDer, så vi bruker stabil innholdshash
 *   (FNV-1a over normalisert spørsmålstekst) i stedet for Date.now().
 * - Teksten er engelsk og URL-kodet (encode=url3986); dekodes ved henting.
 * - Lisens: Open Trivia DB er fri kilde som kan brukes uten avgift.
 */

import type { Question, Difficulty } from '../../types';
import { migrateCategories } from '../../core/categories';
import { fisherYates } from '../../core/questionSelector';
import { contentHash } from '../questionStore';
import {
  type QuestionProvider,
  type ProviderCategory,
  type ProviderFetchParams,
  type ProviderFetchResult,
} from './types';

const API_BASE = 'https://opentdb.com';
const LAST_CALL_KEY = 'quizkrets_opentdb_last_call';
const RATE_WINDOW_MS = 5500; // 5 sek + sikkerhetsmargin

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

/** OpenTDB-kategorier med numerisk API-ID og tilhørende intern kategori. */
export const OPENTDB_CATEGORIES: ProviderCategory[] = [
  { providerId: '9', name: 'Generell kunnskap', internalCategoryId: 'generell-kunnskap' },
  { providerId: '10', name: 'Bøker', internalCategoryId: 'litteratur' },
  { providerId: '11', name: 'Film', internalCategoryId: 'film-og-tv' },
  { providerId: '12', name: 'Musikk', internalCategoryId: 'musikk' },
  { providerId: '13', name: 'Musikaler og teater', internalCategoryId: 'teater' },
  { providerId: '14', name: 'TV', internalCategoryId: 'film-og-tv' },
  { providerId: '15', name: 'Videospill', internalCategoryId: 'gaming' },
  { providerId: '16', name: 'Brettspill', internalCategoryId: 'brettspill' },
  { providerId: '17', name: 'Vitenskap og natur', internalCategoryId: 'vitenskap' },
  { providerId: '18', name: 'Datamaskiner', internalCategoryId: 'datamaskiner' },
  { providerId: '19', name: 'Matematikk', internalCategoryId: 'matematikk' },
  { providerId: '20', name: 'Mytologi', internalCategoryId: 'mytologi' },
  { providerId: '21', name: 'Sport', internalCategoryId: 'sport' },
  { providerId: '22', name: 'Geografi', internalCategoryId: 'geografi' },
  { providerId: '23', name: 'Historie', internalCategoryId: 'historie' },
  { providerId: '24', name: 'Politikk', internalCategoryId: 'politikk' },
  { providerId: '25', name: 'Kunst', internalCategoryId: 'kunst' },
  { providerId: '26', name: 'Kjendiser', internalCategoryId: 'kjendiser' },
  { providerId: '27', name: 'Dyr', internalCategoryId: 'dyrearter' },
  { providerId: '28', name: 'Kjøretøy', internalCategoryId: 'kjoretoy' },
  { providerId: '29', name: 'Tegneserier', internalCategoryId: 'tegneserier' },
  { providerId: '30', name: 'Gadgets', internalCategoryId: 'oppfinnelser' },
  { providerId: '31', name: 'Japansk anime og manga', internalCategoryId: 'anime' },
  { providerId: '32', name: 'Tegnefilm og animasjon', internalCategoryId: 'film-og-tv' },
];

interface OpenTDBQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

function msSinceLastCall(): number {
  const lastCall = localStorage.getItem(LAST_CALL_KEY);
  if (!lastCall) return Number.POSITIVE_INFINITY;
  return Date.now() - parseInt(lastCall, 10);
}

function markCall(): void {
  localStorage.setItem(LAST_CALL_KEY, Date.now().toString());
}

/**
 * Konverter ett råspørsmål fra OpenTDB til internt format.
 * Eksportert for enhetstester.
 */
export function convertOtdbQuestion(q: OpenTDBQuestion): Question {
  const decode = (text: string) => decodeURIComponent(text);
  const correctText = decode(q.correct_answer);

  const correctChoice = { id: 'a', text: correctText };
  const incorrect = q.incorrect_answers.map((ans, i) => ({
    id: String.fromCharCode(98 + i), // b, c, d, ...
    text: decode(ans),
  }));
  const choices = fisherYates([correctChoice, ...incorrect]);
  const correctChoiceIds = [choices.find(c => c.text === correctText)?.id ?? 'a'];

  const difficulty = DIFFICULTY_MAP[q.difficulty] ?? 'middels';
  // Bruker engelsk kategorinavn i migreringen (MIGRATION_MAP dekker alle OpenTDB-navn).
  const categories = migrateCategories([q.category]);

  return {
    id: `otdb-${contentHash(decode(q.question))}`,
    text: decode(q.question),
    type: q.type === 'boolean' ? 'true_false' : 'multiple_choice',
    difficulty,
    categories,
    choices,
    correctChoiceIds,
  };
}

export const openTdbProvider: QuestionProvider = {
  id: 'opentdb',
  name: 'Open Trivia Database',
  description: 'Gratis API med 5000+ engelske spørsmål i 24 kategorier. Ingen API-nøkkel.',
  licenseNote: 'Open Trivia Database (opentdb.com)',
  rateLimit: { callsPerWindow: 1, windowMs: RATE_WINDOW_MS },
  categories: OPENTDB_CATEGORIES,

  msUntilReady(): number {
    const since = msSinceLastCall();
    if (!Number.isFinite(since)) return 0;
    return Math.max(0, RATE_WINDOW_MS - since);
  },

  async fetchQuestions(params: ProviderFetchParams): Promise<ProviderFetchResult> {
    const wait = this.msUntilReady();
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    const url = new URL(`${API_BASE}/api.php`);
    url.searchParams.set('amount', Math.min(Math.max(params.amount, 1), 50).toString());
    if (params.providerCategory) {
      url.searchParams.set('category', params.providerCategory);
    }
    if (params.difficulty) {
      url.searchParams.set('difficulty', DIFFICULTY_TO_API[params.difficulty]);
    }
    if (params.questionType) {
      url.searchParams.set('type', params.questionType);
    }
    url.searchParams.set('encode', 'url3986');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Nettverksfeil mot Open Trivia DB (HTTP ${response.status}).`);
    }
    const data: OpenTDBResponse = await response.json();
    markCall();

    switch (data.response_code) {
      case 0:
        break;
      case 1:
        throw new Error(
          'Ikke nok spørsmål tilgjengelig for disse kriteriene hos OpenTDB. Prøv færre spørsmål eller en annen kategori.'
        );
      case 2:
        throw new Error('Ugyldige parametere sendt til OpenTDB.');
      case 5:
        throw new Error('OpenTDB har nådd rate-limit. Vent 5 sekunder og prøv igjen.');
      default:
        throw new Error(`OpenTDB-feil (kode ${data.response_code}).`);
    }

    let hadInvalid = false;
    const questions = data.results.map(q => {
      try {
        return convertOtdbQuestion(q);
      } catch {
        hadInvalid = true;
        return null;
      }
    }).filter((q): q is Question => q !== null);

    return { questions, hadInvalid };
  },
};
