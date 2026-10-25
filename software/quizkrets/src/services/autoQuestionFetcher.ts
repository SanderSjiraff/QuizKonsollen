/**
 * AutoQuestionFetcher – sentral tjeneste for automatisk innhenting av quiz-spørsmål.
 *
 * Ansvar:
 * - Sjekk localStorage først for tilgjengelige spørsmål
 * - Hent manglende spørsmål fra eksterne leverandører (OpenTDB, Trivia API)
 * - Debounce (500 ms), rate-limit-respekt, retry med eksponentiell backoff
 * - Avbrytbar, deduplisering av samtidige kall, online-sjekk
 * - Cache API-metadata i localStorage med 24t TTL
 */

import type { Difficulty, Question } from '../types';
import type { QuestionProvider, ProviderFetchResult } from '../data/adapters/types';
import { openTdbProvider } from '../data/adapters/openTdbAdapter';
import { triviaApiProvider } from '../data/adapters/triviaApiAdapter';
import { addQuestions, getAllQuestions } from '../data/questionStore';
import { countAvailable } from '../core/questionSelector';
import { expandSelection } from '../core/categories';

export interface FetchProgress {
  status: 'idle' | 'checking' | 'fetching' | 'complete' | 'error' | 'insufficient';
  localFound: number;
  localTarget: number;
  fetchedCount: number;
  totalReady: number;
  message: string;
  errors: string[];
}

export interface FetchCriteria {
  categories: string[];
  difficulties: Difficulty[];
  count: number;
  excludeIds?: string[];
  customTheme?: string;
}

export interface FetchResult {
  success: boolean;
  fetchedCount: number;
  totalReady: number;
  questions: Question[];
  errors: string[];
}

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const META_CACHE_KEY = 'quizkrets_api_meta_cache';
const META_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 timer

interface CachedMeta {
  timestamp: number;
  providerAvailability?: Record<string, number>;
}

function getCachedMeta(): CachedMeta | null {
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMeta;
    if (Date.now() - parsed.timestamp > META_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedMeta(meta: CachedMeta): void {
  try {
    localStorage.setItem(META_CACHE_KEY, JSON.stringify(meta));
  } catch {
    // Ignorer cache-feil
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Sjekk om spørsmål matcher kriteriene. */
function matchesCriteria(q: Question, criteria: FetchCriteria): boolean {
  const expanded = expandSelection(criteria.categories);
  const difficulties = new Set(criteria.difficulties);

  const matchesCategory =
    criteria.categories.length === 0 || q.categories.some(c => expanded.has(c));
  const matchesDifficulty =
    criteria.difficulties.length === 0 || difficulties.has(q.difficulty);

  return matchesCategory && matchesDifficulty;
}

export class AutoQuestionFetcher {
  private providers: QuestionProvider[];
  private cancelToken = { cancelled: false };
  private sharedPromise: Promise<FetchResult> | null = null;
  private sharedCriteriaKey: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(providers?: QuestionProvider[]) {
    this.providers = providers ?? [openTdbProvider, triviaApiProvider];
  }

  /** Beregn hvor mange spørsmål som mangler for å oppfylle kriteriene. */
  calculateMissing(criteria: FetchCriteria): number {
    const all = getAllQuestions();
    const available = countAvailable(all, {
      categories: criteria.categories,
      difficulties: criteria.difficulties,
      count: criteria.count,
      excludeIds: criteria.excludeIds,
      allowReuse: false,
    });
    return Math.max(0, criteria.count - available.fresh);
  }

  /** Sjekk om localStorage alene kan dekke behovet. */
  canFulfillLocally(criteria: FetchCriteria): boolean {
    return this.calculateMissing(criteria) === 0;
  }

  /**
   * Hent manglende spørsmål fra eksterne kilder.
   * Debounce (500 ms), rate-limit, retry, avbrytbar.
   */
  async fetchMissing(
    criteria: FetchCriteria,
    onProgress?: (p: FetchProgress) => void
  ): Promise<FetchResult> {
    const criteriaKey = JSON.stringify(criteria);

    // Deduplisering: delt promise for identiske kriterier
    if (this.sharedPromise && this.sharedCriteriaKey === criteriaKey) {
      return this.sharedPromise;
    }

    // Avbryt evt. pågående jobb (men ikke hvis vi deler promise ovenfor)
    this.cancel();
    this.cancelToken = { cancelled: false };
    const token = this.cancelToken;

    const promise = this._doFetch(criteria, onProgress, token);
    this.sharedPromise = promise;
    this.sharedCriteriaKey = criteriaKey;

    promise.finally(() => {
      if (this.sharedPromise === promise) {
        this.sharedPromise = null;
        this.sharedCriteriaKey = null;
      }
    });

    return promise;
  }

  private async _doFetch(
    criteria: FetchCriteria,
    onProgress: ((p: FetchProgress) => void) | undefined,
    token: { cancelled: boolean }
  ): Promise<FetchResult> {
    // Debounce
    await this._debounce();
    if (token.cancelled) {
      return { success: false, fetchedCount: 0, totalReady: 0, questions: [], errors: ['Avbrutt'] };
    }

    // Sjekk online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const err = 'Du er offline. Koble til internett for å hente spørsmål.';
      this._reportProgress(onProgress, { status: 'error', message: err, errors: [err] });
      return { success: false, fetchedCount: 0, totalReady: 0, questions: [], errors: [err] };
    }

    const missing = this.calculateMissing(criteria);
    const all = getAllQuestions();
    const localAvailable = countAvailable(all, {
      categories: criteria.categories,
      difficulties: criteria.difficulties,
      count: criteria.count,
      excludeIds: criteria.excludeIds,
      allowReuse: false,
    });

    this._reportProgress(onProgress, {
      status: 'checking',
      localFound: localAvailable.fresh,
      localTarget: criteria.count,
      fetchedCount: 0,
      totalReady: localAvailable.fresh,
      message: `Fant ${localAvailable.fresh} av ${criteria.count} lokalt`,
      errors: [],
    });

    if (missing === 0) {
      const localQuestions = this._selectLocalQuestions(criteria);
      this._reportProgress(onProgress, {
        status: 'complete',
        localFound: localAvailable.fresh,
        localTarget: criteria.count,
        fetchedCount: 0,
        totalReady: localQuestions.length,
        message: 'Alle spørsmål funnet lokalt',
        errors: [],
      });
      return { success: true, fetchedCount: 0, totalReady: localQuestions.length, questions: localQuestions, errors: [] };
    }

    // Hent fra leverandører
    this._reportProgress(onProgress, {
      status: 'fetching',
      localFound: localAvailable.fresh,
      localTarget: criteria.count,
      fetchedCount: 0,
      totalReady: localAvailable.fresh,
      message: `Henter ${missing} spørsmål fra nettet…`,
      errors: [],
    });

    const fetched: Question[] = [];
    const errors: string[] = [];
    let remaining = missing;

    for (const provider of this.providers) {
      if (token.cancelled) break;
      if (remaining <= 0) break;

      const providerAmount = Math.min(remaining, 50);
      const providerParams = this._buildProviderParams(criteria, provider, providerAmount);

      try {
        const result = await this._fetchWithRetry(provider, providerParams, token);
        if (token.cancelled) break;

        if (result.questions.length > 0) {
          // Lagre hentede spørsmål i banken
          const source = provider.id === 'opentdb' ? 'opentdb' : 'trivia-api';
          try {
            addQuestions(result.questions, source, provider.licenseNote);
          } catch (storageErr) {
            errors.push(
              storageErr instanceof Error ? storageErr.message : 'Lagringsfeil ved lagring av hentede spørsmål'
            );
            continue;
          }

          // Filtrer bare de som matcher kriteriene (ikke bland inn irrelevante)
          const matching = result.questions.filter(q => matchesCriteria(q, criteria));
          const newIds = new Set(fetched.map(q => q.id));
          const uniqueMatching = matching.filter(q => !newIds.has(q.id) && !this._isExcluded(q, criteria));

          fetched.push(...uniqueMatching);
          remaining = Math.max(0, criteria.count - localAvailable.fresh - fetched.length);

          this._reportProgress(onProgress, {
            status: 'fetching',
            localFound: localAvailable.fresh,
            localTarget: criteria.count,
            fetchedCount: fetched.length,
            totalReady: localAvailable.fresh + fetched.length,
            message: `Hentet ${fetched.length} nye spørsmål fra ${provider.name}`,
            errors,
          });

          // Oppdater cache
          const meta = getCachedMeta() ?? { timestamp: Date.now() };
          meta.providerAvailability = { ...(meta.providerAvailability ?? {}), [provider.id]: result.questions.length };
          setCachedMeta(meta);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Ukjent feil fra ${provider.name}`;
        errors.push(msg);
      }
    }

    // Velg endelig spørsmål fra localStorage (nå inkl. nylig hentede)
    const finalQuestions = this._selectLocalQuestions(criteria);

    if (finalQuestions.length < criteria.count) {
      const msg = `Kunne ikke hente nok spørsmål. Fant ${finalQuestions.length} av ${criteria.count}.`;
      this._reportProgress(onProgress, {
        status: 'insufficient',
        localFound: localAvailable.fresh,
        localTarget: criteria.count,
        fetchedCount: fetched.length,
        totalReady: finalQuestions.length,
        message: msg,
        errors,
      });
      return { success: false, fetchedCount: fetched.length, totalReady: finalQuestions.length, questions: finalQuestions, errors };
    }

    this._reportProgress(onProgress, {
      status: 'complete',
      localFound: localAvailable.fresh,
      localTarget: criteria.count,
      fetchedCount: fetched.length,
      totalReady: finalQuestions.length,
      message: `Klar! ${finalQuestions.length} spørsmål tilgjengelig.`,
      errors,
    });

    return { success: true, fetchedCount: fetched.length, totalReady: finalQuestions.length, questions: finalQuestions, errors };
  }

  /** Avbryt pågående henting. */
  cancel(): void {
    this.cancelToken.cancelled = true;
    this.cancelToken = { cancelled: false };
  }

  private _debounce(): Promise<void> {
    return new Promise(resolve => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        resolve();
      }, DEBOUNCE_MS);
    });
  }

  private _reportProgress(
    onProgress: ((p: FetchProgress) => void) | undefined,
    partial: Partial<FetchProgress> & { message: string }
  ): void {
    const base: FetchProgress = {
      status: 'idle',
      localFound: 0,
      localTarget: 0,
      fetchedCount: 0,
      totalReady: 0,
      message: '',
      errors: [],
    };
    const progress = { ...base, ...partial };
    onProgress?.(progress);
  }

  private _isExcluded(q: Question, criteria: FetchCriteria): boolean {
    if (!criteria.excludeIds || criteria.excludeIds.length === 0) return false;
    const excluded = new Set(criteria.excludeIds);
    return excluded.has(q.id);
  }

  private _selectLocalQuestions(criteria: FetchCriteria): Question[] {
    const all = getAllQuestions();
    const expanded = expandSelection(criteria.categories);
    const difficulties = new Set(criteria.difficulties);
    const excluded = new Set(criteria.excludeIds ?? []);

    let pool = all.filter(q => {
      const matchesCategory =
        criteria.categories.length === 0 || q.categories.some(c => expanded.has(c));
      const matchesDifficulty =
        criteria.difficulties.length === 0 || difficulties.has(q.difficulty);
      return matchesCategory && matchesDifficulty && !excluded.has(q.id);
    });

    // Stokk og begrens til ønsket antall
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, criteria.count);
  }

  private _buildProviderParams(
    criteria: FetchCriteria,
    provider: QuestionProvider,
    amount: number
  ): import('../data/adapters/types').ProviderFetchParams {
    let providerCategory: string | undefined;
    if (criteria.categories.length > 0 && provider.categories.length > 0) {
      const expanded = expandSelection(criteria.categories);
      const match = provider.categories.find(c => expanded.has(c.internalCategoryId));
      if (match) {
        providerCategory = match.providerId;
      }
    }

    const tags: string[] | undefined =
      provider.id === 'trivia-api' && criteria.customTheme
        ? [criteria.customTheme]
        : undefined;

    return {
      amount,
      providerCategory,
      difficulty: criteria.difficulties.length === 1 ? criteria.difficulties[0] : undefined,
      tags,
    };
  }

  private async _fetchWithRetry(
    provider: QuestionProvider,
    params: import('../data/adapters/types').ProviderFetchParams,
    token: { cancelled: boolean }
  ): Promise<ProviderFetchResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (token.cancelled) {
        throw new Error('Avbrutt');
      }

      const wait = provider.msUntilReady();
      if (wait > 0) {
        await sleep(wait);
      }
      if (token.cancelled) {
        throw new Error('Avbrutt');
      }

      try {
        return await provider.fetchQuestions(params);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES - 1) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }

    throw lastError ?? new Error(`Ukjent feil fra ${provider.name}`);
  }
}
