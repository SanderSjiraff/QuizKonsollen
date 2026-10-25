import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Play, Upload, Trophy, Dices, Users, AlertTriangle,
  Check, CheckCircle2, Zap, FileUp,
} from 'lucide-react';
import type { GameConfig, SelectionError } from '../hooks/useGameEngine';
import { getCategoryName } from '../core/categories';
import { SAMPLE_PRESETS, PLAYER_COLORS } from '../data/mockData';
import { getSavedQuizzes } from '../data/savedQuizzes';
import SelectionErrorDialog from '../components/SelectionErrorDialog';
import type { Difficulty, GameMode, Player } from '../types';

interface GameSetupProps {
  config: GameConfig;
  updateConfig: (updates: Partial<GameConfig>) => void;
  getAvailability: (criteria: {
    categories: string[];
    difficulties: Difficulty[];
    count?: number;
  }) => { fresh: number; withReuse: number };
  selectionError: SelectionError | null;
  onDismissSelectionError: () => void;
  onStartWithReuse: () => void;
  onBack: () => void;
  /** Start med gitte konfigurasjonsendringer (motor gjør streng uttrekk). */
  onStart: (configUpdates: Partial<GameConfig>) => void;
  onScoreboard: () => void;
  onImportQuestions: () => void;
  /** P1 #9: filimport (JSON/CSV) – ImportQuestions-siden. */
  onImportFile: () => void;
}

interface QuizOption {
  id: string;
  name: string;
  categories: string[];
  difficulties: Difficulty[];
  questionCount: number;
  gameMode: GameMode;
  timePerQuestion: number;
  pointsPerCorrect: number;
  pointsPerWrong: number;
  /** Kategorivekter fra preset/lagret quiz – gjenopprettes ved start. */
  categoryWeights?: Record<string, number>;
  kind: 'preset' | 'saved';
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'lett', label: 'Lett' },
  { value: 'middels', label: 'Middels' },
  { value: 'vanskelig', label: 'Vanskelig' },
];

/** Bygg spillerliste med farger fra mal. */
function buildPlayers(count: number, existing: Player[]): Player[] {
  return Array.from({ length: count }, (_, i) => {
    const prev = existing.find(p => p.id === i + 1);
    return (
      prev ?? {
        id: i + 1,
        name: `Spiller ${i + 1}`,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        score: 0,
        isReady: true,
      }
    );
  });
}

export default function GameSetup({
  config,
  updateConfig,
  getAvailability,
  selectionError,
  onDismissSelectionError,
  onStartWithReuse,
  onBack,
  onStart,
  onScoreboard,
  onImportQuestions,
  onImportFile,
}: GameSetupProps) {
  const savedQuizzes = getSavedQuizzes();

  const [randomDifficulty, setRandomDifficulty] = useState<Difficulty>('lett');
  const [randomCount, setRandomCount] = useState(10);
  const [randomMode, setRandomMode] = useState<GameMode>('classic');

  const quizOptions: QuizOption[] = useMemo(() => {
    const presets: QuizOption[] = SAMPLE_PRESETS.map(p => ({
      id: `preset:${p.id}`,
      name: p.name,
      categories: p.categories,
      difficulties: p.difficulties,
      questionCount: p.questionCount,
      gameMode: p.rounds[0]?.mode ?? 'classic',
      timePerQuestion: p.rounds[0]?.timeLimit ?? 20,
      pointsPerCorrect: p.rounds[0]?.pointsPerCorrect ?? 100,
      pointsPerWrong: p.rounds[0]?.pointsPerWrong ?? 0,
      categoryWeights: p.categoryWeights,
      kind: 'preset',
    }));
    const saved: QuizOption[] = savedQuizzes.map(s => ({
      id: `saved:${s.id}`,
      name: s.name,
      categories: s.preset.categories,
      difficulties: s.preset.difficulties,
      questionCount: s.preset.questionCount,
      gameMode: s.preset.rounds[0]?.mode ?? 'classic',
      timePerQuestion: s.preset.rounds[0]?.timeLimit ?? 20,
      pointsPerCorrect: s.preset.rounds[0]?.pointsPerCorrect ?? 100,
      pointsPerWrong: s.preset.rounds[0]?.pointsPerWrong ?? 0,
      categoryWeights: s.preset.categoryWeights,
      kind: 'saved',
    }));
    return [...saved, ...presets];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedQuizzes.length]);

  const randomAvailability = getAvailability({
    categories: [],
    difficulties: [randomDifficulty],
  });

  const handleStartRandom = () => {
    onStart({
      quizName: `Tilfeldig quiz (${randomDifficulty})`,
      selectedCategories: [],
      selectedDifficulties: [randomDifficulty],
      questionCount: randomCount,
      gameMode: randomMode,
      timePerQuestion: 20,
      pointsPerCorrect: 100,
      pointsPerWrong: 0,
      bonusForSpeed: false,
      // Tilfeldig quiz skal aldri arve vekter fra en tidligere quiz
      categoryWeights: {},
    });
  };

  const handleStartQuiz = (quiz: QuizOption) => {
    onStart({
      quizName: quiz.name,
      selectedCategories: quiz.categories,
      selectedDifficulties: quiz.difficulties,
      questionCount: quiz.questionCount,
      gameMode: quiz.gameMode,
      timePerQuestion: quiz.timePerQuestion,
      pointsPerCorrect: quiz.pointsPerCorrect,
      pointsPerWrong: quiz.pointsPerWrong,
      bonusForSpeed: false,
      // Gjenopprett quizens egne vekter; {} nullstiller ev. vekter fra
      // en tidligere quiz (startGame fletter grunne).
      categoryWeights: quiz.categoryWeights ?? {},
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="tv-heading text-primary">Start spill</h1>
            <p className="text-text-secondary">Velg en quiz eller lag en tilfeldig runde</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onImportFile} className="btn-secondary flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Importer fil
          </button>
          <button onClick={onImportQuestions} className="btn-secondary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Hent fra nettet
          </button>
          <button onClick={onScoreboard} className="btn-secondary flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Poengtavle
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tilfeldig quiz */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-6 lg:col-span-1 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-primary/15 rounded-xl p-3">
              <Dices className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-text-primary">Tilfeldig quiz</h2>
          </div>

          {/* Vanskelighet */}
          <p className="text-text-secondary font-semibold mb-2">Vanskelighetsgrad</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setRandomDifficulty(d.value)}
                className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                  randomDifficulty === d.value
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Antall */}
          <p className="text-text-secondary font-semibold mb-2">
            Antall spørsmål: <span className="text-primary font-display">{randomCount}</span>
          </p>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={randomCount}
            onChange={e => setRandomCount(parseInt(e.target.value, 10))}
            className="w-full accent-primary mb-4"
            aria-label="Antall spørsmål"
          />

          {/* Spillmodus */}
          <p className="text-text-secondary font-semibold mb-2">Spillmodus</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(
              [
                { value: 'classic', label: 'Klassisk', icon: Check },
                { value: 'buzzer', label: 'Buzzer', icon: Zap },
                { value: 'team', label: 'Lag', icon: Users },
              ] as { value: GameMode; label: string; icon: typeof Check }[]
            ).map(m => (
              <button
                key={m.value}
                onClick={() => setRandomMode(m.value)}
                className={`py-3 rounded-xl border-2 font-semibold transition-all flex flex-col items-center gap-1 ${
                  randomMode === m.value
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                }`}
              >
                <m.icon className="w-5 h-5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Spillere */}
          <p className="text-text-secondary font-semibold mb-2">
            Spillere: <span className="text-primary font-display">{config.players.length}</span>
          </p>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() =>
                updateConfig({
                  players: buildPlayers(Math.max(1, config.players.length - 1), config.players),
                })
              }
              className="btn-secondary px-5 py-2 text-xl"
              aria-label="Færre spillere"
            >
              –
            </button>
            <div className="flex gap-1.5 flex-wrap flex-1">
              {config.players.map(p => (
                <span
                  key={p.id}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>
            <button
              onClick={() =>
                updateConfig({
                  players: buildPlayers(Math.min(8, config.players.length + 1), config.players),
                })
              }
              className="btn-secondary px-5 py-2 text-xl"
              aria-label="Flere spillere"
            >
              +
            </button>
          </div>

          {/* Tilgjengelighet */}
          <div
            className={`rounded-xl p-3 mb-4 text-sm ${
              randomAvailability.fresh >= randomCount
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error'
            }`}
          >
            {randomAvailability.fresh >= randomCount ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {randomAvailability.fresh} ubrukte {randomDifficulty === 'lett' ? 'lette' : randomDifficulty === 'middels' ? 'middels' : 'vanskelige'} spørsmål tilgjengelig
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Bare {randomAvailability.fresh} ubrukte spørsmål på dette nivået
              </span>
            )}
          </div>

          <button
            onClick={handleStartRandom}
            disabled={randomAvailability.fresh === 0}
            className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-6 h-6" />
            Start tilfeldig quiz
          </button>
        </motion.div>

        {/* Lagrede og forhåndsdefinerte quizer */}
        <div className="lg:col-span-2 space-y-4">
          {quizOptions.length === 0 && (
            <div className="card p-8 text-center text-text-secondary">
              Ingen lagrede quizer ennå. Lag en i quizbyggeren!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizOptions.map((quiz, index) => {
              const availability = getAvailability({
                categories: quiz.categories,
                difficulties: quiz.difficulties,
                count: quiz.questionCount,
              });
              const enough = availability.fresh >= quiz.questionCount;
              return (
                <motion.button
                  key={quiz.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStartQuiz(quiz)}
                  className="card p-5 text-left hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-xl text-text-primary group-hover:text-primary transition-colors">
                        {quiz.name}
                      </h3>
                      <p className="text-text-muted text-sm">
                        {quiz.kind === 'saved' ? 'Egen quiz' : 'Forhåndsdefinert'}
                      </p>
                    </div>
                    <span className="text-primary font-display text-2xl">{quiz.questionCount}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {quiz.categories.map(cat => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 rounded-full bg-bg-elevated text-text-secondary text-xs"
                      >
                        {getCategoryName(cat)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted capitalize">
                      {quiz.difficulties.join(' · ')}
                    </span>
                    <span
                      className={
                        enough ? 'text-success flex items-center gap-1' : 'text-error flex items-center gap-1'
                      }
                    >
                      {enough ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {availability.fresh} tilgjengelig
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          {availability.fresh} tilgjengelig
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-2 flex items-center gap-2">
                    {quiz.gameMode === 'buzzer' && <Zap className="w-3.5 h-3.5" />}
                    {quiz.gameMode === 'team' && <Users className="w-3.5 h-3.5" />}
                    {quiz.timePerQuestion} sek per spørsmål
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialog når valgene ikke kan oppfylles */}
      {selectionError && (
        <SelectionErrorDialog
          error={selectionError}
          categories={config.selectedCategories}
          difficulties={config.selectedDifficulties}
          onReduceCount={newCount =>
            onStart({ questionCount: newCount })
          }
          onAllowReuse={onStartWithReuse}
          onFetchMore={onImportQuestions}
          onDismiss={onDismissSelectionError}
        />
      )}
    </div>
  );
}
