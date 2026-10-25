/**
 * Poengberegning og svarstatistikk.
 * Holdes helt adskilt fra React, slik at reglene kan enhetstestes og poengreglene
 * kan endres uten å påvirke selve svarregistreringen.
 */

import type { Player } from '../types';

/** Ett registrert svar. choiceId === null betyr ubesvart (tidsutløp eller hoppet over). */
export interface AnswerRecord {
  questionId: string;
  playerId: number;
  choiceId: string | null;
  isCorrect: boolean;
  timeTakenMs: number;
  points: number;
  /** Indeks i rundens spørsmålsliste. */
  questionIndex: number;
  roundIndex: number;
}

/** Regler for poenggivning. Uavhengig av antall riktige/gale svar. */
export interface ScoreConfig {
  pointsPerCorrect: number;
  pointsPerWrong: number;
  /** Poeng for ubesvarte spørsmål (vanligvis 0). */
  pointsPerUnanswered?: number;
  /** Raskt svar gir bonuspoeng lineært ned mot 0 ved tidsutløp. */
  speedBonusMax?: number;
  /** Total tid per spørsmål i ms – kreves for speedBonusMax. */
  timeLimitMs?: number;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  pointsPerCorrect: 100,
  pointsPerWrong: 0,
  pointsPerUnanswered: 0,
};

/** Full statistikk for én spiller. */
export interface PlayerStats {
  playerId: number;
  playerName: string;
  playerColor: string;
  correct: number;
  wrong: number;
  unanswered: number;
  /** Antall spørsmål spilleren faktisk ga et svar på (riktig + galt). */
  answered: number;
  /** Totalt antall spørsmål i runden. */
  totalQuestions: number;
  /** Andel riktige av totalt antall spørsmål, 0–100. */
  accuracy: number;
  totalPoints: number;
  /** Gjennomsnittlig svartid i ms for besvarte spørsmål, null hvis ingen. */
  avgAnswerTimeMs: number | null;
}

/** Aggregert resultat for ett lag. */
export interface TeamResult {
  teamId: number;
  name: string;
  color: string;
  totalPoints: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  players: PlayerStats[];
}

/** Regn ut poeng for ett svar basert på reglene. */
export function computePoints(
  answer: { isCorrect: boolean; choiceId: string | null; timeTakenMs: number },
  config: ScoreConfig
): number {
  // Ubesvart
  if (answer.choiceId === null) {
    return config.pointsPerUnanswered ?? 0;
  }
  let points = answer.isCorrect ? config.pointsPerCorrect : config.pointsPerWrong;
  // Eventuell speed-bonus (kun for riktige svar)
  if (answer.isCorrect && config.speedBonusMax && config.timeLimitMs && config.timeLimitMs > 0) {
    const fraction = Math.max(0, Math.min(1, 1 - answer.timeTakenMs / config.timeLimitMs));
    points += Math.round(config.speedBonusMax * fraction);
  }
  return points;
}

/**
 * Beregn full statistikk per spiller fra svarhistorikken.
 * Spillere uten registrerte svar får unanswered = totalQuestions.
 */
export function computePlayerStats(
  players: Player[],
  answers: AnswerRecord[],
  totalQuestions: number
): PlayerStats[] {
  return players.map(player => {
    const playerAnswers = answers.filter(a => a.playerId === player.id);
    const correct = playerAnswers.filter(a => a.isCorrect).length;
    const answered = playerAnswers.filter(a => a.choiceId !== null).length;
    const wrong = answered - correct;
    const unanswered = Math.max(0, totalQuestions - answered);
    const answeredTimes = playerAnswers
      .filter(a => a.choiceId !== null)
      .map(a => a.timeTakenMs);
    const totalPoints = playerAnswers.reduce((sum, a) => sum + a.points, 0);

    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      correct,
      wrong,
      unanswered,
      answered,
      totalQuestions,
      accuracy: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
      totalPoints,
      avgAnswerTimeMs:
        answeredTimes.length > 0
          ? Math.round(answeredTimes.reduce((s, t) => s + t, 0) / answeredTimes.length)
          : null,
    };
  });
}

/** Aggreger spillernes statistikk til lagresultater.
 *
 * Når hver spiller svarer individuelt (hot-seat), er den totale mulige
 * poengsummen antall spillere × antall spørsmål. accuracy vil da aldri
 * overstige 100 %.  */
export function computeTeamResults(
  teams: { id: number; name: string; color: string; playerIds: number[] }[],
  playerStats: PlayerStats[]
): TeamResult[] {
  return teams.map(team => {
    const players = playerStats.filter(p => team.playerIds.includes(p.playerId));
    const correct = players.reduce((s, p) => s + p.correct, 0);
    const wrong = players.reduce((s, p) => s + p.wrong, 0);
    const unanswered = players.reduce((s, p) => s + p.unanswered, 0);
    const totalPoints = players.reduce((s, p) => s + p.totalPoints, 0);
    const totalQuestions = players[0]?.totalQuestions ?? 0;
    const totalAnswerable = totalQuestions * Math.max(1, players.length);

    return {
      teamId: team.id,
      name: team.name,
      color: team.color,
      totalPoints,
      correct,
      wrong,
      unanswered,
      accuracy: totalAnswerable > 0 ? Math.round((correct / totalAnswerable) * 100) : 0,
      players,
    };
  });
}

/** Sorter spillere etter poeng (synkende), deretter antall riktige, deretter navn. */
export function rankPlayers(stats: PlayerStats[]): PlayerStats[] {
  return [...stats].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.correct - a.correct ||
      a.playerName.localeCompare(b.playerName, 'no')
  );
}

/** Ranger lag etter samlet poengsum. */
export function rankTeams(results: TeamResult[]): TeamResult[] {
  return [...results].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.correct - a.correct ||
      a.name.localeCompare(b.name, 'no')
  );
}
