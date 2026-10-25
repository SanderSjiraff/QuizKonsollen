/**
 * Felles adapterstruktur for eksterne spørsmålsleverandører.
 * Alle adaptere returnerer samme interne Question-type, slik at resten av
 * systemet ikke bryr seg om kilden.
 */

import type { Question, Difficulty } from '../../types';

/** Parametre som alle leverandører må støtte (så langt API-et tillater). */
export interface ProviderFetchParams {
  /** Ønsket antall spørsmål (1–50). */
  amount: number;
  /** Leverandørens kategori-ID/navn. Utelatt = alle kategorier. */
  providerCategory?: string;
  /** Intern vanskelighetsgrad. Utelatt = alle. */
  difficulty?: Difficulty;
  /** 'multiple' = flervalg, 'boolean' = sant/usant. Utelatt = alle typer. */
  questionType?: 'multiple' | 'boolean';
  /** Emneknapper/tags fra leverandøren. Utelatt = alle. */
  tags?: string[];
}

/** En kategori hos leverandøren, mappet til intern kategori. */
export interface ProviderCategory {
  /** Leverandørens ID/navn (brukes i forespørsel). */
  providerId: string;
  /** Leverandørens visningsnavn. */
  name: string;
  /** Intern kategori-ID spørsmålene tildeles. */
  internalCategoryId: string;
}

/** Resultat fra en henting. */
export interface ProviderFetchResult {
  /** Konverterte spørsmål i internt format, med stabile IDer. */
  questions: Question[];
  /** true hvis noen spørsmål ble avvist under normalisering. */
  hadInvalid: boolean;
}

export interface QuestionProvider {
  /** Kort, stabil ID, f.eks. 'opentdb'. */
  readonly id: string;
  /** Visningsnavn. */
  readonly name: string;
  /** Kort beskrivelse til UI. */
  readonly description: string;
  /** Kildehenvisning/lisens som vises ved lagring. */
  readonly licenseNote: string;
  /** Antall kall tillatt per rate-limit-vindu. */
  readonly rateLimit: { callsPerWindow: number; windowMs: number };
  /** Alle kategorier hos leverandøren, mappet til interne kategorier. */
  readonly categories: ProviderCategory[];
  /** Millisekunder til neste lovlige kall (0 hvis mulig nå). */
  msUntilReady(): number;
  /** Hent og normaliser spørsmål. Kaster Error med norsk melding ved feil. */
  fetchQuestions(params: ProviderFetchParams): Promise<ProviderFetchResult>;
}

/** Skyfle svaralternativer uniformt (Fisher–Yates). */
export function shuffleChoices<T>(choices: T[]): T[] {
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Norsk navn på vanskelighetsgrad. */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lett: 'Lett',
  middels: 'Middels',
  vanskelig: 'Vanskelig',
};
