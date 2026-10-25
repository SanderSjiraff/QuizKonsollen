import type { Player, Team } from '../types';

export interface TeamValidationResult {
  valid: boolean;
  errors: string[];
}

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

/**
 * Valider at lagoppsettet er gyldig før quizen starter (A4).
 *
 * Krav:
 * - Minst 2 spillere totalt
 * - Ingen tomme lag
 * - Alle spillere har gyldig teamId (1 eller 2)
 */
export function validateTeams(players: Player[]): TeamValidationResult {
  const errors: string[] = [];

  if (players.length < 2) {
    errors.push('Lag-modus krever minst 2 spillere.');
  }

  const teams = buildTeams(players);
  for (const team of teams) {
    if (team.playerIds.length === 0) {
      errors.push(`${team.name} har ingen spillere.`);
    }
  }

  for (const player of players) {
    const teamId = player.teamId ?? (player.id % 2 === 1 ? 1 : 2);
    if (teamId !== 1 && teamId !== 2) {
      errors.push(`${player.name} har ugyldig lagtilordning.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
