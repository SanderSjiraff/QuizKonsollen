import { describe, it, expect } from 'vitest';
import { buildTeams, validateTeams } from '../teams';
import type { Player } from '../../types';

function makePlayer(id: number, teamId?: number): Player {
  return { id, name: `Spiller ${id}`, color: '#f00', score: 0, isReady: true, teamId };
}

describe('buildTeams (P1 #7: lagstruktur fra alle startpunkter)', () => {
  it('fordeler spillere uten teamId på lag 1/2 etter odd/even-ID', () => {
    const players = [makePlayer(1), makePlayer(2), makePlayer(3), makePlayer(4)];
    const teams = buildTeams(players);
    expect(teams).toHaveLength(2);
    expect(teams[0].playerIds).toEqual([1, 3]);
    expect(teams[1].playerIds).toEqual([2, 4]);
    expect(teams[0].name).toBe('Lag 1');
    expect(teams[1].name).toBe('Lag 2');
  });

  it('respekterer eksplisitt teamId fra quizbyggeren', () => {
    const players = [
      makePlayer(1, 2), // Flyttet til lag 2 i byggeren
      makePlayer(2, 1), // Flyttet til lag 1 i byggeren
    ];
    const teams = buildTeams(players);
    expect(teams[0].playerIds).toEqual([2]);
    expect(teams[1].playerIds).toEqual([1]);
  });

  it('spillere uten teamId blant eksplisitte fordeles etter standardregelen', () => {
    const players = [makePlayer(1, 2), makePlayer(2), makePlayer(3)];
    const teams = buildTeams(players);
    // Spiller 2: even → lag 2; spiller 3: odd → lag 1
    expect(teams[0].playerIds).toEqual([3]);
    expect(teams[1].playerIds).toEqual([1, 2]);
  });

  it('tom spillerliste gir to tomme lag (resultatskjermen håndterer resten)', () => {
    const teams = buildTeams([]);
    expect(teams).toHaveLength(2);
    expect(teams[0].playerIds).toEqual([]);
    expect(teams[1].playerIds).toEqual([]);
  });
});

describe('validateTeams (A4)', () => {
  it('godkjenner gyldig lagoppsett med 2+ spillere', () => {
    const players = [makePlayer(1), makePlayer(2), makePlayer(3)];
    const result = validateTeams(players);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('avviser lag-modus med bare én spiller', () => {
    const players = [makePlayer(1)];
    const result = validateTeams(players);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('minst 2'))).toBe(true);
  });

  it('avviser tomme lag', () => {
    const players = [makePlayer(1, 1), makePlayer(2, 1)]; // Alle på lag 1 – lag 2 blir tomt
    const result = validateTeams(players);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Lag 2') && e.includes('ingen spillere'))).toBe(true);
  });

  it('avviser ugyldig teamId', () => {
    const players = [
      { id: 1, name: 'Spiller 1', color: '#f00', score: 0, isReady: true, teamId: 99 },
      makePlayer(2, 1),
    ];
    const result = validateTeams(players);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ugyldig lagtilordning'))).toBe(true);
  });
});
