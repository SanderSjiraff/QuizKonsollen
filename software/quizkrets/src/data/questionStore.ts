/**
 * Felles spørsmålsbank – ÉN datakilde for hele systemet.
 *
 * Alle spørsmål (innebygde eksempler, Open Trivia DB, filimport og manuelt
 * opprettede) lagres her og brukes overalt: spillmotor, quizbygger,
 * spørsmålsbank-UI og statistikk.
 *
 * Vedlikeholdsstrategi (dokumentert beslutning):
 * - Kortsiktig: localStorage. Dagens datamengde (typisk < 2000 spørsmål ≈
 *   1–2 MB) er godt innenfor localStorage-grensen (~5 MB). Enkelt, synkront
 *   API som passer React-state godt, og fungerer offline fra dag én.
 * - Lang sikt: Når spørsmålsbanken vokser (ti-tusenvis) eller QuizKrets
 *   flyttes til Raspberry Pi, byttes persistenslaget til SQLite via en lokal
 *   backend. Dette lagets API er smalt og synkront, så utskiftningen blir
 *   begrenset til denne filen.
 * - IndexedDB ble vurdert, men valgt bort: asynkront API gir kompleksitet i
 *   hele UI-laget uten praktisk gevinst på dagens datamengde.
 */

import type { Question } from '../types';
import { migrateCategories, UNRESOLVED_CATEGORY } from '../core/categories';
import { QUESTIONS } from './mockData';

export type QuestionSource = 'seed' | 'opentdb' | 'trivia-api' | 'import' | 'manual';

export interface StoredQuestion extends Question {
  source: QuestionSource;
  /** Fritekst om opprinnelse, f.eks. 'Open Trivia DB' eller filnavn. */
  sourceRef?: string;
  createdAt: string;
  updatedAt: string;
  /** True hvis kategorien ikke kunne migreres sikkert og må kvalitetssikres. */
  needsReview?: boolean;
  /** Opprinnelige tags fra leverandøren (The Trivia API e.l.) */
  providerTags?: string[];
  /** Leverandørens kategori-ID. */
  providerCategory?: string;
  /** Leverandørens spørsmåls-ID. */
  providerQuestionId?: string;
}

const BANK_KEY = 'quizkrets_question_bank_v1';
const MIGRATED_KEY = 'quizkrets_question_bank_migrated_v1';
export const MAX_QUESTIONS = 5000;

/** Gamle lagringsnøkler som migreres inn i banken. */
const LEGACY_KEYS = {
  otdbCache: 'quizkrets_otdb_cache',
  imported: 'quizkrets_imported_questions',
  usedIds: 'quizkrets_used_question_ids',
};

// ---------------------------------------------------------------------------
// Stabil ID og duplikatsjekk
// ---------------------------------------------------------------------------

/** Normaliser tekst for duplikatsammenligning: små bokstaver, tegn → mellomrom, kollapset whitespace. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim();
}

/** FNV-1a hash (32-bit, hex) – stabil innholdsbasert ID uten Date.now(). */
export function contentHash(text: string): string {
  const normalized = normalizeText(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // Force 32-bit unsigned
  }
  return hash.toString(16).padStart(8, '0');
}

/** Stabil ID for spørsmål uten opprinnelig kilde-ID. */
export function stableQuestionId(source: QuestionSource, text: string): string {
  return `${source}-${contentHash(text)}`;
}

// ---------------------------------------------------------------------------
// Persistens
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Korrupt data-håndtering
// ---------------------------------------------------------------------------

/** Resultat fra forsøk på å lese banken. */
export interface ReadBankResult {
  /** 'ok' = gyldig data, 'empty' = ingen data, 'corrupt' = ugyldig JSON/struktur */
  status: 'ok' | 'empty' | 'corrupt';
  data: StoredQuestion[];
  /** Rå data som ikke kunne parses (for feilsøking/gjenoppretting). */
  rawData?: string;
  /** Feilmelding ved korrupt data. */
  error?: string;
}

/**
 * Les bank fra localStorage med tydelig skille mellom:
 * - Ingen eksisterende data (status: 'empty')
 * - Gyldig tom bank (status: 'ok', data: [])
 * - Korrupte data (status: 'corrupt') – IKKE erstatt med tom bank
 */
function readBankWithStatus(): ReadBankResult {
  try {
    const data = localStorage.getItem(BANK_KEY);
    if (!data) {
      return { status: 'empty', data: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch (parseError) {
      return {
        status: 'corrupt',
        data: [],
        rawData: data,
        error: `Ugyldig JSON i spørsmålsbanken: ${(parseError as Error).message}`,
      };
    }

    if (!Array.isArray(parsed)) {
      return {
        status: 'corrupt',
        data: [],
        rawData: data,
        error: 'Spørsmålsbanken inneholder ikke en gyldig array.',
      };
    }

    // Gyldig data – kan være tom array eller array med spørsmål
    return { status: 'ok', data: parsed as StoredQuestion[] };
  } catch (accessError) {
    // Feil ved tilgang til localStorage (f.eks. disk full, sikkerhetsbegrensning)
    return {
      status: 'corrupt',
      data: [],
      error: `Kunne ikke lese localStorage: ${(accessError as Error).message}`,
    };
  }
}

function readBank(): StoredQuestion[] {
  const result = readBankWithStatus();
  if (result.status === 'corrupt') {
    // Logg feilen men IKKE erstatt eksisterende data med tom bank.
    // Kaster tydelig feil slik at kalleren kan tilby eksport/gjenoppretting.
    console.error('Korrupt spørsmålsbank oppdaget:', result.error);
    throw new StorageError(
      `${result.error} \n\n` +
        `Eksisterende spørsmål er bevart i localStorage, men kan ikke leses automatisk. ` +
        `Bruk nettleserens utviklerverktøy (F12 → Application → Local Storage) ` +
        `for å kopiere rådata fra nøkkelen "${BANK_KEY}" som backup. ` +
        `Rett feilen i JSON-strukturen, eller rydd lagringen og gjenopprett fra en eksportert backup.`
    );
  }
  return result.data;
}

/**
 * Feil fra persistenslaget. Kastes når en lagring IKKE kunne gjennomføres.
 *
 * Viktig garanti (P0): Eksisterende lagrede data er ALLTID uendret når denne
 * feilen kastes – questionStore sletter eller overskriver aldri data ved
 * lagringsfeil. Brukeren får feilmeldingen og kan eksportere banken selv.
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

function writeBank(bank: StoredQuestion[]): void {
  if (bank.length > MAX_QUESTIONS) {
    throw new StorageError(
      `Spørsmålsbanken er full (${bank.length} av ${MAX_QUESTIONS} spørsmål). ` +
      `Nye spørsmål kan ikke legges til uten å overskride kapasitetsgrensen. ` +
      `Eksporter spørsmålsbanken (Spørsmålsbank → Eksporter), rydd opp i ubrukte eller dupliserte spørsmål, og prøv igjen.`
    );
  }

  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(bank));
  } catch (error) {
    const e = error as Error;
    const isQuota = e.name === 'QuotaExceededError' || /quota|storage/i.test(e.message);
    // ALDRI automatisk sletting: hvis lagringen feiler, er det gamle
    // innholdet i localStorage fortsatt intakt og uendret. Kast tydelig
    // feil med instruks om eksport, slik at brukeren selv kan sikre dataene.
    throw new StorageError(
      isQuota
        ? 'Lagringskvoten er full – endringen ble ikke lagret, og eksisterende spørsmål er uendret. Eksporter spørsmålsbanken (Spørsmålsbank → Eksporter), rydd opp i nettleserens lagring, og prøv igjen.'
        : `Uventet lagringsfeil – endringen ble ikke lagret, og eksisterende spørsmål er uendret. Eksporter spørsmålsbanken som backup. (${e.message})`
    );
  }
}

/**
 * Verifiser at alle spørsmål faktisk er lagret i localStorage.
 * Migreringen markeres aldri som fullført uten denne verifikasjonen.
 */
function verifyPersisted(expected: StoredQuestion[]): void {
  const stored = readBank();
  if (stored.length !== expected.length) {
    throw new StorageError(
      `Lagringskontroll feilet: forventet ${expected.length} spørsmål, men fant ${stored.length} lagret.`
    );
  }
  const storedIds = new Set(stored.map(q => q.id));
  const missing = expected.filter(q => !storedIds.has(q.id));
  if (missing.length > 0) {
    throw new StorageError(
      `Lagringskontroll feilet: ${missing.length} av ${expected.length} spørsmål kunne ikke verifiseres lagret.`
    );
  }
}

/**
 * Initialiser banken: kjør engangs-migrering av gamle datakilder.
 * Idempotent – trygg å kalle fra alle moduler ved oppstart.
 * Migreringsflagget sjekkes i localStorage direkte (billig), slik at også
 * nullstilt lagring (f.eks. i tester) håndteres riktig.
 */
export function initQuestionBank(): void {
  let bank = readBank();

  if (localStorage.getItem(MIGRATED_KEY) !== 'done') {
    try {
      const now = new Date().toISOString();

      // 1. Innebygde eksempelspørsmål (bevarer originale IDer som q1, q2, ...)
      const existingIds = new Set(bank.map(q => q.id));
      const seedQuestions: StoredQuestion[] = QUESTIONS.map(q => {
        const categories = migrateCategories(q.categories);
        return {
          ...q,
          categories,
          source: 'seed' as const,
          sourceRef: 'Innebygde spørsmål',
          createdAt: now,
          updatedAt: now,
          needsReview: categories.includes(UNRESOLVED_CATEGORY),
        };
      }).filter(q => !existingIds.has(q.id));

      // 2. Gammel OTDB-cache → nye stabile IDer
      const legacyOtdb = readLegacyQuestions(LEGACY_KEYS.otdbCache, 'opentdb', 'Open Trivia DB');

      // 3. Gammel importert-liste → nye stabile IDer
      const legacyImported = readLegacyQuestions(LEGACY_KEYS.imported, 'import', 'Filimport (gammel)');

      bank = [...seedQuestions, ...legacyOtdb, ...legacyImported, ...bank.filter(q => q.source !== 'seed' || existingIds.has(q.id))];
      bank = dedupeByIdAndText(bank);
      writeBank(bank);
      // Migreringen markeres ALDRI som fullført før alle data er verifisert
      // faktisk lagret i localStorage (P0-krav).
      verifyPersisted(bank);

      // Rydd opp gamle nøkler (bevarer dem ikke lenger – banken er nå kilden
      // og lagringen er verifisert)
      localStorage.removeItem(LEGACY_KEYS.otdbCache);
      localStorage.removeItem(LEGACY_KEYS.imported);

      // Behold brukte-IDer som fortsatt matcher banken (f.eks. q1–q50);
      // ustabile gamle otdb-IDer kan uansett ikke matches og fjernes.
      cleanupUsedIds(bank);

      localStorage.setItem(MIGRATED_KEY, 'done');
    } catch (error) {
      // Migreringen kan ikke fullføres (typisk full lagringskvote).
      // Kravsikkerhet (P0): ALDRI krasj ved oppstart og ALDRI slett data –
      // eksisterende bank er uendret, og migreringen prøves igjen neste
      // oppstart. Brukeren kan fortsatt lese og eksportere banken.
      console.warn(
        'Migrering av spørsmålsbanken er utsatt – eksisterende data er uendret:',
        (error as Error).message
      );
    }
  }
}

/** Les og migrer en gammel localStorage-nøkkel med spørsmål. */
function readLegacyQuestions(
  key: string,
  source: QuestionSource,
  sourceRef: string
): StoredQuestion[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    const now = new Date().toISOString();

    return parsed
      .filter((q): q is Question => isValidShape(q))
      .map(q => {
        const categories = migrateCategories(q.categories ?? []);
        return {
          ...q,
          id: stableQuestionId(source, q.text),
          categories,
          source,
          sourceRef,
          createdAt: now,
          updatedAt: now,
          needsReview: categories.includes(UNRESOLVED_CATEGORY),
        } as StoredQuestion;
      });
  } catch {
    return [];
  }
}

/** Minimal form-sjekk for arvet data. */
function isValidShape(q: unknown): q is Question {
  if (typeof q !== 'object' || q === null) return false;
  const o = q as Partial<Question>;
  return typeof o.id !== 'undefined' && typeof o.text === 'string' && Array.isArray(o.choices);
}

/** Fjern duplikater: samme ID eller samme normaliserte tekst beholdes én gang (første forekomst vinner). */
function dedupeByIdAndText(bank: StoredQuestion[]): StoredQuestion[] {
  const byId = new Set<string>();
  const byText = new Set<string>();
  const result: StoredQuestion[] = [];
  for (const q of bank) {
    const textKey = normalizeText(q.text);
    if (byId.has(q.id) || byText.has(textKey)) continue;
    byId.add(q.id);
    byText.add(textKey);
    result.push(q);
  }
  return result;
}

/** Behold kun brukte-IDer som finnes i banken. */
function cleanupUsedIds(bank: StoredQuestion[]): void {
  try {
    const data = localStorage.getItem(LEGACY_KEYS.usedIds);
    if (!data) return;
    const used = new Set<string>(JSON.parse(data));
    const validIds = new Set(bank.map(q => q.id));
    const kept = [...used].filter(id => validIds.has(id));
    localStorage.setItem(LEGACY_KEYS.usedIds, JSON.stringify(kept));
  } catch {
    // Ignorer – brukt-IDer er kun en optimalisering
  }
}

// ---------------------------------------------------------------------------
// Offentlig API
// ---------------------------------------------------------------------------

/** Alle spørsmål i banken (uavhengig av kilde). */
export function getAllQuestions(): StoredQuestion[] {
  initQuestionBank();
  return readBank();
}

/** Bare selve Question-delen (til spillmotoren som ikke bryr seg om metadata). */
export function getQuestions(): Question[] {
  return getAllQuestions().map(({ source: _s, sourceRef: _r, createdAt: _c, updatedAt: _u, needsReview: _n, ...q }) => q);
}

export interface AddResult {
  added: number;
  duplicates: number;
  /** Spørsmål som ble avvist på grunn av kapasitetsgrensen. */
  capacityRejected: number;
  /** Spørsmål som ble avvist (allerede finnes eller ugyldig). */
  rejectedQuestions: Question[];
}

/** Generer en unik ID når den opprinnelige kolliderer med eksisterende spørsmål. */
function makeUniqueId(baseId: string, existingIds: Set<string>, batchIds: Set<string>): string {
  let counter = 1;
  let candidateId = `${baseId}-${counter}`;
  while (existingIds.has(candidateId) || batchIds.has(candidateId)) {
    counter++;
    candidateId = `${baseId}-${counter}`;
  }
  return candidateId;
}

/**
 * Legg til spørsmål i banken.
 * - Duplikater (samme normaliserte tekst) avvises.
 * - ID-kollisjoner håndteres: samme tekst = duplikat, ulik tekst = ny unik ID.
 * - Kapasitetsgrensen overholdes: import som ville overskride avvises med tydelig feil.
 * Returnerer detaljert resultat med antall lagt til, duplikater og kapasitetsavvisninger.
 */
export function addQuestions(
  questions: Question[],
  source: QuestionSource,
  sourceRef?: string
): AddResult {
  initQuestionBank();
  const bank = readBank();

  // A1: Avvis import som ville overskride kapasitetsgrensen
  if (bank.length + questions.length > MAX_QUESTIONS) {
    throw new StorageError(
      `Import avvist: ${bank.length} spørsmål finnes allerede i banken (maks ${MAX_QUESTIONS}). ` +
        `${questions.length} nye spørsmål ville overskride kapasitetsgrensen med ${bank.length + questions.length - MAX_QUESTIONS} spørsmål. ` +
        `Eksporter spørsmålsbanken (Spørsmålsbank → Eksporter), slett uønskede spørsmål, og prøv igjen.`
    );
  }

  const existingTexts = new Set(bank.map(q => normalizeText(q.text)));
  const existingIds = new Set(bank.map(q => q.id));
  const now = new Date().toISOString();
  const added: StoredQuestion[] = [];
  const rejected: Question[] = [];
  const batchIds = new Set<string>();

  for (const q of questions) {
    const textKey = normalizeText(q.text);
    if (existingTexts.has(textKey)) {
      rejected.push(q);
      continue;
    }

    // A2: Håndter ID-kollisjoner konsistent
    let finalId = q.id && q.id !== '' ? q.id : stableQuestionId(source, q.text);

    // Sjekk om IDen allerede finnes i banken med ANNEN tekst
    const existingWithId = bank.find(bq => bq.id === finalId);
    if (existingWithId) {
      if (normalizeText(existingWithId.text) === textKey) {
        // Samme ID + samme tekst = duplikat (defensivt, burde ha vært fanget over)
        rejected.push(q);
        continue;
      }
      // Samme ID + ulik tekst = kollisjon → generer unik ID
      finalId = makeUniqueId(finalId, existingIds, batchIds);
    }

    // Sjekk kollisjon innen samme importbatch
    if (batchIds.has(finalId)) {
      finalId = makeUniqueId(finalId, existingIds, batchIds);
    }

    existingTexts.add(textKey);
    existingIds.add(finalId);
    batchIds.add(finalId);

    const categories = migrateCategories(q.categories ?? []);
    added.push({
      ...q,
      id: finalId,
      categories,
      source,
      sourceRef,
      createdAt: now,
      updatedAt: now,
      needsReview: categories.includes(UNRESOLVED_CATEGORY),
    });
  }

  if (added.length > 0) {
    writeBank([...bank, ...added]);
  }
  return {
    added: added.length,
    duplicates: rejected.length,
    capacityRejected: 0,
    rejectedQuestions: rejected,
  };
}

/** Oppdater ett spørsmål. Returnerer false hvis ID ikke finnes. */
export function updateQuestion(
  id: string,
  updates: Partial<Omit<Question, 'id'>>
): boolean {
  initQuestionBank();
  const bank = readBank();
  const index = bank.findIndex(q => q.id === id);
  if (index === -1) return false;

  const merged = { ...bank[index], ...updates, updatedAt: new Date().toISOString() };
  if (updates.categories) {
    const migrated = migrateCategories(updates.categories);
    merged.categories = migrated;
    merged.needsReview = migrated.includes(UNRESOLVED_CATEGORY);
  }
  bank[index] = merged;
  writeBank(bank);
  return true;
}

/** Slett ett spørsmål. */
export function deleteQuestion(id: string): boolean {
  initQuestionBank();
  const bank = readBank();
  const filtered = bank.filter(q => q.id !== id);
  if (filtered.length === bank.length) return false;
  writeBank(filtered);
  return true;
}

/** Finn duplikater av en spørsmålstekst (brukes i redigeringsdialog). */
export function findDuplicateByText(text: string, excludeId?: string): StoredQuestion | undefined {
  const textKey = normalizeText(text);
  return getAllQuestions().find(q => q.id !== excludeId && normalizeText(q.text) === textKey);
}

export interface BankStats {
  total: number;
  bySource: Record<QuestionSource, number>;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  needsReview: number;
}

/** Statistikk over banken – til UI og tilgjengelighetsvisning. */
export function getBankStats(): BankStats {
  const bank = getAllQuestions();
  const stats: BankStats = {
    total: bank.length,
    bySource: { seed: 0, opentdb: 0, 'trivia-api': 0, import: 0, manual: 0 },
    byCategory: {},
    byDifficulty: {},
    needsReview: 0,
  };
  for (const q of bank) {
    stats.bySource[q.source] = (stats.bySource[q.source] ?? 0) + 1;
    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] ?? 0) + 1;
    for (const c of q.categories) {
      stats.byCategory[c] = (stats.byCategory[c] ?? 0) + 1;
    }
    if (q.needsReview) stats.needsReview += 1;
  }
  return stats;
}

/** Spørsmål merket for gjennomgang (ukjent kategori etter migrering). */
export function getQuestionsNeedingReview(): StoredQuestion[] {
  return getAllQuestions().filter(q => q.needsReview === true);
}

/** Slett alle spørsmål fra én kilde (f.eks. tøm OTDB-spørsmål). */
export function deleteBySource(source: QuestionSource): number {
  initQuestionBank();
  const bank = readBank();
  const kept = bank.filter(q => q.source !== source);
  writeBank(kept);
  return bank.length - kept.length;
}

/**
 * Eksporter hele banken som JSON (backup/overføring mellom enheter).
 */
export function exportBank(): string {
  return JSON.stringify(getAllQuestions(), null, 2);
}
