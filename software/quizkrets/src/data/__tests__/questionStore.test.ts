import { beforeEach, describe, it, expect } from 'vitest';

/** Minimal localStorage-implementasjon for node-miljø. */
class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const storage = new LocalStorageMock();
(globalThis as Record<string, unknown>).localStorage = storage;

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
