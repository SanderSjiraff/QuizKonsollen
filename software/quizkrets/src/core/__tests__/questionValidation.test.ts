import { describe, it, expect } from 'vitest';
import { validateQuestionDraft } from '../questionValidation';

const validQuestion = {
  text: 'Hva er hovedstaden i Sverige?',
  type: 'multiple_choice',
  difficulty: 'lett',
  categories: ['geografi'],
  choices: [
    { id: 'a', text: 'Oslo' },
    { id: 'b', text: 'Stockholm' },
    { id: 'c', text: 'København' },
    { id: 'd', text: 'Helsingfors' },
  ],
  correctChoiceIds: ['b'],
};

describe('validateQuestionDraft', () => {
  it('godtar gyldig spørsmål', () => {
    const result = validateQuestionDraft(validQuestion);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('avviser for kort spørsmålstekst', () => {
    const result = validateQuestionDraft({ ...validQuestion, text: 'Hei' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'text')).toBe(true);
  });

  it('avviser ugyldig type', () => {
    const result = validateQuestionDraft({ ...validQuestion, type: 'dictation' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'type')).toBe(true);
  });

  it('avviser ugyldig vanskelighetsgrad', () => {
    const result = validateQuestionDraft({ ...validQuestion, difficulty: 'ekstrem' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'difficulty')).toBe(true);
  });

  it('avviser ukjent kategori', () => {
    const result = validateQuestionDraft({ ...validQuestion, categories: ['finnes-ikke'] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'categories')).toBe(true);
  });

  it('aksepterer kjente eksterne kategorinavn som migreres (f.eks. OpenTDB)', () => {
    const result = validateQuestionDraft({ ...validQuestion, categories: ['Science & Nature'] });
    // Kjente navn migreres automatisk til interne IDer i spørsmålsbanken.
    expect(result.valid).toBe(true);
  });

  it('avviser når riktig svar ikke finnes blant alternativene', () => {
    const result = validateQuestionDraft({ ...validQuestion, correctChoiceIds: ['x'] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'correctChoiceIds')).toBe(true);
  });

  it('avviser manglende riktig svar', () => {
    const result = validateQuestionDraft({ ...validQuestion, correctChoiceIds: [] });
    expect(result.valid).toBe(false);
  });

  it('avviser duplikate svaralternativer', () => {
    const result = validateQuestionDraft({
      ...validQuestion,
      choices: [
        { id: 'a', text: 'Samme' },
        { id: 'b', text: 'samme' },
      ],
      correctChoiceIds: ['a'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('unike'))).toBe(true);
  });

  it('avviser for få alternativer', () => {
    const result = validateQuestionDraft({
      ...validQuestion,
      choices: [{ id: 'a', text: 'Bare ett' }],
      correctChoiceIds: ['a'],
    });
    expect(result.valid).toBe(false);
  });

  it('samler alle feil, ikke bare den første', () => {
    const result = validateQuestionDraft({ text: 'abc', type: 'nei', difficulty: 'ultra' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('avviser ikke-objekt', () => {
    const result = validateQuestionDraft('ikke et objekt');
    expect(result.valid).toBe(false);
  });
});
