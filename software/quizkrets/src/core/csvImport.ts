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
 * 
 * VIKTIG: Kolonneposisjon bevares for svaralternativer. Tomme felter ignoreres
 * IKKE under posisjonsmapping – fasiten peker på en spesifikk kolonne (a–f).
 * Hvis fasiten peker på et tomt alternativ, avvises raden.
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

    const text = get('text');
    const correctLetter = get('correct').toLowerCase();

    // Tom rad uten tekst og valg ignoreres stille
    if (!text) {
      const hasAnyChoice = CHOICE_COLUMNS.some(c => get(c) !== '');
      if (!hasAnyChoice) return;
    }

    // Bygg svaralternativer med OPPRINNELIG kolonneposisjon
    const choices: { id: string; text: string }[] = [];
    const choiceTexts: string[] = [];
    for (let colIdx = 0; colIdx < CHOICE_COLUMNS.length; colIdx++) {
      const choiceText = get(CHOICE_COLUMNS[colIdx]);
      if (choiceText) {
        choices.push({ id: LETTERS[colIdx], text: choiceText });
        choiceTexts.push(choiceText.toLowerCase());
      }
    }

    if (choices.length === 0) {
      // Rad med tekst men ingen valg er ugyldig
      if (text) {
        invalid.push({
          preview: text || `Rad ${i + 2}`,
          issues: ['Ingen svaralternativer funnet.'],
        });
      }
      return;
    }

    // Sjekk at fasitbokstaven er gyldig (a–f)
    const correctIdx = LETTERS.indexOf(correctLetter);
    if (correctIdx < 0) {
      invalid.push({
        preview: text || `Rad ${i + 2}`,
        issues: [
          `Ugyldig fasit-bokstav "${get('correct')}" – må være a–f.`,
        ],
      });
      return;
    }

    // VIKTIG: Sjekk at fasiten peker på en KOLONNE som faktisk har innhold
    // Hvis choice_b er tom og correct = b, peker fasiten på et tomt felt
    const correctColName = CHOICE_COLUMNS[correctIdx];
    const correctColValue = get(correctColName);
    if (!correctColValue) {
      invalid.push({
        preview: text || `Rad ${i + 2}`,
        issues: [
          `Fasit-bokstav "${get('correct')}" peker på et tomt svaralternativ (kolonne ${correctColName}). ` +
          `Fyll inn tekst i kolonnen, eller endre fasiten til et gyldig alternativ.`,
        ],
      });
      return;
    }

    drafts.push({
      text,
      type: get('type') || (choices.length === 2 ? 'true_false' : 'multiple_choice'),
      difficulty: get('difficulty') || 'lett',
      categories: get('categories')
        ? get('categories')
            .split('|')
            .map(c => c.trim())
            .filter(Boolean)
        : [],
      choices,
      correctChoiceIds: [correctLetter],
      explanation: get('explanation') || undefined,
    });
  });

  return { drafts, invalid };
}
