import { describe, it, expect } from 'vitest';
import {
  fisherYates,
  filterQuestions,
  selectQuestions,
  countAvailable,
  selectDistributed,
} from '../questionSelector';
import type { Question, Difficulty } from '../../types';

function makeQuestion(id: string, categories: string[], difficulty: Difficulty): Question {
  return {
    id,
    text: `Spørsmål ${id}`,
    type: 'multiple_choice',
    difficulty,
    categories,
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ],
    correctChoiceIds: ['a'],
  };
}

/** Bank med 5 per (kategori, vanskelighet). */
function buildBank(): Question[] {
  const bank: Question[] = [];
  const cats = ['historie', 'sport', 'vitenskap'];
  const diffs: Difficulty[] = ['lett', 'middels', 'vanskelig'];
  let n = 0;
  for (const cat of cats) {
    for (const diff of diffs) {
      for (let i = 0; i < 5; i++) {
        bank.push(makeQuestion(`${cat}-${diff}-${i}`, [cat], diff));
      }
    }
  }
  void n;
  return bank;
}

describe('fisherYates', () => {
  it('bevarer alle elementer', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = fisherYates(arr);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(arr);
  });

  it('muterer ikke originalarrayet', () => {
    const arr = [1, 2, 3];
    fisherYates(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('faktisk blander (statistisk løs sjekk)', () => {
    // Med 3 elementer og mange runder bør mer enn én permutasjon forekomme.
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      seen.add(fisherYates([1, 2, 3]).join(''));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('filterQuestions', () => {
  it('filtrerer på kategori og vanskelighet', () => {
    const bank = buildBank();
    const filtered = filterQuestions(bank, {
      categories: ['historie'],
      difficulties: ['vanskelig'],
      count: 100,
    });
    expect(filtered.length).toBe(5);
    expect(filtered.every(q => q.categories.includes('historie'))).toBe(true);
    expect(filtered.every(q => q.difficulty === 'vanskelig')).toBe(true);
  });

  it('tomt kriterium = alle', () => {
    const bank = buildBank();
    expect(filterQuestions(bank, { categories: [], difficulties: [], count: 0 }).length).toBe(45);
  });

  it('hovedkategori matcher underkategorier', () => {
    const bank = [
      makeQuestion('n1', ['norsk-historie'], 'lett'), // underkategori av historie
      makeQuestion('n2', ['sport'], 'lett'),
    ];
    const filtered = filterQuestions(bank, { categories: ['historie'], difficulties: [], count: 10 });
    expect(filtered.map(q => q.id)).toEqual(['n1']);
  });
});

describe('selectQuestions', () => {
  it('velger ønsket antall uten duplikater', () => {
    const bank = buildBank();
    const result = selectQuestions(bank, {
      categories: [],
      difficulties: [],
      count: 10,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.length).toBe(10);
    const ids = result.questions.map(q => q.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('returnerer ok: false når antallet ikke strekker til – INGEN fallback', () => {
    const bank = buildBank(); // 5 vanskelige historie
    const result = selectQuestions(bank, {
      categories: ['historie'],
      difficulties: ['vanskelig'],
      count: 10,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.availableCount).toBe(5);
    expect(result.requested).toBe(10);
    expect(result.missing).toBe(5);
    expect(result.questions).toEqual([]);
    // Kritisk: skal aldri levere spørsmål UTENFOR valgte filtre
  });

  it('ekskluderer brukte spørsmål', () => {
    const bank = buildBank();
    const result = selectQuestions(bank, {
      categories: ['historie'],
      difficulties: ['lett'],
      count: 3,
      excludeIds: ['historie-lett-0', 'historie-lett-1'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.map(q => q.id)).not.toContain('historie-lett-0');
    expect(result.questions.length).toBe(3);
  });

  it('tillater gjenbruk når allowReuse er satt', () => {
    const bank = buildBank();
    const result = selectQuestions(bank, {
      categories: ['historie'],
      difficulties: ['lett'],
      count: 5,
      excludeIds: bank.slice(0, 40).map(q => q.id),
      allowReuse: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.length).toBe(5);
  });

  it('gir tilfeldig rekkefølge (forskjellige uttrekk over tid)', () => {
    const bank = buildBank();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = selectQuestions(bank, { categories: [], difficulties: [], count: 10 });
      if (result.ok) seen.add(result.questions.map(q => q.id).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('selectDistributed', () => {
  it('fordeler spørsmål over flere kategorier', () => {
    const bank = buildBank();
    const result = selectDistributed(bank, {
      categories: ['historie', 'sport', 'vitenskap'],
      difficulties: ['lett'],
      count: 9,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.length).toBe(9);
    const counts = { historie: 0, sport: 0, vitenskap: 0 };
    for (const q of result.questions) {
      counts[q.categories[0] as keyof typeof counts]++;
    }
    expect(counts.historie).toBe(3);
    expect(counts.sport).toBe(3);
    expect(counts.vitenskap).toBe(3);
  });

  it('velger aldri samme spørsmål to ganger selv med flere kategorier', () => {
    const overlapping = [
      { ...makeQuestion('multi-1', ['historie', 'sport'], 'lett') },
      { ...makeQuestion('multi-2', ['historie', 'sport'], 'lett') },
      { ...makeQuestion('multi-3', ['sport', 'vitenskap'], 'lett') },
    ];
    const result = selectDistributed(overlapping, {
      categories: ['historie', 'sport', 'vitenskap'],
      difficulties: ['lett'],
      count: 3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.length).toBe(3);
    const ids = result.questions.map(q => q.id);
    expect(new Set(ids).size).toBe(3);
  });
});

describe('countAvailable', () => {
  it('rapporterer fresh og withReuse separatert', () => {
    const bank = buildBank();
    const { fresh, withReuse } = countAvailable(bank, {
      categories: ['sport'],
      difficulties: ['middels'],
      count: 5,
      excludeIds: ['sport-middels-0', 'sport-middels-1'],
    });
    expect(fresh).toBe(3);
    expect(withReuse).toBe(5);
  });
});
