import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Plus, Edit2, Trash2, X, Database,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import {
  getAllQuestions,
  getBankStats,
  addQuestions,
  updateQuestion,
  deleteQuestion,
  findDuplicateByText,
  StorageError,
  type StoredQuestion,
} from '../data/questionStore';
import {
  getMainCategories,
  getSubcategories,
  getCategoryName,
  matchesSelection,
} from '../core/categories';
import { validateQuestionDraft } from '../core/questionValidation';
import type { Question, Difficulty, QuestionType } from '../types';

interface QuestionBankProps {
  onBack: () => void;
}

const PAGE_SIZE = 20;

const SOURCE_LABELS: Record<string, string> = {
  seed: 'Innebygd',
  opentdb: 'OpenTDB',
  'trivia-api': 'Trivia API',
  import: 'Importert',
  manual: 'Manuell',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lett: 'Lett',
  middels: 'Middels',
  vanskelig: 'Vanskelig',
};

/** Tom kladd for nytt spørsmål. */
function emptyDraft(): QuestionDraft {
  return {
    text: '',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: [],
    choices: [
      { text: '', isCorrect: true },
      { text: '' },
      { text: '' },
      { text: '' },
    ],
    explanation: '',
  };
}

interface QuestionDraft {
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  categories: string[];
  choices: { text: string; isCorrect?: boolean }[];
  explanation: string;
}

/** Dialog for opprettelse og redigering av spørsmål. */
function QuestionEditor({
  initial,
  title,
  existingId,
  onClose,
  onSave,
}: {
  initial: QuestionDraft;
  title: string;
  existingId?: string;
  onClose: () => void;
  /** Kalles med et ferdig validert spørsmål i internt format. */
  onSave: (question: Question) => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  const set = (updates: Partial<QuestionDraft>) => setDraft(prev => ({ ...prev, ...updates }));

  const toggleCategory = (catId: string) => {
    set({
      categories: draft.categories.includes(catId)
        ? draft.categories.filter(c => c !== catId)
        : [...draft.categories, catId],
    });
  };

  const handleSubmit = () => {
    // Tomme alternativer på slutten fjernes (brukeren trenger ikke fylle alle 4)
    const filled = draft.choices.filter(c => c.text.trim() !== '');
    if (filled.length === 0) filled.push(...draft.choices.slice(0, 2));

    // Bygg Question-objekt og kjør sentral validering
    const choiceIds = filled.map((_, i) => String.fromCharCode(97 + i)); // a, b, c, d
    const question: Question = {
      id: existingId ?? 'preview',
      text: draft.text,
      type: draft.type,
      difficulty: draft.difficulty,
      categories: draft.categories,
      choices: filled.map((c, i) => ({ id: choiceIds[i], text: c.text })),
      correctChoiceIds: filled
        .map((c, i) => (c.isCorrect ? choiceIds[i] : null))
        .filter((id): id is string => id !== null),
      explanation: draft.explanation || undefined,
    };

    const validation = validateQuestionDraft(question);
    if (!validation.valid) {
      setErrors([...new Set(validation.errors.map(e => e.message))]);
      return;
    }

    // Duplikatsjekk mot banken
    const duplicate = findDuplicateByText(draft.text, existingId);
    if (duplicate) {
      setErrors([`Et lignende spørsmål finnes allerede: «${duplicate.text.slice(0, 60)}…»`]);
      return;
    }

    onSave(question);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg/90 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="card max-w-3xl w-full p-6 my-8"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl text-text-primary">{title}</h3>
          <button onClick={onClose} className="btn-secondary p-2" aria-label="Lukk">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spørsmålstekst */}
        <label className="block text-text-secondary font-semibold mb-2">Spørsmål</label>
        <textarea
          value={draft.text}
          onChange={e => set({ text: e.target.value })}
          rows={2}
          className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary text-lg focus:border-primary focus:outline-none mb-4"
          placeholder="Skriv spørsmålet her…"
        />

        {/* Type + vanskelighet */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['multiple_choice', 'true_false'] as QuestionType[]).map(t => (
                <button
                  key={t}
                  onClick={() =>
                    set({
                      type: t,
                      choices:
                        t === 'true_false'
                          ? [{ text: 'Sant', isCorrect: true }, { text: 'Usant' }]
                          : emptyDraft().choices,
                    })
                  }
                  className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    draft.type === t
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {t === 'multiple_choice' ? 'Flervalg' : 'Sant/Usant'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-text-secondary font-semibold mb-2">Vanskelighet</label>
            <div className="grid grid-cols-3 gap-2">
              {(['lett', 'middels', 'vanskelig'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => set({ difficulty: d })}
                  className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    draft.difficulty === d
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Svaralternativer */}
        <label className="block text-text-secondary font-semibold mb-2">
          Svaralternativer (velg riktig svar)
        </label>
        <div className="space-y-2 mb-4">
          {draft.choices.map((choice, index) => (
            <div key={index} className="flex items-center gap-3">
              <button
                onClick={() =>
                  set({
                    choices: draft.choices.map((c, i) =>
                      i === index ? { ...c, isCorrect: !c.isCorrect } : c
                    ),
                  })
                }
                className={`w-10 h-10 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  choice.isCorrect
                    ? 'border-success bg-success/20 text-success'
                    : 'border-border text-text-muted hover:border-primary/50'
                }`}
                aria-label={`Marker alternativ ${index + 1} som riktig`}
                aria-pressed={choice.isCorrect}
              >
                {choice.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </button>
              <input
                value={choice.text}
                onChange={e =>
                  set({
                    choices: draft.choices.map((c, i) =>
                      i === index ? { ...c, text: e.target.value } : c
                    ),
                  })
                }
                className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none"
                placeholder={`Alternativ ${index + 1}`}
              />
              {draft.choices.length > 2 && draft.type !== 'true_false' && (
                <button
                  onClick={() => set({ choices: draft.choices.filter((_, i) => i !== index) })}
                  className="btn-secondary p-2"
                  aria-label={`Fjern alternativ ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {draft.type === 'multiple_choice' && draft.choices.length < 6 && (
            <button
              onClick={() => set({ choices: [...draft.choices, { text: '' }] })}
              className="btn-secondary text-sm py-2 px-4"
            >
              + Legg til alternativ
            </button>
          )}
        </div>

        {/* Kategorier */}
        <label className="block text-text-secondary font-semibold mb-2">Kategorier</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {getMainCategories().map(cat => {
            const subs = getSubcategories(cat.id);
            return (
              <span key={cat.id} className="contents">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    draft.categories.includes(cat.id)
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
                {subs.map(sub =>
                  draft.categories.includes(cat.id) ? (
                    <button
                      key={sub.id}
                      onClick={() => toggleCategory(sub.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                        draft.categories.includes(sub.id)
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border text-text-muted hover:border-primary/50'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ) : null
                )}
              </span>
            );
          })}
        </div>

        {/* Forklaring */}
        <label className="block text-text-secondary font-semibold mb-2">
          Forklaring (valgfri)
        </label>
        <input
          value={draft.explanation}
          onChange={e => set({ explanation: e.target.value })}
          className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none mb-4"
          placeholder="Kort forklaring som vises etter svaret"
        />

        {/* Feil */}
        {errors.length > 0 && (
          <div className="rounded-xl bg-error/10 border border-error/40 p-4 mb-4 space-y-1">
            {errors.map(err => (
              <p key={err} className="text-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSubmit} className="btn-primary flex-1 py-3.5 text-lg">
            {existingId ? 'Lagre endringer' : 'Legg til spørsmål'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-3.5 text-lg">
            Avbryt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function QuestionBank({ onBack }: QuestionBankProps) {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<StoredQuestion | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredQuestion | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const bank = useMemo(() => {
    void version;
    return getAllQuestions();
  }, [version]);
  const stats = useMemo(() => {
    void version;
    return getBankStats();
  }, [version]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bank.filter(item => {
      if (q && !item.text.toLowerCase().includes(q)) return false;
      if (categoryFilter.length > 0 && !matchesSelection(item.categories, categoryFilter)) return false;
      if (difficultyFilter.length > 0 && !difficultyFilter.includes(item.difficulty)) return false;
      if (sourceFilter.length > 0 && !sourceFilter.includes(item.source)) return false;
      return true;
    });
  }, [bank, search, categoryFilter, difficultyFilter, sourceFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  const showFeedback = (ok: boolean, message: string) => {
    setFeedback({ ok, message });
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = (question: Question) => {
    try {
      if (editing === 'new') {
        const result = addQuestions([question], 'manual', 'Manuell');
        showFeedback(
          result.added > 0,
          result.added > 0 ? 'Spørsmålet ble lagt til!' : 'Spørsmålet finnes allerede.'
        );
      } else if (editing) {
        updateQuestion(editing.id, {
          text: question.text,
          type: question.type,
          difficulty: question.difficulty,
          categories: question.categories,
          choices: question.choices,
          correctChoiceIds: question.correctChoiceIds,
          explanation: question.explanation,
        });
        showFeedback(true, 'Endringene er lagret!');
      }
    } catch (error) {
      // Lagringsfeil (f.eks. full kvote): data er uendret – vis meldingen og
      // behold dialogen åpen så brukerens innhold ikke går tapt.
      showFeedback(
        false,
        error instanceof StorageError ? error.message : 'Uventet feil ved lagring.'
      );
      return;
    }
    setEditing(null);
    setVersion(v => v + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    try {
      const ok = deleteQuestion(deleteTarget.id);
      showFeedback(ok, ok ? 'Spørsmålet er slettet.' : 'Kunne ikke slette spørsmålet.');
    } catch (error) {
      showFeedback(
        false,
        error instanceof StorageError ? error.message : 'Uventet feil ved sletting.'
      );
    }
    setDeleteTarget(null);
    setVersion(v => v + 1);
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="tv-heading text-primary">Spørsmålsbank</h1>
            <p className="text-text-secondary">
              {stats.total} spørsmål totalt
              {stats.needsReview > 0 && (
                <span className="text-error"> • {stats.needsReview} trenger gjennomgang</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="btn-primary flex items-center gap-2 text-lg py-3 px-5"
        >
          <Plus className="w-5 h-5" />
          Nytt spørsmål
        </button>
      </div>

      {/* Tilbakemelding */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`card mb-4 flex items-center gap-3 ${feedback.ok ? 'border-success' : 'border-error'}`}
            role="status"
          >
            {feedback.ok ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error" />
            )}
            <span className={feedback.ok ? 'text-success' : 'text-error'}>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtre */}
      <div className="card p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Søk i spørsmål…"
              className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-text-primary focus:border-primary focus:outline-none"
              aria-label="Søk"
            />
          </div>
          {/* Vanskelighetsfilter */}
          {(['lett', 'middels', 'vanskelig'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => {
                setDifficultyFilter(prev => toggleIn(prev, d));
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                difficultyFilter.includes(d)
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-text-secondary hover:border-primary/50'
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
          {/* Kildefilter */}
          {Object.entries(SOURCE_LABELS).map(([source, label]) =>
            stats.bySource[source as keyof typeof stats.bySource] > 0 ? (
              <button
                key={source}
                onClick={() => {
                  setSourceFilter(prev => toggleIn(prev, source));
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  sourceFilter.includes(source)
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-text-secondary hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ) : null
          )}
        </div>

        {/* Kategorifilter med antall */}
        <div className="flex flex-wrap gap-2">
          {getMainCategories().map(cat => {
            const count = stats.byCategory[cat.id] ?? 0;
            if (count === 0) return null;
            const selected = categoryFilter.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(prev => toggleIn(prev, cat.id));
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selected
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-text-secondary hover:border-primary/50'
                }`}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            );
          })}
          {(categoryFilter.length > 0 || difficultyFilter.length > 0 || sourceFilter.length > 0 || search) && (
            <button
              onClick={() => {
                setCategoryFilter([]);
                setDifficultyFilter([]);
                setSourceFilter([]);
                setSearch('');
                setPage(0);
              }}
              className="px-3 py-1.5 rounded-full text-sm text-error border border-error/40 hover:bg-error/10"
            >
              Nullstill filtre
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {pageItems.length === 0 ? (
          <div className="card p-10 text-center text-text-secondary">
            <Database className="w-10 h-10 mx-auto mb-3 text-text-muted" />
            <p>Ingen spørsmål matcher filtrene.</p>
          </div>
        ) : (
          pageItems.map(question => {
            const correctText = question.choices.find(c =>
              question.correctChoiceIds.includes(c.id)
            )?.text;
            return (
              <div
                key={question.id}
                className={`card p-4 flex items-start gap-4 ${
                  question.needsReview ? 'border-error/40' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium truncate">{question.text}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted mt-1">
                    <span className="capitalize">{DIFFICULTY_LABELS[question.difficulty]}</span>
                    <span>•</span>
                    <span>{question.categories.slice(0, 3).map(getCategoryName).join(', ')}</span>
                    <span>•</span>
                    <span>{SOURCE_LABELS[question.source] ?? question.source}</span>
                    {correctText && (
                      <>
                        <span>•</span>
                        <span className="text-success truncate">✔ {correctText}</span>
                      </>
                    )}
                    {question.needsReview && (
                      <>
                        <span>•</span>
                        <span className="text-error flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Trenger gjennomgang
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditing(question)}
                    className="btn-secondary p-2.5"
                    aria-label={`Rediger spørsmålet: ${question.text.slice(0, 40)}`}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(question)}
                    className="btn-secondary p-2.5 text-error"
                    aria-label={`Slett spørsmålet: ${question.text.slice(0, 40)}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginering */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary p-2.5 disabled:opacity-40"
            aria-label="Forrige side"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-text-secondary">
            Side {page + 1} av {pageCount} ({filtered.length} spørsmål)
          </span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="btn-secondary p-2.5 disabled:opacity-40"
            aria-label="Neste side"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Rediger/opprett-dialog */}
      <AnimatePresence>
        {editing && (
          <QuestionEditor
            key={editing === 'new' ? 'new' : editing.id}
            title={editing === 'new' ? 'Nytt spørsmål' : 'Rediger spørsmål'}
            existingId={editing === 'new' ? undefined : editing.id}
            initial={
              editing === 'new'
                ? emptyDraft()
                : {
                    text: editing.text,
                    type: editing.type,
                    difficulty: editing.difficulty,
                    categories: editing.categories,
                    choices: editing.choices.map(c => ({
                      text: c.text,
                      isCorrect: editing.correctChoiceIds.includes(c.id),
                    })),
                    explanation: editing.explanation ?? '',
                  }
            }
            onClose={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Slettebekreftelse */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg/90 z-50 flex items-center justify-center p-6"
            role="alertdialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card border-error/50 max-w-lg w-full p-6"
            >
              <h3 className="font-display text-xl text-error mb-3">Slette spørsmål?</h3>
              <p className="text-text-secondary mb-2">«{deleteTarget.text.slice(0, 100)}»</p>
              <p className="text-text-muted text-sm mb-6">Dette kan ikke angres.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="btn-primary flex-1 py-3 bg-error border-error">
                  Slett
                </button>
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 py-3">
                  Avbryt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
