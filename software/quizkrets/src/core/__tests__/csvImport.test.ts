import { describe, it, expect } from 'vitest';
import { parseCsv, csvToDrafts } from '../csvImport';

const HEADER = 'text;type;difficulty;categories;correct;choice_a;choice_b;explanation';
const VALID_ROW =
  'Hva er hovedstaden i Norge?;multiple_choice;lett;geografi;a;Oslo;Bergen;Oslo ble hovedstad i 1814.';

describe('parseCsv', () => {
  it('deler på semikolon og håndterer anførselstegn med semikolon', () => {
    const rows = parseCsv('a;b;c\n"x;y";z;w');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['x;y', 'z', 'w'],
    ]);
  });

  it('ignorerer helt tomme rader', () => {
    const rows = parseCsv('a;b;c\n\n\n1;2;3\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });
});

describe('csvToDrafts (P1 #9: radvis validering i stedet for total-kast)', () => {
  it('gyldig rad blir draft med riktig fasit', () => {
    const { drafts, invalid } = csvToDrafts(parseCsv(`${HEADER}\n${VALID_ROW}`));
    expect(invalid).toHaveLength(0);
    expect(drafts).toHaveLength(1);
    const d = drafts[0] as Record<string, unknown>;
    expect(d.text).toBe('Hva er hovedstaden i Norge?');
    expect(d.correctChoiceIds).toEqual(['a']);
    expect(d.choices).toEqual([
      { id: 'a', text: 'Oslo' },
      { id: 'b', text: 'Bergen' },
    ]);
    expect(d.categories).toEqual(['geografi']);
  });

  it('ugyldig fasit-bokstav avviser kun den raden – gyldige rader beholdes', () => {
    const csv = [
      HEADER,
      VALID_ROW,
      'Hva er 2+2?;multiple_choice;lett;geografi;x;3;5;Ugyldig fasit her.',
      'Hva er hovedstaden i Sverige?;multiple_choice;lett;geografi;a;Stockholm;Gøteborg;Stockholm er hovedstad.',
    ].join('\n');
    const { drafts, invalid } = csvToDrafts(parseCsv(csv));
    expect(drafts).toHaveLength(2);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].preview).toContain('2+2');
    expect(invalid[0].issues[0]).toMatch(/Ugyldig fasit-bokstav "x"/);
  });

  it('fasit som peker på et tomt alternativ avvises med tydelig forklaring', () => {
    // correct=c, men kun to valg (a, b) – choice_c er tom
    const csv = `${HEADER}\nHvor mange kontinenter?;multiple_choice;lett;geografi;c;en;to;`;
    const { drafts, invalid } = csvToDrafts(parseCsv(csv));
    expect(drafts).toHaveLength(0);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].issues[0]).toMatch(/tomt svaralternativ/i);
    expect(invalid[0].issues[0]).toMatch(/choice_c/i);
  });

  it('manglende correct-kolonne gir avviste rader med forklaring, ikke kast', () => {
    const header = 'text;type;difficulty;categories;choice_a;choice_b';
    const { drafts, invalid } = csvToDrafts(
      parseCsv(`${header}\nHvor mange planeter?;multiple_choice;lett;geografi;åtte;ni`)
    );
    expect(drafts).toHaveLength(0);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].issues[0]).toMatch(/Ugyldig fasit-bokstav ""/);
  });

  it('rad uten tekst og valg ignoreres stille', () => {
    const { drafts, invalid } = csvToDrafts(parseCsv(`${HEADER}\n;;;;;;;\n${VALID_ROW}`));
    expect(drafts).toHaveLength(1);
    expect(invalid).toHaveLength(0);
  });

  it('kun to valg uten type defaulter til true_false', () => {
    const header = 'text;difficulty;categories;correct;choice_a;choice_b';
    const { drafts } = csvToDrafts(
      parseCsv(`${header}\nNorge ligger i Norden.;lett;geografi;a;Sant;Usant`)
    );
    expect(drafts).toHaveLength(1);
    const d = drafts[0] as Record<string, unknown>;
    expect(d.type).toBe('true_false');
  });

  it('kun overskrift (ingen datarader) gir tomt resultat', () => {
    const { drafts, invalid } = csvToDrafts(parseCsv(HEADER));
    expect(drafts).toHaveLength(0);
    expect(invalid).toHaveLength(0);
  });
});
