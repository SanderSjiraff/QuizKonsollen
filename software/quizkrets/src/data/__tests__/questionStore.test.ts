import { beforeEach, describe, it, expect } from 'vitest';

/** Minimal localStorage-implementasjon for node-miljø. */
class LocalStorageMock {
  private store = new Map<string, string>();
  /** Feil som kastes fra setItem (én gang eller alle videre kall). */
  private failError: Error | null = null;
  private failAll = false;
  /** Simuler delvis lagring: neste array-skrivning beholder kun N elementer. */
  private truncateNext: number | null = null;

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failError) {
      const err = this.failError;
      if (!this.failAll) this.failError = null;
      throw err;
    }
    let v = String(value);
    if (this.truncateNext !== null) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) v = JSON.stringify(parsed.slice(0, this.truncateNext));
      } catch {
        // Ikke en JSON-array – skriv uendret
      }
      this.truncateNext = null;
    }
    this.store.set(key, v);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
    this.failError = null;
    this.failAll = false;
    this.truncateNext = null;
  }

  /** Få neste setItem til å kaste (f.eks. QuotaExceededError). */
  failNextSet(error: Error): void {
    this.failError = error;
    this.failAll = false;
  }
  /** Få ALLE videre setItem til å kaste (full kvote). */
  failAllSets(error: Error): void {
    this.failError = error;
    this.failAll = true;
  }
  /** Simuler at neste array-skrivning mister alt etter de N første elementene. */
  truncateNextArrayWrite(n: number): void {
    this.truncateNext = n;
  }
}

const storage = new LocalStorageMock();
(globalThis as Record<string, unknown>).localStorage = storage;

/** Simulert QuotaExceededError slik nettleseren kaster den. */
function quotaError(): Error {
  const e = new Error('QuotaExceededError: The quota has been exceeded.');
  e.name = 'QuotaExceededError';
  return e;
}

import {
  getAllQuestions,
  addQuestions,
  updateQuestion,
  deleteQuestion,
  findDuplicateByText,
  getBankStats,
  normalizeText,
  contentHash,
  getQuestionsNeedingReview,
  initQuestionBank,
  StorageError,
  type StoredQuestion,
} from '../questionStore';
import type { Question } from '../../types';

function makeQuestion(id: string, text: string, categories: string[] = ['sport']): Question {
  return {
    id,
    text,
    type: 'multiple_choice',
    difficulty: 'lett',
    categories,
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ],
    correctChoiceIds: ['a'],
  };
}

beforeEach(() => {
  storage.clear();
  initQuestionBank();
});

describe('questionStore', () => {
  it('initialiserer med innebygde spørsmål', () => {
    const all = getAllQuestions();
    expect(all.length).toBeGreaterThan(20);
    expect(all.every(q => q.source === 'seed' || q.source !== undefined)).toBe(true);
  });

  it('migrerer gamle kategorinavn i frødata', () => {
    const all = getAllQuestions();
    const categories = new Set(all.flatMap(q => q.categories));
    // Gammelt navn skal ikke forekomme etter migrering
    expect(categories.has('naturvitenskap')).toBe(false);
    expect(categories.has('vitenskap')).toBe(true);
  });

  it('legger til spørsmål og teller duplikater', () => {
    const q1 = makeQuestion('x1', 'Hva er 2+2?');
    const result1 = addQuestions([q1], 'manual');
    expect(result1.added).toBe(1);

    // Samme tekst med annen ID/tegnsetting = duplikat
    const q2 = makeQuestion('x2', 'Hva er 2+2 ?');
    const result2 = addQuestions([q2], 'manual');
    expect(result2.added).toBe(0);
    expect(result2.duplicates).toBe(1);
  });

  it('duplikatsjekken ignorerer store/små bokstaver og tegnsetting', () => {
    expect(normalizeText('Hva er 2+2?')).toBe(normalizeText('hva er 2 2'));
    // Innholdshash er stabil for samme normaliserte tekst
    expect(contentHash('Hva er 2+2?')).toBe(contentHash('hva er 2 2'));
    expect(contentHash('Hva er 2+2?')).not.toBe(contentHash('Hva er 3+3?'));
  });

  it('oppdaterer spørsmål', () => {
    addQuestions([makeQuestion('x1', 'Original tekst')], 'manual');
    const ok = updateQuestion('x1', { difficulty: 'vanskelig', text: 'Ny tekst' });
    expect(ok).toBe(true);
    const updated = getAllQuestions().find(q => q.id === 'x1');
    expect(updated?.difficulty).toBe('vanskelig');
    expect(updated?.text).toBe('Ny tekst');
  });

  it('avviser oppdatering av ukjent ID', () => {
    expect(updateQuestion('finnes-ikke', { text: 'x' })).toBe(false);
  });

  it('sletter spørsmål', () => {
    addQuestions([makeQuestion('x1', 'Slett meg')], 'manual');
    expect(deleteQuestion('x1')).toBe(true);
    expect(getAllQuestions().find(q => q.id === 'x1')).toBeUndefined();
    expect(deleteQuestion('x1')).toBe(false);
  });

  it('finner duplikat på tekst', () => {
    addQuestions([makeQuestion('x1', 'Unik tekst her')], 'manual');
    const dup = findDuplicateByText('unik TEKST her!');
    expect(dup?.id).toBe('x1');
    // Ekskluderer seg selv
    expect(findDuplicateByText('Unik tekst her', 'x1')).toBeUndefined();
  });

  it('kategoriserer og merker ukjente kategorier for gjennomgang', () => {
    addQuestions([makeQuestion('x1', 'Ukjent kategoritest', ['veldig-ukjent-kategori'])], 'manual');
    const stored = getAllQuestions().find(q => q.id === 'x1') as StoredQuestion;
    expect(stored.needsReview).toBe(true);
    expect(stored.categories).toContain('til-gjennomgang');
    expect(getQuestionsNeedingReview().length).toBeGreaterThan(0);
  });

  it('statistikken summerer riktig', () => {
    const before = getBankStats().total;
    addQuestions([makeQuestion('x1', 'Statistikkspørsmål')], 'manual');
    const stats = getBankStats();
    expect(stats.total).toBe(before + 1);
    expect(stats.bySource.manual).toBe(1);
    expect(stats.byCategory.sport).toBeGreaterThan(0);
  });

  it('migrerer gammel OTDB-cache med nye stabile IDer', () => {
    // Simuler gammel cache-format
    storage.clear();
    const legacyQuestion = {
      id: 'otdb-1234567890-0',
      text: 'Legacy cached question',
      type: 'multiple_choice',
      difficulty: 'lett',
      categories: ['videospill'],
      choices: [
        { id: 'a', text: 'Ja' },
        { id: 'b', text: 'Nei' },
      ],
      correctChoiceIds: ['a'],
    };
    storage.setItem('quizkrets_otdb_cache', JSON.stringify([legacyQuestion]));

    initQuestionBank();

    const all = getAllQuestions();
    const migrated = all.find(q => q.text === 'Legacy cached question');
    expect(migrated).toBeDefined();
    expect(migrated!.source).toBe('opentdb');
    expect(migrated!.id).toMatch(/^opentdb-/);
    // Gammel kategori migrert
    expect(migrated!.categories).toContain('gaming');
    // og underkategori gir automatisk hovedkategori
    expect(migrated!.categories).toContain('underholdning');
  });
});

describe('Lagringssikkerhet (P0): aldri automatisk sletting ved feil', () => {
  const BANK_KEY = 'quizkrets_question_bank_v1';
  const MIGRATED_KEY = 'quizkrets_question_bank_migrated_v1';
  const LEGACY_KEY = 'quizkrets_imported_questions';

  it('bevarer eksisterende bank urørt ved kvotefeil og kaster tydelig StorageError', () => {
    addQuestions([makeQuestion('q-behold', 'Tekst som må overleve')], 'manual');
    const bankFør = storage.getItem(BANK_KEY);

    storage.failNextSet(quotaError());
    expect(() => addQuestions([makeQuestion('q-ny', 'Nytt spørsmål')], 'manual')).toThrow(
      StorageError
    );

    // Ingen automatisk sletting: banken er byte-identisk med før feilen.
    expect(storage.getItem(BANK_KEY)).toBe(bankFør);
  });

  it('feilmeldingen sier at data er uendret og peker på eksport', () => {
    storage.failNextSet(quotaError());
    let message = '';
    try {
      addQuestions([makeQuestion('q-ny', 'Nytt spørsmål')], 'manual');
      expect.unreachable('addQuestions skulle kastet StorageError');
    } catch (e) {
      expect(e).toBeInstanceOf(StorageError);
      message = (e as Error).message;
    }
    expect(message).toMatch(/ikke lagret/i);
    expect(message).toMatch(/eksisterende spørsmål er uendret/i);
    expect(message).toMatch(/eksport/i);
  });

  it('oppdatering og sletting kaster ved kvotefeil uten å endre data', () => {
    addQuestions([makeQuestion('q1', 'Opprinnelig tekst')], 'manual');
    const bankFør = storage.getItem(BANK_KEY);

    storage.failNextSet(quotaError());
    expect(() => updateQuestion('q1', { text: 'Endret tekst' })).toThrow(StorageError);

    storage.failNextSet(quotaError());
    expect(() => deleteQuestion('q1')).toThrow(StorageError);

    expect(storage.getItem(BANK_KEY)).toBe(bankFør);
    // Opprinnelig tekst er fortsatt i banken
    expect(getAllQuestions().some(q => q.id === 'q1' && q.text === 'Opprinnelig tekst')).toBe(true);
  });

  it('migrering ved full kvote: krasjer ikke, flagg settes IKKE, legacy og bank bevares', () => {
    // Nullstill til umigrert tilstand med eksisterende bank + legacy-data
    storage.clear();
    const eksisterende = {
      ...makeQuestion('eksisterende-1', 'Eksisterende bankspørsmål'),
      source: 'manual',
      sourceRef: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const legacy = makeQuestion('legacy-1', 'Legacy importspørsmål');
    storage.setItem(BANK_KEY, JSON.stringify([eksisterende]));
    storage.setItem(LEGACY_KEY, JSON.stringify([legacy]));

    // Full kvote: alle skrivinger feiler
    storage.failAllSets(quotaError());

    // Oppstart må ikke krasje selv om migreringen ikke kan fullføres –
    // ellers får brukeren aldri eksportert dataene sine.
    expect(() => initQuestionBank()).not.toThrow();

    // Migreringen er IKKE markert som fullført (prøves igjen neste oppstart)
    expect(storage.getItem(MIGRATED_KEY)).toBeNull();
    // Legacy-nøkkelen er fortsatt intakt (ingen opprydding før verifisert lagring)
    expect(JSON.parse(storage.getItem(LEGACY_KEY)!)).toHaveLength(1);
    // Eksisterende bank er urørt
    const bankEtter = JSON.parse(storage.getItem(BANK_KEY)!);
    expect(bankEtter).toHaveLength(1);
    expect(bankEtter[0].text).toBe('Eksisterende bankspørsmål');
  });

  it('migrering markeres ikke som fullført før alle data er verifisert lagret', () => {
    storage.clear();
    const legacy1 = makeQuestion('legacy-1', 'Legacy nummer én');
    const legacy2 = makeQuestion('legacy-2', 'Legacy nummer to');
    storage.setItem(LEGACY_KEY, JSON.stringify([legacy1, legacy2]));

    // Simuler delvis lagring: neste array-skrivning mister data
    storage.truncateNextArrayWrite(1);

    initQuestionBank();

    // Flagget skal IKKE være satt når lagringen ikke kunne verifiseres
    expect(storage.getItem(MIGRATED_KEY)).toBeNull();
  });

  it('normal migrering fullføres og flagg settes', () => {
    storage.clear();
    const legacy = makeQuestion('legacy-ok', 'Legacy som skal migreres');
    storage.setItem(LEGACY_KEY, JSON.stringify([legacy]));

    initQuestionBank();

    expect(storage.getItem(MIGRATED_KEY)).toBe('done');
    // Legacy-data er kommet inn i banken
    expect(getAllQuestions().some(q => q.text === 'Legacy som skal migreres')).toBe(true);
    // Legacy-nøkkelen er ryddet bort etter verifisert lagring
    expect(storage.getItem(LEGACY_KEY)).toBeNull();
  });
});
