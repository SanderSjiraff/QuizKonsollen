/**
 * CSV-parsing for filimport av spørsmål (P1 #9).
 *
 * Flyttet ut av ImportQuestions.tsx slik at logikken er enhetstestbar uten
 * React. Viktigste endring: ugyldige rader (feil fasit-bokstav) forkaster
 * ikke lenger hele importen – de samles radvis i `invalid`, konsistent med
 * hvordan JSON-import allerede skiller gyldige/ugyldige spørsmål.
 */

/** En rad som ikke kan brukes, med forklaring til brukeren. */
export interface CsvInvalidRow {
  preview: string;
  issues: string[];
}

export interface CsvParseResult {
  drafts: unknown[];
  invalid: CsvInvalidRow[];
}

const CHOICE_COLUMNS = ['choice_a', 'choice_b', 'choice_c', 'choice_d', 'choice_e', 'choice_f'];
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** Enkel CSV-parser som håndterer anførselstegn og semikolon som skilletegn. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ';') {
      current.push(field);
      field = '';
    } else if (char === '\n') {
      current.push(field);
      field = '';
      if (current.some(c => c.trim() !== '')) rows.push(current);
      current = [];
    } else if (char !== '\r') {
      field += char;
    }
  }
  current.push(field);
  if (current.some(c => c.trim() !== '')) rows.push(current);
  return rows;
}

/**
 * Konverter CSV-rader (med overskrift) til spørsmålskladder.
 * Ugyldige rader samles i `invalid` – de kaster ikke lenger hele importen.
 */
export function csvToDrafts(rows: string[][]): CsvParseResult {
  const drafts: unknown[] = [];
  const invalid: CsvInvalidRow[] = [];
  if (rows.length < 2) return { drafts, invalid };

  const header = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  rows.slice(1).forEach((row, i) => {
    const get = (name: string) => {
      const col = idx(name);
      return col >= 0 ? (row[col] ?? '').trim() : '';
    };
    const choicesRaw = CHOICE_COLUMNS.map(get).filter(t => t !== '');
    if (choicesRaw.length === 0 && !get('text')) return;

    const correctLetter = get('correct').toLowerCase();
    const choices = choicesRaw.map((text, j) => ({ id: LETTERS[j], text }));
    const correctIdx = LETTERS.indexOf(correctLetter);
    const hasValidCorrect = correctIdx >= 0 && correctIdx < choices.length;

    if (!hasValidCorrect) {
      invalid.push({
        preview: get('text') || `Rad ${i + 2}`,
        issues: [
          `Ugyldig fasit-bokstav "${correctLetter}" – må være a–f og peke på et eksisterende svaralternativ.`,
        ],
      });
      return;
    }

    drafts.push({
      text: get('text'),
      type: get('type') || (choices.length === 2 ? 'true_false' : 'multiple_choice'),
      difficulty: get('difficulty') || 'lett',
      categories: get('categories')
        ? get('categories')
            .split('|')
            .map(c => c.trim())
            .filter(Boolean)
        : [],
      choices,
      correctChoiceIds: [LETTERS[correctIdx]],
      explanation: get('explanation') || undefined,
    });
  });

  return { drafts, invalid };
}
