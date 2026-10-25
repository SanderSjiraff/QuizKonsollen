import { describe, it, expect } from 'vitest';
import { convertOtdbQuestion } from '../adapters/openTdbAdapter';
import { convertTriviaApiQuestion } from '../adapters/triviaApiAdapter';

const otdbRaw = {
  category: 'Science: Computers',
  type: 'multiple' as const,
  difficulty: 'medium' as const,
  question:
    'Which%20of%20the%20following%20is%20not%20an%20operating%20system%3F',
  correct_answer: 'Microsoft%20Office',
  incorrect_answers: ['Linux', 'Windows%2010', 'macOS'],
};

describe('convertOtdbQuestion', () => {
  it('dekoder URL-kodet tekst', () => {
    const q = convertOtdbQuestion(otdbRaw);
    expect(q.text).toBe('Which of the following is not an operating system?');
    expect(q.choices.some(c => c.text === 'Windows 10')).toBe(true);
  });

  it('mapper vanskelighetsgrad til norsk', () => {
    expect(convertOtdbQuestion(otdbRaw).difficulty).toBe('middels');
    expect(convertOtdbQuestion({ ...otdbRaw, difficulty: 'hard' }).difficulty).toBe('vanskelig');
    expect(convertOtdbQuestion({ ...otdbRaw, difficulty: 'easy' }).difficulty).toBe('lett');
  });

  it('mapper kategori til intern hierarkisk ID', () => {
    const q = convertOtdbQuestion(otdbRaw);
    expect(q.categories).toContain('datamaskiner');
    expect(q.categories).toContain('teknologi'); // hovedkategori legges automatisk til
  });

  it('peker på riktig alternativ etter stokking', () => {
    for (let i = 0; i < 20; i++) {
      const q = convertOtdbQuestion(otdbRaw);
      const correct = q.choices.find(c => q.correctChoiceIds.includes(c.id));
      expect(correct?.text).toBe('Microsoft Office');
    }
  });

  it('generer stabil ID fra innhold (samme spørsmål = samme ID)', () => {
    const a = convertOtdbQuestion(otdbRaw);
    const b = convertOtdbQuestion({ ...otdbRaw });
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^otdb-/);
  });

  it('ulike spørsmål får ulike IDer', () => {
    const a = convertOtdbQuestion(otdbRaw);
    const b = convertOtdbQuestion({ ...otdbRaw, question: 'Another%20question' });
    expect(a.id).not.toBe(b.id);
  });

  it('håndterer sant/usant-spørsmål', () => {
    const q = convertOtdbQuestion({
      category: 'History',
      type: 'boolean',
      difficulty: 'easy',
      question: 'Is%20this%20true%3F',
      correct_answer: 'True',
      incorrect_answers: ['False'],
    });
    expect(q.type).toBe('true_false');
    expect(q.choices.length).toBe(2);
  });
});

const triviaRaw = {
  id: '622a1c377cc59eab6f95055f',
  category: 'science',
  difficulty: 'easy' as const,
  question: { text: 'What is dialectology the study of?' },
  correctAnswer: 'Dialects',
  incorrectAnswers: ['X-Rays', 'Drugs', 'Clouds'],
  tags: ['science', 'words'],
  type: 'text_choice',
  regions: [],
  isNiche: false,
};

describe('convertTriviaApiQuestion', () => {
  it('bruker API-ets stabile ID', () => {
    const q = convertTriviaApiQuestion(triviaRaw);
    expect(q.id).toBe('tapi-622a1c377cc59eab6f95055f');
  });

  it('mapper vanskelighet og kategori', () => {
    const q = convertTriviaApiQuestion(triviaRaw);
    expect(q.difficulty).toBe('lett');
    expect(q.categories).toContain('vitenskap');
  });

  it('peker på riktig alternativ', () => {
    const q = convertTriviaApiQuestion(triviaRaw);
    const correct = q.choices.find(c => q.correctChoiceIds.includes(c.id));
    expect(correct?.text).toBe('Dialects');
    expect(q.choices.length).toBe(4);
  });

  it('samme ID gir samme ID (deterministisk)', () => {
    expect(convertTriviaApiQuestion(triviaRaw).id).toBe(
      convertTriviaApiQuestion({ ...triviaRaw }).id
    );
  });
});
