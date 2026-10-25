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
 * Vektet uttrekk: fordel `target` spørsmål over kategorier etter vekt.
 *
 * Egenskaper (P0 #3):
 * - Eksakte kvoter via størrest-rest-metoden – kvotene summerer seg alltid
 *   til target (f.eks. 50/30/20 av 20 → 10/6/4, aldri 11/6/4).
 * - Hver kategori matches mot sine EGNE spørsmål (inkl. underkategorier),
 *   ikke mot alle valgte kategorier.
 * - Utilstrekkelig spørsmålsutvalg: udekkede kvoter omfordeles iterativt og
 *   proporsjonalt (vektet fair queuing) til kategorier med kapasitet.
 * - Overlappende kategorier: et spørsmål kan kun velges én gang (taken-settet).
 */
function selectWeighted(
  pool: Question[],
  weights: Record<string, number>,
  target: number,
  taken: Set<string>
): Question[] {
  // Gyldige vekter: verdien må være et tall > 0 (filteret leser VERDIEN,
  // ikke kategorinavnet som nøkkel).
  const entries = Object.entries(weights).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0
  );
  const totalWeight = entries.reduce((s, [, w]) => s + w, 0);
  if (totalWeight <= 0 || target <= 0) return [];

  // 1. Eksakte kvoter via størrest-rest-metoden: sum === target.
  const raw = entries.map(([, w]) => (w / totalWeight) * target);
  const quotas = raw.map(Math.floor);
  const extra = target - quotas.reduce((a, b) => a + b, 0);
  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || entries[b.i][1] - entries[a.i][1]);
  for (let k = 0; k < extra && k < byRemainder.length; k++) {
    quotas[byRemainder[k].i] += 1;
  }

  // 2. Per kategori: kategoriens egne spørsmål (inkl. underkategorier), stokket.
  const pools = new Map<string, Question[]>();
  for (const [cat] of entries) {
    const own = expandSelection([cat]);
    pools.set(cat, fisherYates(pool.filter(q => q.categories.some(c => own.has(c)))));
  }

  const selected: Question[] = [];
  const remaining = quotas.slice();

  // 3. Iterativ fylling: utilstrekkelige kvoter omfordeles til kategorier
  //    med gjenværende kapasitet til alt er plassert eller poolen er tom.
  let guard = 0;
  let active = true;
  while (active && guard++ < target + entries.length + 2) {
    active = false;

    // Fyll så mye som mulig per kategori (størst gjenstående kvote først,
    // deterministisk rekkefølge).
    const order = remaining
      .map((n, i) => ({ n, i }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n || b.i - a.i);
    for (const { n, i } of order) {
      const catPool = pools.get(entries[i][0]) ?? [];
      let placed = 0;
      while (placed < n) {
        const q = catPool.shift();
        if (!q) break;
        if (taken.has(q.id)) continue;
        taken.add(q.id);
        selected.push(q);
        placed++;
      }
      remaining[i] = n - placed;
      if (placed > 0) active = true;
    }

    const unmet = remaining.reduce((a, b) => a + b, 0);
    if (unmet === 0) break;

    // Gjenstående kapasitet per kategori (fraver valgte spørsmål).
    const capacity = entries.map(
      ([cat]) => (pools.get(cat) ?? []).filter(q => !taken.has(q.id)).length
    );
    if (capacity.every(c => c === 0)) break;

    // Omfordel udekkede enheter med vektet fair queuing: mottaker med
    // høyest vekt/(1 + allerede tildelt ekstra) får neste enhet.
    const extraAlloc = entries.map(() => 0);
    for (let u = 0; u < unmet; u++) {
      let best = -1;
      let bestScore = -1;
      for (let i = 0; i < entries.length; i++) {
        if (capacity[i] - extraAlloc[i] <= 0) continue;
        const score = entries[i][1] / (1 + extraAlloc[i]);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      }
      if (best === -1) break;
      extraAlloc[best] += 1;
    }
    for (let i = 0; i < entries.length; i++) remaining[i] += extraAlloc[i];
  }

  return selected;
}

/**
 * Velg spørsmål med fordeling over flere kategorier.
 *
 * Med `weights` (kategori-ID → vekt) fordeles antallet proporsjonalt etter
 * vekt med korrekt avrunding og omfordeling ved utilstrekkelig utvalg.
 * Uten vekter fordeles antallet så jevnt som mulig per kategori (roterende),
 * og blander rekkefølgen til slutt. Spørsmål med flere kategorier kan kun
 * velges én gang.
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
    selected.push(...selectWeighted(pool, criteria.weights, target, taken));
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
