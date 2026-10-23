import { useState, useCallback } from 'react';
import type { Screen, Player, Question, GameMode } from '../types';
import { DEFAULT_PLAYERS, QUESTIONS } from '../data/mockData';
import { saveQuizHistory } from '../data/quizHistory';

const USED_QUESTIONS_KEY = 'quizkrets_used_question_ids';
const CACHE_KEY = 'quizkrets_otdb_cache';

// Hent brukte spørsmåls-IDer
function getUsedQuestionIds(): Set<string> {
  try {
    const data = localStorage.getItem(USED_QUESTIONS_KEY);
    if (!data) return new Set();
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

// Lagre brukte spørsmåls-IDer
function saveUsedQuestionIds(ids: Set<string>) {
  try {
    localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error('Kunne ikke lagre brukte spørsmål:', error);
  }
}

// Hent cached spørsmål fra API
function getCachedQuestions(): Question[] {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Hent ALLE tilgjengelige spørsmål (lokale + cached + mock)
function getAllAvailableQuestions(): Question[] {
  const cached = getCachedQuestions();
  // Kombiner med lokale spørsmål
  return [...QUESTIONS, ...cached];
}

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

  const startGame = useCallback((customQuestions?: Question[]) => {
    let selected: Question[];
    
    if (customQuestions && customQuestions.length > 0) {
      selected = customQuestions;
    } else {
      // Hent ALLE tilgjengelige spørsmål
      const allQuestions = getAllAvailableQuestions();
      
      // Hent brukte spørsmåls-IDer
      const currentUsedIds = getUsedQuestionIds();
      
      // Filtrer ut brukte spørsmål
      const unusedQuestions = allQuestions.filter(q => !currentUsedIds.has(q.id));
      
      // Hvis det er færre ubrukte spørsmål enn ønsket, gi advarsel
      const availableCount = unusedQuestions.length;
      
      if (availableCount < 5) {
        // Nesten ingen ubrukte spørsmål - tilbakestill brukte spørsmål
        localStorage.removeItem(USED_QUESTIONS_KEY);
        // Bruk alle spørsmål
        const freshUnused = [...allQuestions].sort(() => Math.random() - 0.5);
        selected = freshUnused.slice(0, Math.min(config.questionCount, freshUnused.length));
      } else {
        // Filtrer etter kategorier og vanskelighet
        let filtered = unusedQuestions;
        
        if (config.selectedCategories.length > 0) {
          filtered = filtered.filter(q => 
            q.categories.some(c => config.selectedCategories.includes(c))
          );
        }
        
        if (config.selectedDifficulties.length > 0) {
          filtered = filtered.filter(q => 
            config.selectedDifficulties.includes(q.difficulty)
          );
        }
        
        // Hvis for få etter filtrering, bruk alle ubrukte
        if (filtered.length < config.questionCount) {
          filtered = unusedQuestions;
        }
        
        // Shuffle og ta ønsket antall
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
      }
    }

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
      // Lagre quiz-historikk og marker spørsmål som brukt
      
      // Lagre brukte spørsmål
      const currentUsedIds = getUsedQuestionIds();
      const newUsedIds = new Set(currentUsedIds);
      questions.forEach(q => newUsedIds.add(q.id));
      saveUsedQuestionIds(newUsedIds);
      
      saveQuizHistory({
        id: `quiz-${Date.now()}`,
        date: new Date().toISOString(),
        quizName: 'Quiz',
        mode: config.gameMode,
        players: config.players.map(p => ({
          id: p.id,
          name: p.name,
          score: scores[p.id] || 0,
          color: p.color,
        })),
        totalQuestions: questions.length,
        duration: 0,
      });
      setScreen('results');
    }
  }, [currentQuestionIndex, questions.length, config, scores, questions]);

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
    backToLobby: () => setScreen('lobby'),
  };
}
