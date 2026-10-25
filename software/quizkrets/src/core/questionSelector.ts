/**
 * Testbar spørsmålsvelger.
 * Uavhengig av React og kan enhetstestes direkte.
 *
 * Viktige regler:
 * - Filtrering er STRENG: valgte kategorier/vanskeligheter ignoreres aldri.
 *   Ved for få treff returneres ok: false – aldri fallback til andre spørsmål.
 * - Tilfeldig rekkefølge via Fisher–Yates (uniform shuffle).
 * - Duplikater er umulige: samme spørsmål kan aldri velges to ganger i én quiz.
 */

import type { Question, Difficulty } from '../types';
import { expandSelection } from './categories';

export interface SelectionCriteria {
  /** Valgte kategorier (hoved og/eller under). Tomt = alle. */
  categories: string[];
  /** Valgte vanskelighetsgrader. Tomt = alle. */
  difficulties: Difficulty[];
  /** Ønsket antall spørsmål. */
  count: number;
  /** IDer som skal ekskluderes (typisk tidligere brukte spørsmål). */
  excludeIds?: string[];
  /** Hvis true tillates gjenbruk av ekskluderte spørsmål når det ellers ikke finnes nok. */
  allowReuse?: boolean;
}

export type SelectionResult =
  | {
      ok: true;
      questions: Question[];
      /** Antall tilgjengelige før uttrekk (etter filtre, før antallsbegrensning). */
      availableCount: number;
    }
  | {
      ok: false;
      questions: [];
      availableCount: number;
      requested: number;
      missing: number;
      /** Tilgjengelig antall dersom gjenbruk av brukte spørsmål tillates. */
      availableWithReuse: number;
    };

/** Uniform Fisher–Yates-shuffle. Returnerer alltid en ny array. */
export function fisherYates<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Filtrer etter kategorier (inkl. underkategorier) og vanskelighetsgrader. */
export function filterQuestions(all: Question[], criteria: SelectionCriteria): Question[] {
  const expanded = expandSelection(criteria.categories);
  const difficulties = new Set<Difficulty>(criteria.difficulties);

  return all.filter(q => {
    const matchesCategory =
      criteria.categories.length === 0 || q.categories.some(c => expanded.has(c));
    const matchesDifficulty =
      criteria.difficulties.length === 0 || difficulties.has(q.difficulty);
    return matchesCategory && matchesDifficulty;
  });
}

/** Antall tilgjengelige spørsmål for kriteriene (ekskludert brukte, med mindre allowReuse). */
export function countAvailable(all: Question[], criteria: SelectionCriteria): {
  fresh: number;
  withReuse: number;
} {
  const filtered = filterQuestions(all, criteria);
  const excluded = new Set(criteria.excludeIds ?? []);
  const fresh = filtered.filter(q => !excluded.has(q.id)).length;
  return { fresh, withReuse: filtered.length };
}

/**
 * Velg spørsmål etter kriteriene.
 * Returnerer ok: false hvis antallet ikke strekker til – kalleren må da
 * informere brukeren og tilby valg (redusere antall, endre filtre, hente flere,
 * tillate gjenbruk eller avbryte).
 */
export function selectQuestions(all: Question[], criteria: SelectionCriteria): SelectionResult {
  const filtered = filterQuestions(all, criteria);
  const excluded = new Set(criteria.excludeIds ?? []);
  let pool = filtered.filter(q => !excluded.has(q.id));

  if (pool.length < criteria.count) {
    if (criteria.allowReuse) {
      pool = filtered; // gjenbruk tillatt: bruk hele filtrerte mengden
    } else {
      return {
        ok: false,
        questions: [],
        availableCount: pool.length,
        requested: criteria.count,
        missing: criteria.count - pool.length,
        availableWithReuse: filtered.length,
      };
    }
  }

  const shuffled = fisherYates(pool);
  return {
    ok: true,
    questions: shuffled.slice(0, criteria.count),
    availableCount: pool.length,
  };
}

/**
 * Velg spørsmål med fordeling over flere kategorier.
 * Fordeler antallet så jevn-som-mulig per kategori (roterende, ikke-proporsjonalt),
 * og blander rekkefølgen til slutt. Spørsmål med flere kategorier kan kun velges én gang.
 */
export function selectDistributed(
  all: Question[],
  criteria: SelectionCriteria & { weights?: Record<string, number> }
): SelectionResult {
  const filtered = filterQuestions(all, criteria);
  const excluded = new Set(criteria.excludeIds ?? []);
  let pool = filtered.filter(q => !excluded.has(q.id));

  if (pool.length < criteria.count) {
    if (criteria.allowReuse) {
      pool = filtered;
    } else {
      return {
        ok: false,
        questions: [],
        availableCount: pool.length,
        requested: criteria.count,
        missing: criteria.count - pool.length,
        availableWithReuse: filtered.length,
      };
    }
  }

  const selected: Question[] = [];
  const taken = new Set<string>();
  const target = criteria.count;

  if (criteria.weights && Object.keys(criteria.weights).length > 0) {
    // Vektet fordeling: hver kategori får andel etter vekt, begrenset av tilgang.
    const weightedCats = Object.entries(criteria.weights).filter(([w]) => Number(w) >= 0);
    const totalWeight = weightedCats.reduce((s, [, w]) => s + w, 0);

    if (totalWeight > 0) {
      const expanded = expandSelection(criteria.categories);
      for (const [categoryId, weight] of weightedCats) {
        const share = Math.round((weight / totalWeight) * target);
        if (share <= 0) continue;
        const catPool = fisherYates(
          pool.filter(q => !taken.has(q.id) && q.categories.some(c => {
            const direct = expanded.has(categoryId) ? expanded.has(c) : false;
            return direct || c === categoryId;
          }))
        );
        for (const q of catPool.slice(0, share)) {
          selected.push(q);
          taken.add(q.id);
        }
      }
    }
  }

  // Fyll opp resten roterende per kategori for jevn fordeling.
  if (selected.length < target) {
    const catPools = new Map<string, Question[]>();
    for (const cat of criteria.categories) {
      const expanded = expandSelection([cat]);
      const catPool = pool.filter(q => !taken.has(q.id) && q.categories.some(c => expanded.has(c)));
      if (catPool.length > 0) catPools.set(cat, fisherYates(catPool));
    }
    const fallbackPool = fisherYates(pool.filter(q => !taken.has(q.id)));

    let catIndex = 0;
    const catKeys = [...catPools.keys()];
    while (selected.length < target) {
      let placed = false;
      // Ett spørsmål fra hver kategori i tur og orden
      if (catKeys.length > 0) {
        const key = catKeys[catIndex % catKeys.length];
        const next = catPools.get(key)?.shift();
        if (next && !taken.has(next.id)) {
          selected.push(next);
          taken.add(next.id);
          placed = true;
        }
        catIndex++;
      }
      if (!placed) {
        const next = fallbackPool.find(q => !taken.has(q.id));
        if (next) {
          selected.push(next);
          taken.add(next.id);
        } else {
          break; // tom pool
        }
      }
    }
  }

  return {
    ok: true,
    questions: fisherYates(selected.slice(0, target)),
    availableCount: pool.length,
  };
}
