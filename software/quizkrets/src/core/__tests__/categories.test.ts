import { describe, it, expect } from 'vitest';
import {
  migrateCategories,
  matchesSelection,
  expandSelection,
  getTopLevelCategory,
  pickDisplayCategory,
  UNRESOLVED_CATEGORY,
} from '../categories';

describe('migrateCategories', () => {  it('mapper gamle interne navn til nye IDer', () => {
    expect(migrateCategories(['naturvitenskap'])).toContain('vitenskap');
    expect(migrateCategories(['vitenskap_natur'])).toContain('vitenskap');
    expect(migrateCategories(['videospill'])).toContain('gaming');
    expect(migrateCategories(['data'])).toContain('datamaskiner');
    expect(migrateCategories(['film'])).toContain('film-og-tv');
    expect(migrateCategories(['tv'])).toContain('film-og-tv');
  });

  it('mapper OpenTDB-engelske navn', () => {
    expect(migrateCategories(['Science & Nature'])).toContain('vitenskap');
    expect(migrateCategories(['Entertainment: Video Games'])).toContain('gaming');
    expect(migrateCategories(['General Knowledge'])).toContain('generell-kunnskap');
  });

  it('bevarer gyldige nye IDer uendret', () => {
    const result = migrateCategories(['historie', 'sport']);
    expect(result).toContain('historie');
    expect(result).toContain('sport');
  });

  it('legger til hovedkategori når underkategori brukes', () => {
    const result = migrateCategories(['norsk-historie']);
    expect(result).toContain('norsk-historie');
    expect(result).toContain('historie');
  });

  it('merker ukjente kategorier for gjennomgang i stedet for å gjette', () => {
    const result = migrateCategories(['ukjent-kategori-xyz']);
    expect(result).toContain(UNRESOLVED_CATEGORY);
  });

  it('dedupliserer', () => {
    const result = migrateCategories(['gaming', 'videospill', 'gaming']);
    expect(result.filter(c => c === 'gaming').length).toBe(1);
  });
});

describe('expandSelection / matchesSelection', () => {
  it('hovedkategori inkluderer alle underkategorier', () => {
    const expanded = expandSelection(['historie']);
    expect(expanded.has('norsk-historie')).toBe(true);
    expect(expanded.has('verdenshistorie')).toBe(true);
    expect(expanded.has('sport')).toBe(false);
  });

  it('matcher spørsmål med underkategori mot hovedkategori-filter', () => {
    expect(matchesSelection(['norsk-historie'], ['historie'])).toBe(true);
    expect(matchesSelection(['sport'], ['historie'])).toBe(false);
  });

  it('tomt utvalg matcher alt', () => {
    expect(matchesSelection(['whatever'], [])).toBe(true);
  });
});

describe('getTopLevelCategory', () => {
  it('finner hovedkategori for underkategorier', () => {
    expect(getTopLevelCategory('fysikk')).toBe('vitenskap');
    expect(getTopLevelCategory('historie')).toBe('historie');
    expect(getTopLevelCategory('finnes-ikke')).toBeUndefined();
  });
});

describe('pickDisplayCategory (P2 #11: etikett viser matchende kategori)', () => {
  it('viser kategorien som matchet valget – ikke første tilfeldige kategori', () => {
    // q12-mønster: teknologi-først, men valgt via historie-underkategori
    const cats = ['teknologi', 'datamaskiner', 'historiske-personer'];
    expect(pickDisplayCategory(cats, ['historie'])).toBe('historiske-personer');
  });

  it('viser direkte valgt hovedkategori når den fins på spørsmålet', () => {
    expect(pickDisplayCategory(['teknologi', 'datamaskiner'], ['teknologi'])).toBe('teknologi');
  });

  it('viser direkte valgt underkategori', () => {
    expect(
      pickDisplayCategory(['sport', 'historiske-personer'], ['historiske-personer'])
    ).toBe('historiske-personer');
  });

  it('flere valg: første spørsmålskategori som matcher vises', () => {
    expect(
      pickDisplayCategory(['sport', 'fotball'], ['historie', 'sport'])
    ).toBe('sport');
  });

  it('ingen match: fall tilbake på første kategori', () => {
    expect(pickDisplayCategory(['sport', 'fotball'], ['historie'])).toBe('sport');
  });

  it('tomt valg gir første kategori', () => {
    expect(pickDisplayCategory(['sport', 'fotball'], [])).toBe('sport');
  });

  it('tom kategoriliste gir undefined', () => {
    expect(pickDisplayCategory([], ['historie'])).toBeUndefined();
    expect(pickDisplayCategory([], [])).toBeUndefined();
  });
});
