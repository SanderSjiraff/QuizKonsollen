import { describe, it, expect } from 'vitest';
import {
  computePoints,
  computePlayerStats,
  computeTeamResults,
  rankPlayers,
  statsBarFractions,
  type AnswerRecord,
  type ScoreConfig,
} from '../scoring';
import type { Player } from '../../types';

const players: Player[] = [
  { id: 1, name: 'Anna', color: '#f00', score: 0, isReady: true },
  { id: 2, name: 'Ben', color: '#0f0', score: 0, isReady: true },
];

const config: ScoreConfig = {
  pointsPerCorrect: 100,
  pointsPerWrong: 0,
  pointsPerUnanswered: 0,
};

function answer(overrides: Partial<AnswerRecord>): AnswerRecord {
  return {
    questionId: 'q1',
    playerId: 1,
    choiceId: 'a',
    isCorrect: true,
    timeTakenMs: 5000,
    points: 100,
    questionIndex: 0,
    roundIndex: 0,
    ...overrides,
  };
}

describe('computePoints', () => {
  it('gir full poeng for riktig svar', () => {
    expect(computePoints({ isCorrect: true, choiceId: 'a', timeTakenMs: 1000 }, config)).toBe(100);
  });

  it('gir 0 poeng for feil svar', () => {
    expect(computePoints({ isCorrect: false, choiceId: 'b', timeTakenMs: 1000 }, config)).toBe(0);
  });

  it('håndterer negative poeng for feil svar', () => {
    expect(
      computePoints(
        { isCorrect: false, choiceId: 'b', timeTakenMs: 1000 },
        { ...config, pointsPerWrong: -50 }
      )
    ).toBe(-50);
  });

  it('gir 0 poeng for ubesvart', () => {
    expect(computePoints({ isCorrect: false, choiceId: null, timeTakenMs: 0 }, config)).toBe(0);
  });

  it('gir hastighetsbonus lineært ned mot 0', () => {
    const cfg: ScoreConfig = {
      pointsPerCorrect: 100,
      pointsPerWrong: 0,
      speedBonusMax: 50,
      timeLimitMs: 10000,
    };
    // Svar umiddelbart: full bonus
    expect(computePoints({ isCorrect: true, choiceId: 'a', timeTakenMs: 0 }, cfg)).toBe(150);
    // Svar ved halvert tid: halv bonus
    expect(computePoints({ isCorrect: true, choiceId: 'a', timeTakenMs: 5000 }, cfg)).toBe(125);
    // Svar rett før tidsutløp: bonusen rundes mot 0
    expect(computePoints({ isCorrect: true, choiceId: 'a', timeTakenMs: 9999 }, cfg)).toBe(100);
  });
});

describe('computePlayerStats', () => {
  it('beregner riktig, feil, ubesvart og treffprosent', () => {
    const answers: AnswerRecord[] = [
      answer({}), // Anna riktig q1
      answer({ questionId: 'q2', isCorrect: false, choiceId: 'b', points: 0 }), // Anna feil q2
      // Anna svarte ikke på q3
    ];
    const stats = computePlayerStats(players, answers, 3);
    const anna = stats.find(s => s.playerId === 1)!;

    expect(anna.correct).toBe(1);
    expect(anna.wrong).toBe(1);
    expect(anna.unanswered).toBe(1);
    expect(anna.answered).toBe(2);
    expect(anna.totalQuestions).toBe(3);
    expect(anna.accuracy).toBe(33); // 1/3 avrundet
    expect(anna.totalPoints).toBe(100);
    expect(anna.avgAnswerTimeMs).toBe(5000);
  });

  it('spiller uten svar får alle ubesvarte', () => {
    const stats = computePlayerStats(players, [], 10);
    const ben = stats.find(s => s.playerId === 2)!;
    expect(ben.unanswered).toBe(10);
    expect(ben.correct).toBe(0);
    expect(ben.accuracy).toBe(0);
    expect(ben.avgAnswerTimeMs).toBeNull();
  });

  it('teller ubesvarte registrerte svar (tidsutløp) som ubesvart', () => {
    const answers: AnswerRecord[] = [
      answer({ choiceId: null, isCorrect: false, points: 0, timeTakenMs: 20000 }),
    ];
    const stats = computePlayerStats(players, answers, 1);
    const anna = stats.find(s => s.playerId === 1)!;
    expect(anna.unanswered).toBe(1); // registrert timeout teller som ubesvart
    expect(anna.answered).toBe(0); // …men ga ikke noe valgt svar
    expect(anna.correct).toBe(0);
    expect(anna.wrong).toBe(0);
  });
});

describe('rankPlayers', () => {
  it('sorterer etter poeng, deretter antall riktige', () => {
    const stats = computePlayerStats(
      players,
      [
        answer({ playerId: 1, points: 100 }),
        answer({ playerId: 1, questionId: 'q2' }),
        answer({ playerId: 2, points: 100 }),
        answer({ playerId: 2, questionId: 'q2', isCorrect: false, choiceId: 'b', points: 0 }),
      ],
      2
    );
    const ranked = rankPlayers(stats);
    expect(ranked[0].playerId).toBe(1);
    expect(ranked[1].playerId).toBe(2);
  });
});

describe('computeTeamResults', () => {
  it('aggregerer poeng og riktige per lag', () => {
    const answers: AnswerRecord[] = [
      answer({ playerId: 1 }), // Lag 1 riktig
      answer({ playerId: 2, questionId: 'q2', isCorrect: false, choiceId: 'x', points: 0 }), // Lag 2 feil
    ];
    const stats = computePlayerStats(players, answers, 2);
    const teams = computeTeamResults(
      [{ id: 1, name: 'Lag A', color: '#f00', playerIds: [1] }, { id: 2, name: 'Lag B', color: '#0f0', playerIds: [2] }],
      stats
    );

    const lagA = teams.find(t => t.teamId === 1)!;
    const lagB = teams.find(t => t.teamId === 2)!;
    expect(lagA.totalPoints).toBe(100);
    expect(lagA.correct).toBe(1);
    expect(lagB.totalPoints).toBe(0);
    expect(lagB.wrong).toBe(1);
  });
});

describe('statsBarFractions (resultatgraf, P1 #4)', () => {
  it('spiller: andelene summerer seg til 100 med totalQuestions som nevner', () => {
    // Spiller med 10 spørsmål: 5 riktige, 2 feil, 3 ubesvarte
    const f = statsBarFractions({ correct: 5, wrong: 2, unanswered: 3 });
    expect(f.correct).toBe(50);
    expect(f.wrong).toBe(20);
    expect(f.unanswered).toBe(30);
    expect(f.correct + f.wrong + f.unanswered).toBeCloseTo(100);
  });

  it('lag: nevneren er summen over ALLE svamuligheter (spillere × spørsmål)', () => {
    // Lag med 2 spillere × 10 spørsmål = 20 svarmuligheter:
    // 8 riktige, 4 feil, 8 ubesvarte. Med gammel feil nevner (10) ble
    // stolpene 200 % av bredden; nå skal de summere seg til 100 %.
    const f = statsBarFractions({ correct: 8, wrong: 4, unanswered: 8 });
    expect(f.correct).toBe(40);
    expect(f.wrong).toBe(20);
    expect(f.unanswered).toBe(40);
    expect(f.correct + f.wrong + f.unanswered).toBeCloseTo(100);
  });

  it('null svarmuligheter gir tom graf uten divisjon med null', () => {
    const f = statsBarFractions({ correct: 0, wrong: 0, unanswered: 0 });
    expect(f.correct).toBe(0);
    expect(f.wrong).toBe(0);
    expect(f.unanswered).toBe(0);
  });
});
