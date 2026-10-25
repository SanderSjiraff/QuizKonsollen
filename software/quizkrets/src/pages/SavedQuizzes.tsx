import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Play, Clock, Users, Tag } from 'lucide-react';
import { getSavedQuizzes, deleteSavedQuiz } from '../data/savedQuizzes';
import { SAMPLE_PRESETS } from '../data/mockData';
import SelectionErrorDialog from '../components/SelectionErrorDialog';
import type { SelectionError } from '../hooks/useGameEngine';
import type { QuizPreset } from '../types';

interface SavedQuizzesProps {
  onBack: () => void;
  onSelectQuiz: (preset: QuizPreset) => void;
  onCreateQuiz: () => void;
  /** Review-fiks: banken kan ikke alltid oppfylle quizen – feilen må
   * vises her også (samme dialog som GameSetup/QuizBuilder), ikke stille. */
  selectionError: SelectionError | null;
  categories: string[];
  /** Difficulties fra config er string[] – dialogen aksepterer begge typer. */
  difficulties: string[];
  onDismissSelectionError: () => void;
  onReduceCount: (newCount: number) => void;
  onStartWithReuse: () => void;
  onFetchMore: () => void;
}

// Kombinert quiz-type for visning
interface DisplayQuiz extends QuizPreset {
  isPreset: boolean;
  createdAt?: string;
}

export default function SavedQuizzes({
  onBack,
  onSelectQuiz,
  onCreateQuiz,
  selectionError,
  categories,
  difficulties,
  onDismissSelectionError,
  onReduceCount,
  onStartWithReuse,
  onFetchMore,
}: SavedQuizzesProps) {
  const [savedQuizzes, setSavedQuizzes] = useState<DisplayQuiz[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Last both presets and saved quizzes
    const fromStorage = getSavedQuizzes();
    const allQuizzes: DisplayQuiz[] = [
      ...SAMPLE_PRESETS.map(p => ({ ...p, isPreset: true as const })),
      ...fromStorage.map(q => ({ ...q.preset, isPreset: false as const, createdAt: q.createdAt }))
    ];
    setSavedQuizzes(allQuizzes);
  }, []);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteSavedQuiz(id);
      setSavedQuizzes(getSavedQuizzes().map(q => ({ ...q.preset, isPreset: false as const })));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="tv-heading text-primary">Lagrede quizer</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lag ny quiz-knapp */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={onCreateQuiz}
          className="w-full card-interactive p-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Plus className="w-6 h-6 text-bg-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold text-primary">Lag ny quiz</h2>
            <p className="text-text-secondary">Sett sammen egne temaer og regler</p>
          </div>
        </motion.button>

        {/* Quiz-liste */}
        <div className="space-y-4">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-xl">Ingen quizer lagret ennå</p>
              <p className="text-text-muted mt-2">Lag din første quiz for å komme i gang!</p>
            </div>
          ) : (
            savedQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="card group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-text-primary">{quiz.name}</h3>
                      {quiz.isPreset && (
                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          Forhåndsvalg
                        </span>
                      )}
                      {!quiz.isPreset && quiz.createdAt && (
                        <span className="px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                          Lagret {new Date(quiz.createdAt).toLocaleDateString('no-NO')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {quiz.categories.length} temaer
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {quiz.questionCount} spørsmål
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {quiz.rounds?.[0]?.mode === 'team' ? 'Lag' : quiz.rounds?.[0]?.mode === 'buzzer' ? 'Buzzer' : 'Klassisk'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quiz.categories.map((cat: string) => (
                        <span 
                          key={cat} 
                          className="px-2 py-1 rounded bg-bg-elevated text-text-secondary text-xs capitalize"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onSelectQuiz(quiz)}
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                      title="Spill denne quizen"
                    >
                      <Play className="w-5 h-5" />
                      Spill
                    </button>
                    
                    {!quiz.isPreset && (
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className={`p-3 rounded-xl transition-all ${
                          deleteConfirm === quiz.id 
                            ? 'bg-error text-bg-primary' 
                            : 'bg-bg-elevated text-text-secondary hover:bg-error hover:text-bg-primary'
                        }`}
                        title={deleteConfirm === quiz.id ? 'Bekreft sletting' : 'Slett quiz'}
                      >
                        {deleteConfirm === quiz.id ? 'Slett?' : <Trash2 className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Review-fiks: dialog når banken ikke kan oppfylle quizen –
          samme mønster som GameSetup/QuizBuilder */}
      {selectionError && (
        <SelectionErrorDialog
          error={selectionError}
          categories={categories}
          difficulties={difficulties}
          onReduceCount={onReduceCount}
          onAllowReuse={onStartWithReuse}
          onFetchMore={onFetchMore}
          onDismiss={onDismissSelectionError}
        />
      )}
    </div>
  );
}
