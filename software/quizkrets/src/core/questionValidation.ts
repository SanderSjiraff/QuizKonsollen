/**
 * Felles validering av spørsmål.
 * Brukes av JSON-import, manuell opprettelse/redigering og API-normalisering,
 * slik at alle kilder garanterer samme datakvalitet.
 */

import type { Difficulty, QuestionType } from '../types';
import { migrateCategories, UNRESOLVED_CATEGORY, CATEGORY_DEF_IDS } from './categories';

export interface ValidationIssue {
  /** Feltet problemet gjelder, f.eks. 'text' eller 'choices'. */
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

const VALID_DIFFICULTIES: Difficulty[] = ['lett', 'middels', 'vanskelig'];
const VALID_TYPES: QuestionType[] = ['multiple_choice', 'buzzer', 'true_false'];

interface QuestionDraft {
  id?: unknown;
  text?: unknown;
  type?: unknown;
  difficulty?: unknown;
  categories?: unknown;
  choices?: unknown;
  correctChoiceIds?: unknown;
  explanation?: unknown;
}

/**
 * Valider et råspørsmål (fra JSON-import, redigeringsdialog e.l.).
 * Returnerer alle feil som ble funnet, ikke bare den første.
 */
export function validateQuestionDraft(raw: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: [{ field: 'root', message: 'Spørsmålet må være et objekt.' }] };
  }
  const q = raw as QuestionDraft;

  // Tekst
  if (typeof q.text !== 'string' || q.text.trim().length < 5) {
    errors.push({ field: 'text', message: 'Spørsmålsteksten må være minst 5 tegn.' });
  }

  // Type
  if (typeof q.type !== 'string' || !VALID_TYPES.includes(q.type as QuestionType)) {
    errors.push({
      field: 'type',
      message: `Typen må være en av: ${VALID_TYPES.join(', ')}.`,
    });
  }

  // Vanskelighet
  if (typeof q.difficulty !== 'string' || !VALID_DIFFICULTIES.includes(q.difficulty as Difficulty)) {
    errors.push({
      field: 'difficulty',
      message: `Vanskelighetsgraden må være en av: ${VALID_DIFFICULTIES.join(', ')}.`,
    });
  }

  // Kategorier (migreres og sjekkes mot sentral definisjon)
  if (!Array.isArray(q.categories) || q.categories.length === 0) {
    errors.push({ field: 'categories', message: 'Minst én kategori må velges.' });
  } else if (!q.categories.every(c => typeof c === 'string')) {
    errors.push({ field: 'categories', message: 'Kategorier må være tekst.' });
  } else {
    const migrated = migrateCategories(q.categories as string[]);
    if (migrated.includes(UNRESOLVED_CATEGORY)) {
      errors.push({
        field: 'categories',
        message: `Ukjent kategori – gyldige kategorier må brukes (ukjent merkes "${UNRESOLVED_CATEGORY}").`,
      });
    }
    // Sjekk at alle kategorier er kjent (ignorer gjennomgangs-taggen)
    for (const c of q.categories as string[]) {
      if (!CATEGORY_DEF_IDS.has(c) && migrateCategories([c]).includes(UNRESOLVED_CATEGORY)) {
        errors.push({ field: 'categories', message: `Kategorien "${c}" er ikke gyldig.` });
      }
    }
  }

  // Svaralternativer
  if (!Array.isArray(q.choices) || q.choices.length < 2) {
    errors.push({ field: 'choices', message: 'Minst to svaralternativer kreves.' });
  } else {
    const texts: string[] = [];
    q.choices.forEach((c: unknown, i: number) => {
      const choice = c as { id?: unknown; text?: unknown };
      if (!choice || typeof choice !== 'object') {
        errors.push({ field: `choices[${i}]`, message: 'Svaralternativet mangler.' });
        return;
      }
      if (typeof choice.id !== 'string' || choice.id.length === 0) {
        errors.push({ field: `choices[${i}].id`, message: 'Svaralternativet mangler ID.' });
      }
      if (typeof choice.text !== 'string' || choice.text.trim().length === 0) {
        errors.push({ field: `choices[${i}].text`, message: 'Svaralternativet mangler tekst.' });
      } else if (texts.includes(choice.text.trim().toLowerCase())) {
        errors.push({ field: `choices[${i}].text`, message: 'Svaralternativene må være unike.' });
      } else {
        texts.push(choice.text.trim().toLowerCase());
      }
    });
  }

  // Riktig svar
  const choiceIds = Array.isArray(q.choices)
    ? q.choices.map((c: unknown) => (c as { id?: unknown })?.id).filter((id): id is string => typeof id === 'string')
    : [];
  if (!Array.isArray(q.correctChoiceIds) || q.correctChoiceIds.length === 0) {
    errors.push({ field: 'correctChoiceIds', message: 'Riktig svar må angis.' });
  } else {
    for (const id of q.correctChoiceIds) {
      if (typeof id !== 'string' || !choiceIds.includes(id)) {
        errors.push({
          field: 'correctChoiceIds',
          message: 'Riktig svar må være ett av svaralternativene.',
        });
        break;
      }
    }
  }

  // Forklaring (valgfri)
  if (q.explanation !== undefined && typeof q.explanation !== 'string') {
    errors.push({ field: 'explanation', message: 'Forklaringen må være tekst.' });
  }

  return { valid: errors.length === 0, errors };
}

/** Menneskevennlig oppsummering av valideringsfeil for ett spørsmål. */
export function formatIssues(errors: ValidationIssue[]): string {
  return errors.map(e => e.message).join(' ');
}
