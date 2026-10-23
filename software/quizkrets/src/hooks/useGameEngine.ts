import { useState, useCallback } from 'react';
import type { Screen, Player, Question, GameMode } from '../types';
import { DEFAULT_PLAYERS, QUESTIONS } from '../data/mockData';

export interface GameConfig {
  selectedCategories: string[];
  selectedDifficulties: string[];
  questionCount: number;
  gameMode: GameMode;
  timePerQuestion: number;
  players: Player[];
}

export function useGameEngine() {
  const [screen, setScreen] = useState<Screen>('main-menu');
  const [config, setConfig] = useState<GameConfig>({
    selectedCategories: [],
    selectedDifficulties: ['lett', 'middels'],
    questionCount: 10,
    gameMode: 'classic',
    timePerQuestion: 20,
    players: DEFAULT_PLAYERS.map(p => ({ ...p })),
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [gameMode, setGameMode] = useState<GameMode>('classic');

  const navigateTo = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
  }, []);

  const updateConfig = useCallback((updates: Partial<GameConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePlayer = useCallback((playerId: number, updates: Partial<Player>) => {
    setConfig(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const startGame = useCallback(() => {
    const filtered = QUESTIONS.filter(q => {
      const catMatch = config.selectedCategories.length === 0 || 
        q.categories.some(c => config.selectedCategories.includes(c));
      const diffMatch = config.selectedDifficulties.includes(q.difficulty);
      return catMatch && diffMatch;
    });

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));

    setQuestions(selected);
    setCurrentQuestionIndex(0);
    setScores({});
    setGameMode(config.gameMode);
    setScreen('lobby');
  }, [config]);

  const startGameplay = useCallback(() => {
    setScreen('game-play');
  }, []);

  const answerQuestion = useCallback((_playerId: number, _choiceId: string, isCorrect: boolean) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const points = isCorrect ? 100 : 0;
    setScores(prev => ({
      ...prev,
      [_playerId]: (prev[_playerId] || 0) + points,
    }));
  }, [questions, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setScreen('results');
    }
  }, [currentQuestionIndex, questions.length]);

  const resetGame = useCallback(() => {
    setScreen('main-menu');
    setCurrentQuestionIndex(0);
    setScores({});
    setQuestions([]);
  }, []);

  const playAgain = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScores({});
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setScreen('lobby');
  }, [questions]);

  return {
    screen,
    config,
    questions,
    currentQuestionIndex,
    scores,
    gameMode,
    navigateTo,
    updateConfig,
    updatePlayer,
    startGame,
    startGameplay,
    answerQuestion,
    nextQuestion,
    resetGame,
    playAgain,
  };
}
