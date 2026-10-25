import type { Player, Team } from '../types';

/**
 * Bygg to lag fra spillernes teamId (P1 #7).
 *
 * Delt hjelper brukt av både quizbyggeren (der brukeren kan flytte spillere
 * mellom lag) og spillmotoren (som sikrer at lagstrukturen alltid stemmer
 * uansett startpunkt: bygger, lagret quiz, tilfeldig quiz).
 *
 * Fordelingsregel: eksplisitt teamId brukes; ellers havner spillere med odd
 * ID i lag 1 og spillere med even ID i lag 2.
 */
export function buildTeams(players: Player[]): Team[] {
  return [1, 2].map(teamId => ({
    id: teamId,
    name: `Lag ${teamId}`,
    color: teamId === 1 ? '#3B82F6' : '#F59E0B',
    score: 0,
    playerIds: players.filter(p => (p.teamId ?? (p.id % 2 === 1 ? 1 : 2)) === teamId).map(p => p.id),
  }));
}
