import { describe, it, expect } from 'vitest';
import { matchTheme } from '../themeMatcher';

describe('matchTheme', () => {
  it('gjenkjenner norske aliaser', () => {
    const result = matchTheme('Dinosaurer');
    expect(result.recognized).toBe(true);
    expect(result.externalTags).toContain('dinosaurs');
  });

  it('gjenkjenner engelske aliaser', () => {
    const result = matchTheme('The Beatles');
    expect(result.recognized).toBe(true);
    expect(result.externalTags).toContain('the_beatles');
  });

  it('mapper "andre verdenskrig" til tags', () => {
    const result = matchTheme('Andre verdenskrig');
    expect(result.recognized).toBe(true);
    expect(result.externalTags).toContain('world_war_2');
  });

  it('gjenkjenner interne kategorier direkte', () => {
    const result = matchTheme('historie');
    expect(result.recognized).toBe(true);
    expect(result.internalCategories).toContain('historie');
  });

  it('returnerer ikke-gjenkjent for ukjent tema', () => {
    const result = matchTheme('xyz-tema-finnes-ikke');
    expect(result.recognized).toBe(false);
    expect(result.message).toMatch(/Fant ingen/i);
  });

  it('normaliserer aksenter og tegnsetting', () => {
    const result = matchTheme('  Dinosaurer!!  ');
    expect(result.recognized).toBe(true);
    expect(result.externalTags).toContain('dinosaurs');
  });

  it('gjør delvis ordmatching', () => {
    const result = matchTheme('norsk historie quiz');
    expect(result.recognized).toBe(true);
    expect(result.internalCategories.length).toBeGreaterThan(0);
  });
});
