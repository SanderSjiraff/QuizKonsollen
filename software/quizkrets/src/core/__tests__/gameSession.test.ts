import { describe, it, expect } from 'vitest';
import { GameSession } from '../gameSession';
import type { Question } from '../../types';
import { DEFAULT_SCORE_CONFIG } from '../scoring';

const question: Question = {
  id: 'q1',
  text: 'Hva er 2 + 2?',
  type: 'multiple_choice',
  difficulty: 'lett',
  categories: ['generell-kunnskap'],
  choices: [
    { id: 'a', text: '3' },
    { id: 'b', text: '4' },
  ],
  correctChoiceIds: ['b'],
};

const config = { ...DEFAULT_SCORE_CONFIG };

describe('GameSession', () => {
  it('registrerer riktig svar med poeng', () => {
    const session = new GameSession();
    const record = session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 3000 },
      config
    );

    expect(record).not.toBeNull();
    expect(record!.isCorrect).toBe(true);
    expect(record!.points).toBe(100);
    expect(record!.timeTakenMs).toBe(3000);
    expect(session.getScores()[1]).toBe(100);
  });

  it('registrerer feil svar', () => {
    const session = new GameSession();
    const record = session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'a', timeTakenMs: 3000 },
      config
    );

    expect(record!.isCorrect).toBe(false);
    expect(record!.points).toBe(0);
  });

  it('avviser duplikatsvar fra samme spiller på samme spørsmål', () => {
    const session = new GameSession();
    const first = session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1000 },
      config
    );
    const duplicate = session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'a', timeTakenMs: 2000 },
      config
    );

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
    // Bare det første svaret teller
    expect(session.getAnswers().length).toBe(1);
    expect(session.getScores()[1]).toBe(100);
  });

  it('tillater ulike spillere på samme spørsmål', () => {
    const session = new GameSession();
    session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1000 },
      config
    );
    const second = session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 2, choiceId: 'a', timeTakenMs: 1500 },
      config
    );

    expect(second).not.toBeNull();
    expect(session.getAnswers().length).toBe(2);
  });

  it('registrerer ubesvart ved tidsutløp', () => {
    const session = new GameSession();
    const record = session.registerUnanswered(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, timedOut: true },
      { ...config, timeLimitMs: 20000 }
    );

    expect(record!.choiceId).toBeNull();
    expect(record!.isCorrect).toBe(false);
    expect(record!.points).toBe(0);
  });

  it('avviser ubesvart-registrering hvis spilleren allerede har svart', () => {
    const session = new GameSession();
    session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1000 },
      config
    );
    const late = session.registerUnanswered(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, timedOut: true },
      config
    );

    expect(late).toBeNull();
    expect(session.getAnswers().length).toBe(1);
  });

  it('hasAnswered avgjør duplikater før registrering', () => {
    const session = new GameSession();
    expect(session.hasAnswered('q1', 1)).toBe(false);
    session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1000 },
      config
    );
    expect(session.hasAnswered('q1', 1)).toBe(true);
    expect(session.hasAnswered('q1', 2)).toBe(false);
  });

  it('henter svar kun for ett spørsmål', () => {
    const session = new GameSession();
    session.registerAnswer(
      { question, questionIndex: 0, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1000 },
      config
    );
    session.registerAnswer(
      { question: { ...question, id: 'q2' }, questionIndex: 1, roundIndex: 0, playerId: 1, choiceId: 'b', timeTakenMs: 1200 },
      config
    );

    expect(session.getAnswersForQuestion('q1').length).toBe(1);
    expect(session.getAnswersForQuestion('q2').length).toBe(1);
  });

  it('måler spilletid og kan avsluttes', () => {
    const session = new GameSession();
    session.endSession();
    expect(session.getDurationMs()).toBeGreaterThanOrEqual(0);
    // endSession er idempotent
    session.endSession();
    expect(session.getDurationMs()).toBeGreaterThanOrEqual(0);
  });
});
