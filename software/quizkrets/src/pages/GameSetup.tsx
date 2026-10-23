import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Shuffle, Trophy, Upload, Dices, Clock, Users, Tag, X } from 'lucide-react';
import type { GameConfig } from '../hooks/useGameEngine';
import { SAMPLE_PRESETS, CATEGORIES, QUESTIONS, PLAYER_COLORS } from '../data/mockData';
import { getSavedQuizzes } from '../data/savedQuizzes';
import type { Question, Difficulty } from '../types';

interface GameSetupProps {
  config: GameConfig;
  updateConfig: (updates: Partial<GameConfig>) => void;
  onBack: () => void;
  onStart: (questions: Question[]) => void;
  onScoreboard: () => void;
  onImportQuestions: () => void;
}

interface QuizOption {
  id: string;
  name: string;
  type: 'preset' | 'custom' | 'random';
  categories: string[];
  difficulties: string[];
  questionCount: number;
  description: string;
  color: string;
}

export default function GameSetup({ config, updateConfig, onBack, onStart, onScoreboard, onImportQuestions }: GameSetupProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [showRandomConfig, setShowRandomConfig] = useState(false);
  const [randomDifficulty, setRandomDifficulty] = useState<Difficulty>('middels');
  const [randomCount, setRandomCount] = useState(10);
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);

  useEffect(() => {
    const options: QuizOption[] = [
      // Tilfeldig
      {
        id: 'random',
        name: 'Tilfeldig Quiz',
        type: 'random',
        categories: CATEGORIES.map(c => c.id),
        difficulties: ['lett', 'middels', 'vanskelig'],
        questionCount: 10,
        description: 'Tilfeldige spørsmål fra alle kategorier',
        color: '#A855F7',
      },
      // Presets
      ...SAMPLE_PRESETS.map(p => ({
        id: p.id,
        name: p.name,
        type: 'preset' as const,
        categories: p.categories,
        difficulties: p.difficulties,
        questionCount: p.questionCount,
        description: `${p.categories.join(', ')} • ${p.questionCount} spørsmål`,
        color: '#F59E0B',
      })),
      // Custom saved
      ...getSavedQuizzes().map(q => ({
        id: q.id,
        name: q.name,
        type: 'custom' as const,
        categories: q.preset.categories,
        difficulties: q.preset.difficulties,
        questionCount: q.preset.questionCount,
        description: `${q.preset.categories.join(', ')} • Lagret ${new Date(q.createdAt).toLocaleDateString('no-NO')}`,
        color: '#22C55E',
      })),
    ];
    setQuizOptions(options);
  }, []);

  const generateQuestions = (quizId: string): Question[] => {
    if (quizId === 'random') {
      // Filtrer spørsmål etter vanskelighetsgrad
      const filtered = QUESTIONS.filter(q => 
        q.difficulty === randomDifficulty || randomDifficulty === 'middels'
      );
      // Slump og ta ønsket antall
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(randomCount, shuffled.length));
    }

    // For presets og custom: filtrer etter kategorier og vanskelighet
    const quizOption = quizOptions.find(q => q.id === quizId);
    if (!quizOption) return [];

    let available = QUESTIONS;
    if (quizOption.categories.length > 0 && !quizOption.categories.includes('all')) {
      available = available.filter(q => 
        q.categories.some(c => quizOption.categories.includes(c))
      );
    }
    if (quizOption.difficulties.length > 0) {
      available = available.filter(q => 
        quizOption.difficulties.includes(q.difficulty)
      );
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(quizOption.questionCount, shuffled.length));
  };

  const handleSelectQuiz = (quizId: string) => {
    if (quizId === 'random') {
      setShowRandomConfig(true);
      setSelectedQuiz(quizId);
    } else {
      setSelectedQuiz(quizId);
      setShowRandomConfig(false);
    }
  };

  const handleStart = () => {
    if (!selectedQuiz) return;

    const quizOption = quizOptions.find(q => q.id === selectedQuiz);
    if (!quizOption) return;

    // Oppdater config med riktige verdier
    const newConfig: Partial<GameConfig> = {
      selectedCategories: quizOption.categories,
      selectedDifficulties: quizOption.difficulties as Difficulty[],
      questionCount: quizOption.questionCount,
    };

    if (selectedQuiz === 'random') {
      newConfig.selectedDifficulties = [randomDifficulty];
      newConfig.questionCount = randomCount;
    }

    updateConfig(newConfig);

    // Generer spørsmål
    const questions = generateQuestions(selectedQuiz);
    onStart(questions);
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="tv-heading text-primary">Velg quiz</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={onImportQuestions} className="btn-secondary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button onClick={onScoreboard} className="btn-secondary flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Poengtavle
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Quiz-liste */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizOptions.map((quiz, index) => (
            <motion.button
              key={quiz.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectQuiz(quiz.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedQuiz === quiz.id
                  ? 'border-primary bg-primary/10 transform scale-[1.02]'
                  : 'border-border bg-bg-elevated hover:border-primary/50 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${quiz.color}30` }}
                >
                  {quiz.type === 'random' ? (
                    <Dices className="w-6 h-6" style={{ color: quiz.color }} />
                  ) : quiz.type === 'preset' ? (
                    <Play className="w-6 h-6" style={{ color: quiz.color }} />
                  ) : (
                    <Shuffle className="w-6 h-6" style={{ color: quiz.color }} />
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  quiz.type === 'random' ? 'bg-purple-500/20 text-purple-400' :
                  quiz.type === 'preset' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {quiz.type === 'random' ? 'Tilfeldig' : quiz.type === 'preset' ? 'Preset' : 'Lagret'}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-text-primary mb-2">{quiz.name}</h3>
              <p className="text-text-secondary text-sm mb-3">{quiz.description}</p>

              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {quiz.type === 'random' ? 'Alle kategorier' : `${quiz.categories.length} kategorier`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {quiz.questionCount} spørsmål
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Random Config Panel */}
        {showRandomConfig && selectedQuiz === 'random' && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card border-primary/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-primary">Tilfeldig quiz-innstillinger</h2>
              <button onClick={() => { setShowRandomConfig(false); setSelectedQuiz(null); }} className="btn-secondary p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Vanskelighetsgrad */}
              <div>
                <label className="block text-text-secondary mb-3 font-semibold">Vanskelighetsgrad</label>
                <div className="flex gap-2">
                  {(['lett', 'middels', 'vanskelig'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setRandomDifficulty(diff)}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                        randomDifficulty === diff
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                      }`}
                    >
                      {diff === 'lett' ? 'Lett' : diff === 'middels' ? 'Middels' : 'Vanskelig'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Antall spørsmål */}
              <div>
                <label className="block text-text-secondary mb-3 font-semibold">Antall spørsmål</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setRandomCount(Math.max(5, randomCount - 5))}
                    className="btn-secondary p-3"
                  >
                    −
                  </button>
                  <span className="font-display text-4xl text-primary min-w-[80px] text-center">
                    {randomCount}
                  </span>
                  <button 
                    onClick={() => setRandomCount(Math.min(50, randomCount + 5))}
                    className="btn-secondary p-3"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Spillere */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl text-text-primary">Antall spillere</h2>
            </div>
            <span className="text-text-secondary text-sm">Justeres i lobby etter valg</span>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-4">
            <button
              onClick={() => {
                const newCount = Math.max(1, config.players.length - 1);
                const newPlayers = config.players.slice(0, newCount);
                // Hvis vi legger til, lag nye spillere
                if (newCount > config.players.length) {
                  for (let i = config.players.length; i < newCount; i++) {
                    newPlayers.push({
                      id: i + 1,
                      name: `Spiller ${i + 1}`,
                      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                      score: 0,
                      isReady: i === 0,
                    });
                  }
                }
                updateConfig({ players: newPlayers });
              }}
              disabled={config.players.length <= 1}
              className="btn-secondary p-4 disabled:opacity-50"
            >
              −
            </button>
            <span className="font-display text-5xl text-primary min-w-[80px] text-center">
              {config.players.length}
            </span>
            <button
              onClick={() => {
                const newCount = Math.min(8, config.players.length + 1);
                const newPlayers = [...config.players];
                for (let i = config.players.length; i < newCount; i++) {
                  newPlayers.push({
                    id: i + 1,
                    name: `Spiller ${i + 1}`,
                    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                    score: 0,
                    isReady: i === 0,
                  });
                }
                updateConfig({ players: newPlayers });
              }}
              disabled={config.players.length >= 8}
              className="btn-secondary p-4 disabled:opacity-50"
            >
              +
            </button>
          </div>

          {/* Spilleroversikt */}
          <div className="flex justify-center gap-3">
            {config.players.map((p, i) => (
              <div 
                key={p.id} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-bg-primary"
                style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {p.id}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Start-knapp */}
        {selectedQuiz && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center pb-12"
          >
            <button
              onClick={handleStart}
              className="btn-primary text-2xl px-16 py-6 flex items-center gap-4"
            >
              <Play className="w-8 h-8" />
              Start quizen!
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
