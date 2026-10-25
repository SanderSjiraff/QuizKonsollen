/**
 * Sentral spilltilstand (game engine).
 *
 * Ansvar:
 * - Konfigurasjon av quiz (kategorier, vanskeligheter, modus, tid, poeng, spillere, lag).
 * - Streng spørsmålsuttrekk via selectQuestions – valgte filtre ignoreres ALDRI.
 * - Registrering av svar via GameSession (beskytter mot duplikater).
 * - Full statistikk per spiller og lag, beregnet med computePlayerStats.
 * - Historikk med faktiske data lagres automatisk ved avslutning.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { Screen, Player, Question, GameMode, Team, Difficulty } from '../types';
import { DEFAULT_PLAYERS } from '../data/mockData';
import { getQuestions } from '../data/questionStore';
import { saveQuizHistory } from '../data/quizHistory';
import { GameSession } from '../core/gameSession';
import {
  type PlayerStats,
  type TeamResult,
  type ScoreConfig,
  computePlayerStats,
  computeTeamResults,
  rankPlayers,
  rankTeams,
} from '../core/scoring';
import {
  type SelectionCriteria,
  type SelectionResult,
  selectQuestions,
  selectDistributed,
  countAvailable,
} from '../core/questionSelector';

const USED_QUESTIONS_KEY = 'quizkrets_used_question_ids';

/** Brukte spørsmåls-IDer (unngår at samme spørsmål stilles igjen). */
export function getUsedQuestionIds(): Set<string> {
  try {
    const data = localStorage.getItem(USED_QUESTIONS_KEY);
    if (!data) return new Set();
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

export function saveUsedQuestionIds(ids: Set<string>): void {
  try {
    localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error('Kunne ikke lagre brukte spørsmål:', error);
  }
}

export function resetUsedQuestionIds(): void {
  localStorage.removeItem(USED_QUESTIONS_KEY);
}

export interface GameConfig {
  quizName: string;
  selectedCategories: string[];
  selectedDifficulties: string[];
  questionCount: number;
  /** Vekter per kategori-ID (sum trenger ikke være 100). */
  categoryWeights?: Record<string, number>;
  gameMode: GameMode;
  /** Sekunder per spørsmål. */
  timePerQuestion: number;
  pointsPerCorrect: number;
  pointsPerWrong: number;
  /** Bonus for raske svar (lineært ned mot 0 ved tidsutløp). */
  bonusForSpeed: boolean;
  players: Player[];
  teams: Team[];
}

export interface StartGameOptions {
  /** Ferdig filtrerte spørsmål (stilt av GameSetup/QuizBuilder). */
  questions?: Question[];
  /** Tillat gjenbruk av tidligere brukte spørsmål hvis det ikke finnes nok nye. */
  allowReuse?: boolean;
  /**
   * Konfigurasjonsendringer som skal gjelde FØR uttrekket.
   * Nødvendig når kalleren oppdaterer config og starter i samme hendelse
   * (ellers ville uttrekket brukt gammel config på grunn av Reacts asynkrone setState).
   */
  configUpdates?: Partial<GameConfig>;
}

/** Feilinformasjon når uttrekk ikke kunne oppfylle kriteriene. */
export interface SelectionError {
  requested: number;
  available: number;
  missing: number;
  availableWithReuse: number;
}

export function useGameEngine() {
  const [screen, setScreen] = useState<Screen>('main-menu');
  const [config, setConfig] = useState<GameConfig>({
    quizName: 'Tilfeldig quiz',
    selectedCategories: [],
    selectedDifficulties: ['lett', 'middels'],
    questionCount: 10,
    gameMode: 'classic',
    timePerQuestion: 20,
    pointsPerCorrect: 100,
    pointsPerWrong: 0,
    bonusForSpeed: false,
    players: DEFAULT_PLAYERS.map(p => ({ ...p })),
    teams: [],
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectionError, setSelectionError] = useState<SelectionError | null>(null);
  /** Økes ved hver svarregistrering for å trigge recompute av avledede data. */
  const [answerVersion, setAnswerVersion] = useState(0);

  const sessionRef = useRef<GameSession>(new GameSession());

  const navigateTo = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
  }, []);

  const updateConfig = useCallback((updates: Partial<GameConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePlayer = useCallback((playerId: number, updates: Partial<Player>) => {
    setConfig(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === playerId ? { ...p, ...updates } : p)),
    }));
  }, []);

  /** Poengregler for gjeldende config. */
  const scoreConfig = useMemo<ScoreConfig>(
    () => ({
      pointsPerCorrect: config.pointsPerCorrect,
      pointsPerWrong: config.pointsPerWrong,
      pointsPerUnanswered: 0,
      ...(config.bonusForSpeed
        ? { speedBonusMax: Math.round(config.pointsPerCorrect * 0.5), timeLimitMs: config.timePerQuestion * 1000 }
        : {}),
    }),
    [config.pointsPerCorrect, config.pointsPerWrong, config.bonusForSpeed, config.timePerQuestion]
  );

  /** Tilgjengelighet for kriterier – brukes av QuizBuilder/GameSetup for visning. */
  const getAvailability = useCallback(
    (criteria: {
      categories: string[];
      difficulties: Difficulty[];
      count?: number;
    }): { fresh: number; withReuse: number } => {
      return countAvailable(getQuestions(), {
        categories: criteria.categories,
        difficulties: criteria.difficulties,
        count: criteria.count ?? 0,
        excludeIds: [...getUsedQuestionIds()],
      });
    },
    []
  );

  /**
   * Start en quiz.
   * Med `options.questions` brukes de ferdig stilte spørsmålene direkte.
   * Uten: streng uttrekk fra spørsmålsbanken. Hvis antallet ikke strekker til
   * settes selectionError og ingenting startes – det er ALDRI fallback til
   * andre kategorier eller vanskelighetsgrader enn brukeren har valgt.
   */
  const startGame = useCallback(
    (options?: StartGameOptions): boolean => {
      setSelectionError(null);

      // Slå sammen config-overstyringer FØR uttrekk (unngår stale state).
      const effectiveConfig = options?.configUpdates
        ? { ...config, ...options.configUpdates }
        : config;
      if (options?.configUpdates) {
        setConfig(effectiveConfig);
      }

      let selected: Question[];
      if (options?.questions && options.questions.length > 0) {
        selected = options.questions;
      } else {
        const criteria: SelectionCriteria & { weights?: Record<string, number> } = {
          categories: effectiveConfig.selectedCategories,
          difficulties: effectiveConfig.selectedDifficulties as Difficulty[],
          count: effectiveConfig.questionCount,
          excludeIds: [...getUsedQuestionIds()],
          allowReuse: options?.allowReuse ?? false,
        };
        const hasWeights = effectiveConfig.categoryWeights &&
          Object.keys(effectiveConfig.categoryWeights).length > 0 &&
          effectiveConfig.selectedCategories.length > 0;
        const result: SelectionResult = hasWeights
          ? selectDistributed(getQuestions(), { ...criteria, weights: effectiveConfig.categoryWeights })
          : selectQuestions(getQuestions(), criteria);
        if (!result.ok) {
          setSelectionError({
            requested: result.requested,
            available: result.availableCount,
            missing: result.missing,
            availableWithReuse: result.availableWithReuse,
          });
          return false;
        }
        selected = result.questions;
      }

      sessionRef.current = new GameSession();
      setAnswerVersion(v => v + 1);
      setQuestions(selected);
      setCurrentQuestionIndex(0);
      setScreen('lobby');
      return true;
    },
    [config]
  );

  const startGameplay = useCallback(() => {
    sessionRef.current.start();
    setScreen('game-play');
  }, []);

  const pauseGame = useCallback(() => {
    sessionRef.current.pause();
  }, []);

  const resumeGame = useCallback(() => {
    sessionRef.current.resume();
  }, []);

  /**
   * Registrer ett svar. Returnerer false hvis spilleren allerede har svart
   * (duplikatbeskyttelse mot dobbeltklikk og gjentatte inputhendelser).
   */
  const registerAnswer = useCallback(
    (playerId: number, choiceId: string, timeTakenMs: number): boolean => {
      const question = questions[currentQuestionIndex];
      if (!question) return false;
      const record = sessionRef.current.registerAnswer(
        {
          question,
          questionIndex: currentQuestionIndex,
          roundIndex: 0,
          playerId,
          choiceId,
          timeTakenMs,
        },
        scoreConfig
      );
      if (record) {
        setAnswerVersion(v => v + 1);
        return true;
      }
      return false;
    },
    [questions, currentQuestionIndex, scoreConfig]
  );

  /** Hvilke spillere har svart på gjeldende spørsmål? */
  const getQuestionAnswers = useCallback(
    (questionId: string) => sessionRef.current.getAnswersForQuestion(questionId),
    []
  );

  /** Hele svarhistorikken (til Results og historikk). */
  const getAnswers = useCallback(() => sessionRef.current.getAnswers(), []);

  /** Faktisk spilletid i ms. */
  const getDurationMs = useCallback(() => sessionRef.current.getDurationMs(), []);

  /**
   * Avslutt gjeldende spørsmål: spillere som ikke har svart får registrert
   * ubesvart. Kalles ved tidsutløp OG ved manuell neste-spørsmål.
   */
  const finishCurrentQuestion = useCallback(
    (timedOut: boolean) => {
      const question = questions[currentQuestionIndex];
      if (!question) return;
      for (const player of config.players) {
        if (!sessionRef.current.hasAnswered(question.id, player.id)) {
          sessionRef.current.registerUnanswered(
            {
              question,
              questionIndex: currentQuestionIndex,
              roundIndex: 0,
              playerId: player.id,
              timedOut,
            },
            scoreConfig
          );
        }
      }
      setAnswerVersion(v => v + 1);
    },
    [questions, currentQuestionIndex, config.players, scoreConfig]
  );

  /** Gå videre til neste spørsmål, eller avslutt quiz og lagre historikk. */
  const nextQuestion = useCallback(() => {
    // Sikkerhetsnett: sørg for at alle har et registrert svar på dette spørsmålet
    finishCurrentQuestion(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectionError(null);
      return;
    }

    // Quiz er ferdig – lagre historikk med faktiske data
    sessionRef.current.endSession();
    const durationMs = sessionRef.current.getDurationMs();
    const answers = sessionRef.current.getAnswers();
    const stats = computePlayerStats(config.players, answers, questions.length);

    const usedIds = getUsedQuestionIds();
    for (const q of questions) usedIds.add(q.id);
    saveUsedQuestionIds(usedIds);

    const correctByPlayer: Record<number, number> = {};
    for (const s of stats) correctByPlayer[s.playerId] = s.correct;

    saveQuizHistory({
      id: `quiz-${Date.now()}`,
      date: new Date().toISOString(),
      quizName: config.quizName,
      mode: config.gameMode,
      players: config.players.map(p => ({
        id: p.id,
        name: p.name,
        score: sessionRef.current.getScores()[p.id] ?? 0,
        color: p.color,
      })),
      totalQuestions: questions.length,
      duration: durationMs,
      questionIds: questions.map(q => q.id),
      answers,
      playerStats: stats,
      correctByPlayer,
    });

    setScreen('results');
  }, [currentQuestionIndex, questions, config, finishCurrentQuestion]);

  /** Poengsummer per spiller (avledet av session). */
  const scores = useMemo(
    () => sessionRef.current.getScores(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answerVersion, screen]
  );

  /** Full statistikk per spiller (til Results/Scoreboard). */
  const playerStats = useMemo<PlayerStats[]>(
    () => computePlayerStats(config.players, sessionRef.current.getAnswers(), questions.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.players, answerVersion, questions.length, screen]
  );

  /** Lagresultater (kun relevant i team-modus). */
  const teamResults = useMemo<TeamResult[]>(() => {
    if (config.gameMode !== 'team' || config.teams.length === 0) return [];
    return rankTeams(
      computeTeamResults(
        config.teams.map(t => ({ id: t.id, name: t.name, color: t.color, playerIds: t.playerIds })),
        playerStats
      )
    );
  }, [config.gameMode, config.teams, playerStats]);

  const rankedPlayers = useMemo(() => rankPlayers(playerStats), [playerStats]);

  const resetGame = useCallback(() => {
    setScreen('main-menu');
    setCurrentQuestionIndex(0);
    sessionRef.current = new GameSession();
    setAnswerVersion(v => v + 1);
    setQuestions([]);
    setSelectionError(null);
  }, []);

  const playAgain = useCallback(
    (reshuffle = true) => {
      sessionRef.current = new GameSession();
      setAnswerVersion(v => v + 1);
      setCurrentQuestionIndex(0);
      if (reshuffle) {
        setQuestions(prev => {
          const arr = [...prev];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        });
      }
      setScreen('lobby');
    },
    []
  );

  return {
    screen,
    config,
    questions,
    currentQuestionIndex,
    scores,
    playerStats,
    rankedPlayers,
    teamResults,
    selectionError,
    clearSelectionError: () => setSelectionError(null),
    gameMode: config.gameMode,
    timePerQuestion: config.timePerQuestion,
    navigateTo,
    updateConfig,
    updatePlayer,
    getAvailability,
    startGame,
    startGameplay,
    registerAnswer,
    getQuestionAnswers,
    getAnswers,
    getDurationMs,
    pauseGame,
    resumeGame,
    finishCurrentQuestion,
    nextQuestion,
    resetGame,
    playAgain,
    backToLobby: () => setScreen('lobby'),
  };
}
