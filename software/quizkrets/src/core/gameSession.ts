/**
 * GameSession: holder styr på alle registrerte svar i én quiz.
 *
 * Sentrale garantier:
 * - Et svar kan kun registreres én gang per (spørsmål, spiller) –
 *   dobbeltklikk, gjentatte tastehendelser og kappløp mellom timeout og
 *   klikk kan ikke gi duplikater.
 * - Poeng beregnes sentralt via computePoints (reglene kan endres uavhengig).
 * - Ubesvarte spørsmål (tidsutløp) registreres eksplisitt med choiceId = null.
 */

import type { Question } from '../types';
import {
  type AnswerRecord,
  type ScoreConfig,
  computePoints,
} from './scoring';

export interface RegisterAnswerParams {
  question: Question;
  questionIndex: number;
  roundIndex: number;
  playerId: number;
  choiceId: string;
  /** Millisekunder fra spørsmålet ble vist til svaret ble gitt. */
  timeTakenMs: number;
}

export interface RegisterUnansweredParams {
  question: Question;
  questionIndex: number;
  roundIndex: number;
  playerId: number;
  /** true hvis spilleren ble avbrutt av tidsutløp, false ved aktivt hopp over. */
  timedOut: boolean;
}

export class GameSession {
  private answers = new Map<string, AnswerRecord>();
  private startedAt: number | null = null;
  private endedAt: number | null = null;
  private pausedMs = 0;
  private pauseStart: number | null = null;

  /** Unik nøkkel per (spørsmål, spiller). */
  private key(questionId: string, playerId: number): string {
    return `${questionId}::${playerId}`;
  }

  /** true hvis spilleren allerede har svart på spørsmålet. */
  hasAnswered(questionId: string, playerId: number): boolean {
    return this.answers.has(this.key(questionId, playerId));
  }

  /**
   * Registrer et besvart spørsmål.
   * Returnerer null hvis svaret allerede finnes (duplikat beskyttes).
   */
  registerAnswer(params: RegisterAnswerParams, config: ScoreConfig): AnswerRecord | null {
    const { question, playerId, choiceId } = params;
    const k = this.key(question.id, playerId);
    if (this.answers.has(k)) return null;

    const isCorrect = question.correctChoiceIds.includes(choiceId);
    const record: AnswerRecord = {
      questionId: question.id,
      playerId,
      choiceId,
      isCorrect,
      timeTakenMs: Math.max(0, Math.round(params.timeTakenMs)),
      points: computePoints({ isCorrect, choiceId, timeTakenMs: params.timeTakenMs }, config),
      questionIndex: params.questionIndex,
      roundIndex: params.roundIndex,
    };
    this.answers.set(k, record);
    return record;
  }

  /**
   * Registrer ubesvart spørsmål (tidsutløp eller overgang uten svar).
   * Returnerer null hvis det allerede finnes et svar.
   */
  registerUnanswered(
    params: RegisterUnansweredParams,
    config: ScoreConfig
  ): AnswerRecord | null {
    const { question, playerId } = params;
    const k = this.key(question.id, playerId);
    if (this.answers.has(k)) return null;

    const record: AnswerRecord = {
      questionId: question.id,
      playerId,
      choiceId: null,
      isCorrect: false,
      timeTakenMs: params.timedOut ? (config.timeLimitMs ?? 0) : 0,
      points: config.pointsPerUnanswered ?? 0,
      questionIndex: params.questionIndex,
      roundIndex: params.roundIndex,
    };
    this.answers.set(k, record);
    return record;
  }

  /** Alle registrerte svar i registreringsrekkefølge. */
  getAnswers(): AnswerRecord[] {
    return [...this.answers.values()];
  }

  /** Svar for ett spørsmål, per spiller. */
  getAnswersForQuestion(questionId: string): AnswerRecord[] {
    return [...this.answers.values()].filter(a => a.questionId === questionId);
  }

  /** Total poengsum per spiller. */
  getScores(): Record<number, number> {
    const scores: Record<number, number> = {};
    for (const a of this.answers.values()) {
      scores[a.playerId] = (scores[a.playerId] ?? 0) + a.points;
    }
    return scores;
  }

  /** Start spillet (kalles når spilleren forlater lobbyen). */
  start(): void {
    if (this.startedAt === null) {
      this.startedAt = Date.now();
    }
  }

  getStartTime(): number | null {
    return this.startedAt;
  }

  /** Faktisk spilletid i millisekunder, ekskludert pausetid. */
  getDurationMs(): number {
    if (this.startedAt === null) return 0;
    const end = this.endedAt ?? Date.now();
    let duration = end - this.startedAt - this.pausedMs;
    if (this.pauseStart !== null) {
      duration -= (end - this.pauseStart);
    }
    return Math.max(0, duration);
  }

  /**Pause spillet og begynn å telle pausetid.  */
  pause(): void {
    if (this.pauseStart === null) {
      this.pauseStart = Date.now();
    }
  }

  /** Gjenoppta etter pause. */
  resume(): void {
    if (this.pauseStart !== null) {
      this.pausedMs += Date.now() - this.pauseStart;
      this.pauseStart = null;
    }
  }

  endSession(): void {
    if (this.endedAt === null) {
      this.endedAt = Date.now();
    }
  }

  /** Tilbakestill (brukes ved "spill igjen" uten ny session). */
  reset(): void {
    this.answers.clear();
    this.startedAt = null;
    this.endedAt = null;
    this.pausedMs = 0;
    this.pauseStart = null;
  }
}
