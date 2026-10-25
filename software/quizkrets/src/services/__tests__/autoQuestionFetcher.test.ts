import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { LocalStorageMock } = vi.hoisted(() => {
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
  return { LocalStorageMock };
});

(globalThis as Record<string, unknown>).localStorage = new LocalStorageMock();

import { AutoQuestionFetcher, type FetchCriteria } from '../autoQuestionFetcher';
import type { Question } from '../../types';
import type { ProviderFetchResult, ProviderFetchParams, QuestionProvider } from '../../data/adapters/types';

const BANK_KEY = 'quizkrets_question_bank_v1';
const MIGRATED_KEY = 'quizkrets_question_bank_migrated_v1';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: `q-${Math.random().toString(36).slice(2)}`,
    text: 'Test question?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['historie'],
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
    ],
    correctChoiceIds: ['a'],
    ...overrides,
  };
}

function seedBank(questions: Question[]) {
  localStorage.setItem(MIGRATED_KEY, 'done');
  localStorage.setItem(BANK_KEY, JSON.stringify(
    questions.map(q => ({
      ...q,
      source: 'seed',
      sourceRef: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  ));
}

function createMockProvider(id: string): {
  provider: QuestionProvider;
  mockFetch: ReturnType<typeof vi.fn<(...args: [ProviderFetchParams]) => Promise<ProviderFetchResult>>>;
  mockReady: ReturnType<typeof vi.fn<() => number>>;
} {
  const mockFetch = vi.fn<(...args: [ProviderFetchParams]) => Promise<ProviderFetchResult>>();
  const mockReady = vi.fn<() => number>().mockReturnValue(0);
  const provider: QuestionProvider = {
    id,
    name: id,
    licenseNote: id,
    description: 'Mock',
    rateLimit: { callsPerWindow: 10, windowMs: 5000 },
    categories: [
      { providerId: 'history', name: 'Historie', internalCategoryId: 'historie' },
      { providerId: 'general_knowledge', name: 'Generell kunnskap', internalCategoryId: 'generell-kunnskap' },
      { providerId: 'sport_and_leisure', name: 'Sport og fritid', internalCategoryId: 'sport' },
    ],
    msUntilReady: mockReady,
    fetchQuestions: mockFetch,
  };
  return { provider, mockFetch, mockReady };
}

describe('AutoQuestionFetcher', () => {
  let fetcher: AutoQuestionFetcher;
  let progressUpdates: any[];
  let mockOtdb: ReturnType<typeof createMockProvider>;
  let mockTrivia: ReturnType<typeof createMockProvider>;

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    mockOtdb = createMockProvider('opentdb');
    mockTrivia = createMockProvider('trivia-api');
    fetcher = new AutoQuestionFetcher([mockOtdb.provider, mockTrivia.provider]);
    progressUpdates = [];
    localStorage.clear();
  });

  afterEach(() => {
    fetcher.cancel();
  });

  function trackProgress() {
    return (p: any) => progressUpdates.push(p);
  }

  function createCriteria(overrides: Partial<FetchCriteria> = {}): FetchCriteria {
    return {
      categories: ['historie'],
      difficulties: ['middels'],
      count: 5,
      ...overrides,
    };
  }

  // ========================================================================
  // Kritiske fikser for v1.3.2 – customTheme mapping og lokal validering
  // ========================================================================

  describe('calculateMissing / canFulfillLocally med customTheme', () => {
    it('krever alltid fetching når customTheme er tag-basert (ingen intern mapping)', () => {
      seedBank([
        makeQuestion({ categories: ['generell-kunnskap'], difficulty: 'middels' }),
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 5, customTheme: 'Dinosaurer' });
      // Dinosaurer har ingen interne kategorier → ingen lokale spørsmål matcher
      expect(fetcher.calculateMissing(criteria)).toBe(5);
      expect(fetcher.canFulfillLocally(criteria)).toBe(false);
    });

    it('teller lokale spørsmål når customTheme matcher via subword eller migrasjon', () => {
      seedBank([
        makeQuestion({ categories: ['dyrearter'], difficulty: 'middels' }),
      ]);

      // 'dyr' mappes via MIGRATION_MAP -> 'dyrearter'
      const criteria = createCriteria({ count: 1, customTheme: 'dyr' });
      expect(fetcher.calculateMissing(criteria)).toBe(0);
      expect(fetcher.canFulfillLocally(criteria)).toBe(true);
    });

    it('teller også lokale spørsmål ved direkte kategoritreff', () => {
      seedBank([
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 1, customTheme: 'historie' });
      expect(fetcher.calculateMissing(criteria)).toBe(0);
      expect(fetcher.canFulfillLocally(criteria)).toBe(true);
    });

    it('fungerer som før uten customTheme', () => {
      seedBank([
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 2 });
      expect(fetcher.calculateMissing(criteria)).toBe(1);
      expect(fetcher.canFulfillLocally(criteria)).toBe(false);
    });
  });

  describe('customTheme / tags – korrekt API-mapping', () => {
    it('mapper "Dinosaurer" til korrekt ekstern tag (ikke rå brukerstreng)', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });
      mockTrivia.mockFetch.mockResolvedValue({ questions: [makeQuestion()], hadInvalid: false });

      const criteria = createCriteria({ count: 1, customTheme: 'Dinosaurer' });
      await fetcher.fetchMissing(criteria);

      expect(mockTrivia.mockFetch).toHaveBeenCalled();
      const callArg = mockTrivia.mockFetch.mock.calls[0][0];
      expect(callArg.tags).toContain('dinosaurs');
      expect(callArg.tags).not.toContain('Dinosaurer');
    });

    it('mapper "The Beatles" til tag "the_beatles"', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });
      mockTrivia.mockFetch.mockResolvedValue({ questions: [makeQuestion()], hadInvalid: false });

      const criteria = createCriteria({ count: 1, customTheme: 'The Beatles' });
      await fetcher.fetchMissing(criteria);

      const callArg = mockTrivia.mockFetch.mock.calls[0][0];
      expect(callArg.tags).toEqual(['the_beatles']);
    });

    it('setter tags=undefined for ukjent customTheme', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [makeQuestion()], hadInvalid: false });

      const criteria = createCriteria({ count: 1, customTheme: 'xyz-finnes-ikke' });
      await fetcher.fetchMissing(criteria);

      const callArg = mockOtdb.mockFetch.mock.calls[0][0];
      expect(callArg.tags).toBeUndefined();
    });

    it('mapper kategorien direkte når customTheme har intern treff (ingen tags)', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [makeQuestion()], hadInvalid: false });

      const criteria = createCriteria({ count: 1, customTheme: 'historie' });
      await fetcher.fetchMissing(criteria);

      // Når temaet mapper til en intern kategori, hentes via kategori-mapping
      // (ikke via tags). OpenTDB bør bli kallet med providerCategory='history'.
      expect(mockOtdb.mockFetch).toHaveBeenCalled();
      const callArg = mockOtdb.mockFetch.mock.calls[0][0];
      expect(callArg.providerCategory).toBe('history');
      expect(callArg.tags).toBeUndefined();
      expect(mockTrivia.mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchMissing – filtrering av hentede spørsmål', () => {
    it('beholder spørsmål hentet via customTheme (filtrert av API selv)', async () => {
      seedBank([]);
      // API returnerer et spørsmål i kategori 'dyrearter' (fra tag-mapping)
      const fetched = makeQuestion({ categories: ['dyrearter'], difficulty: 'middels' });
      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });
      mockTrivia.mockFetch.mockResolvedValue({ questions: [fetched], hadInvalid: false });

      const criteria = createCriteria({ count: 1, customTheme: 'Dinosaurer' });
      const result = await fetcher.fetchMissing(criteria);

      expect(result.success).toBe(true);
      expect(result.fetchedCount).toBeGreaterThan(0);
      expect(result.questions.some(q => q.categories.includes('dyrearter'))).toBe(true);
    });
  });

  // ========================================================================
  // Eksisterende tester (verifiserer at ikke-regresjonen holder)
  // ========================================================================

  describe('calculateMissing / canFulfillLocally', () => {
    it('returnerer 0 når localStorage har nok spørsmål', () => {
      seedBank([
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 2 });
      expect(fetcher.calculateMissing(criteria)).toBe(0);
      expect(fetcher.canFulfillLocally(criteria)).toBe(true);
    });

    it('returnerer manglende antall når det er for få', () => {
      seedBank([
        makeQuestion({ categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 5 });
      expect(fetcher.calculateMissing(criteria)).toBe(4);
      expect(fetcher.canFulfillLocally(criteria)).toBe(false);
    });

    it('respekterer exkluderte IDer', () => {
      seedBank([
        makeQuestion({ id: 'used-1', categories: ['historie'], difficulty: 'middels' }),
      ]);

      const criteria = createCriteria({ count: 1, excludeIds: ['used-1'] });
      expect(fetcher.calculateMissing(criteria)).toBe(1);
    });
  });

  describe('fetchMissing – lokalt tilstrekkelig', () => {
    it('returnerer bare lokale spørsmål uten nettverkskall', async () => {
      seedBank([
        makeQuestion({ categories: ['historie'], difficulty: 'middels', text: 'a' }),
        makeQuestion({ categories: ['historie'], difficulty: 'middels', text: 'b' }),
      ]);

      const criteria = createCriteria({ count: 2 });
      const result = await fetcher.fetchMissing(criteria, trackProgress());

      expect(mockOtdb.mockFetch).not.toHaveBeenCalled();
      expect(mockTrivia.mockFetch).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.totalReady).toBe(2);
      expect(result.fetchedCount).toBe(0);
      expect(progressUpdates.some(p => p.status === 'complete')).toBe(true);
    });
  });

  describe('fetchMissing – henter fra provider', () => {
    it('henter manglende spørsmål fra OpenTDB', async () => {
      seedBank([]);

      const fetchedQ1 = makeQuestion({ categories: ['historie'], difficulty: 'middels', text: 'fetched 1' });
      const fetchedQ2 = makeQuestion({ categories: ['historie'], difficulty: 'middels', text: 'fetched 2' });
      mockOtdb.mockFetch.mockResolvedValue({ questions: [fetchedQ1, fetchedQ2], hadInvalid: false });

      const criteria = createCriteria({ count: 2 });
      const result = await fetcher.fetchMissing(criteria, trackProgress());

      expect(mockOtdb.mockFetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('fallback til Trivia API når OpenTDB feiler', async () => {
      seedBank([]);

      mockOtdb.mockFetch.mockRejectedValue(new Error('OpenTDB-feil'));
      const fetchedQ = makeQuestion({ categories: ['historie'], difficulty: 'middels' });
      mockTrivia.mockFetch.mockResolvedValue({ questions: [fetchedQ, fetchedQ], hadInvalid: false });

      const criteria = createCriteria({ count: 2 });
      await fetcher.fetchMissing(criteria, trackProgress());

      expect(mockOtdb.mockFetch).toHaveBeenCalled();
      expect(mockTrivia.mockFetch).toHaveBeenCalled();
    });

    it('rapporterer insufficient hvis leverandørene ikke dekker behovet', async () => {
      seedBank([]);

      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });
      mockTrivia.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });

      const criteria = createCriteria({ count: 10 });
      const result = await fetcher.fetchMissing(criteria, trackProgress());

      expect(result.success).toBe(false);
      expect(result.totalReady).toBe(0);
      expect(progressUpdates.some(p => p.status === 'insufficient')).toBe(true);
    });
  });

  describe('cancel', () => {
    it('avbryter pågående henting', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 2000));
        return { questions: [], hadInvalid: false };
      });

      const criteria = createCriteria({ count: 5 });
      const promise = fetcher.fetchMissing(criteria);

      setTimeout(() => fetcher.cancel(), 50);

      const result = await promise;
      expect(result.errors.some(e => e.includes('Avbrutt'))).toBe(true);
    });
  });

  describe('debounce', () => {
    it('venter minst DEBOUNCE_MS før henting', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });

      const start = Date.now();
      const criteria = createCriteria({ count: 1 });
      await fetcher.fetchMissing(criteria);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(450); // ~500 ms debounce
    });
  });

  describe('rate limit', () => {
    it('venter til provider er klar', async () => {
      seedBank([]);
      mockOtdb.mockReady.mockReturnValue(50);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [], hadInvalid: false });

      const start = Date.now();
      const criteria = createCriteria({ count: 1 });
      await fetcher.fetchMissing(criteria);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // 50 ms rate-limit + debounce
    });
  });

  describe('retry med eksponentiell backoff', () => {
    it('prøver opptil 3 ganger ved feil fra provider', async () => {
      seedBank([]);
      mockOtdb.mockFetch
        .mockRejectedValueOnce(new Error('Feil 1'))
        .mockRejectedValueOnce(new Error('Feil 2'))
        .mockResolvedValueOnce({ questions: [makeQuestion()], hadInvalid: false });

      const criteria = createCriteria({ count: 1 });
      await fetcher.fetchMissing(criteria);

      expect(mockOtdb.mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('deduplisering av samtidige kall', () => {
    it('deler promise for identiske kriterier', async () => {
      seedBank([]);
      mockOtdb.mockFetch.mockResolvedValue({ questions: [makeQuestion({ text: 'dedup q' })], hadInvalid: false });

      const criteria = createCriteria({ count: 1 });
      const fetcher2 = new AutoQuestionFetcher([mockOtdb.provider]);
      const p1 = fetcher2.fetchMissing(criteria);
      const p2 = fetcher2.fetchMissing(criteria);

      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).toBe(r2);
      expect(mockOtdb.mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigator.onLine', () => {
    it('feiler umiddelbart ved offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

      seedBank([]);

      const criteria = createCriteria({ count: 5 });
      const result = await fetcher.fetchMissing(criteria, trackProgress());

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('offline');
      expect(mockOtdb.mockFetch).not.toHaveBeenCalled();

      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    });
  });

  describe('cache metadata', () => {
    it('lagrer provider-availability i localStorage cache', async () => {
      seedBank([]);
      const q = makeQuestion({ categories: ['historie'], difficulty: 'middels' });
      mockOtdb.mockFetch.mockResolvedValue({ questions: [q], hadInvalid: false });

      const criteria = createCriteria({ count: 1 });
      await fetcher.fetchMissing(criteria);

      const cached = localStorage.getItem('quizkrets_api_meta_cache');
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(parsed.providerAvailability).toBeDefined();
      expect(parsed.providerAvailability['opentdb']).toBe(1);
    });
  });

  // Tidligere test erstattet av den nye suite over (customTheme / tags)
});
