import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Globe, AlertCircle, Check, Loader2,
  Database, Trash2, BarChart3, Wifi, WifiOff, Clock,
} from 'lucide-react';
import { openTdbProvider } from '../data/adapters/openTdbAdapter';
import { triviaApiProvider } from '../data/adapters/triviaApiAdapter';
import type { QuestionProvider } from '../data/adapters/types';
import { addQuestions, getBankStats, deleteBySource, getAllQuestions, normalizeText, StorageError } from '../data/questionStore';
import { getCategoryName } from '../core/categories';
import type { Question, Difficulty } from '../types';

interface FetchFromAPIProps {
  onBack: () => void;
  onImportComplete: () => void;
}

const PROVIDERS: QuestionProvider[] = [openTdbProvider, triviaApiProvider];

const SOURCE_BY_PROVIDER: Record<string, 'opentdb' | 'trivia-api'> = {
  opentdb: 'opentdb',
  'trivia-api': 'trivia-api',
};

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'lett', label: 'Lett' },
  { value: 'middels', label: 'Middels' },
  { value: 'vanskelig', label: 'Vanskelig' },
];

export default function FetchFromAPI({ onBack, onImportComplete }: FetchFromAPIProps) {
  const [providerId, setProviderId] = useState('opentdb');
  const provider = PROVIDERS.find(p => p.id === providerId) ?? openTdbProvider;

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [questionType, setQuestionType] = useState<'multiple' | 'boolean' | ''>('multiple');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<Question[]>([]);
  const [previewDuplicates, setPreviewDuplicates] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState(() => getBankStats());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [rateWait, setRateWait] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Nedtelling for rate-limit
  useEffect(() => {
    const interval = setInterval(() => {
      setRateWait(Math.ceil(provider.msUntilReady() / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [provider]);

  const handleFetch = async () => {
    if (!isOnline) {
      setError('Du er offline. Koble til internett for å hente spørsmål.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreview([]);
    setPreviewDuplicates(new Set());

    try {
      const result = await provider.fetchQuestions({
        amount,
        providerCategory: selectedCategory || undefined,
        difficulty: difficulty || undefined,
        questionType: questionType || undefined,
      });

      // Marker spørsmål som allerede finnes i banken
      const existing = new Set<string>(getAllQuestions().map(q => normalizeText(q.text)));
      const dupes = new Set(
        result.questions.filter(q => existing.has(normalizeText(q.text))).map(q => q.id)
      );
      setPreview(result.questions);
      setPreviewDuplicates(dupes);
      setSuccess(
        `Hentet ${result.questions.length} spørsmål${dupes.size > 0 ? ` (${dupes.size} finnes allerede i banken)` : ''}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil ved henting av spørsmål.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (preview.length === 0) return;
    const source = SOURCE_BY_PROVIDER[provider.id] ?? 'opentdb';
    const newOnly = preview.filter(q => !previewDuplicates.has(q.id));
    if (newOnly.length === 0) {
      setSuccess('Alle spørsmålene finnes allerede i banken.');
      setPreview([]);
      return;
    }
    try {
      const result = addQuestions(newOnly, source, provider.licenseNote);
      setStats(getBankStats());
      setSuccess(`${result.added} spørsmål lagret i spørsmålsbanken!${result.duplicates > 0 ? ` (${result.duplicates} duplikater hoppet over)` : ''}`);
      setPreview([]);
      setPreviewDuplicates(new Set());
      onImportComplete();
    } catch (error) {
      // Lagringsfeil: banken er uendret – vis meldingen (inkl. eksport-hint).
      setError(
        error instanceof StorageError
          ? error.message
          : 'Uventet feil ved lagring. Eksisterende spørsmål er uendret.'
      );
    }
  };

  const handleDeleteBySource = (source: 'opentdb' | 'trivia-api') => {
    try {
      const removed = deleteBySource(source);
      setStats(getBankStats());
      setSuccess(`${removed} spørsmål fjernet.`);
    } catch (error) {
      setError(
        error instanceof StorageError
          ? error.message
          : 'Uventet feil ved sletting. Eksisterende spørsmål er uendret.'
      );
    }
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
            <h1 className="tv-heading text-primary">Hent spørsmål fra nettet</h1>
            <p className="text-text-secondary">
              Kilder: Open Trivia Database og The Trivia API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-success text-sm">
              <Wifi className="w-4 h-4" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-error text-sm">
              <WifiOff className="w-4 h-4" /> Offline
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Leverandørvalg */}
        <div className="grid grid-cols-2 gap-4">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setProviderId(p.id);
                setSelectedCategory('');
                setPreview([]);
                setError(null);
                setSuccess(null);
                if (p.id === 'trivia-api') setQuestionType('');
              }}
              className={`card p-5 text-left transition-all ${
                providerId === p.id ? 'border-primary' : 'hover:border-primary/40'
              }`}
              aria-pressed={providerId === p.id}
            >
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-6 h-6 text-primary" />
                <h2 className="font-display text-xl text-text-primary">{p.name}</h2>
              </div>
              <p className="text-text-secondary text-sm">{p.description}</p>
              <p className="text-text-muted text-xs mt-2">{p.licenseNote}</p>
            </button>
          ))}
        </div>

        {/* Konfigurasjon */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Kategori */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Kategori</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full p-4 bg-bg-elevated border border-border rounded-xl text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="">Alle kategorier</option>
                {provider.categories.map(cat => (
                  <option key={cat.providerId} value={cat.providerId}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Antall */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">
                Antall spørsmål (maks 50 per kall)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={amount}
                  onChange={e => setAmount(parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary"
                  aria-label="Antall spørsmål"
                />
                <span className="font-display text-3xl text-primary min-w-[60px] text-center">
                  {amount}
                </span>
              </div>
            </div>

            {/* Vanskelighet */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Vanskelighet</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setDifficulty('')}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    difficulty === ''
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                  }`}
                >
                  Tilfeldig
                </button>
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      difficulty === d.value
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Spørsmålstype</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuestionType('multiple')}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    questionType === 'multiple'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                  }`}
                >
                  Flervalg
                </button>
                <button
                  onClick={() => setQuestionType('boolean')}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    questionType === 'boolean'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                  }`}
                >
                  Sant/Usant
                </button>
              </div>
            </div>
          </div>

          {/* Hent-knapp med rate-limit-info */}
          <div className="px-6 pb-6">
            <button
              onClick={handleFetch}
              disabled={loading || !isOnline}
              className="w-full btn-primary text-xl py-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Henter spørsmål…
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  Hent {amount} spørsmål
                </>
              )}
            </button>
            {rateWait > 0 && !loading && (
              <p className="text-text-muted text-sm mt-2 text-center flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                Rate-limit: klar om {rateWait} sekunder
              </p>
            )}
          </div>
        </motion.div>

        {/* Meldinger */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="card border-error flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <span className="text-error">{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="card border-success flex items-center gap-3"
              role="status"
            >
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-success">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forhåndsvisning */}
        {preview.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-text-primary">
                Forhåndsvisning ({preview.length})
              </h3>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Database className="w-5 h-5" />
                Lagre i spørsmålsbanken
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {preview.map((q, index) => {
                const isDuplicate = previewDuplicates.has(q.id);
                return (
                  <motion.div
                    key={q.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`card p-4 ${isDuplicate ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-primary font-display text-lg">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-text-primary font-medium mb-2">{q.text}</p>
                        <div className="flex flex-wrap gap-2">
                          {q.choices.map(choice => (
                            <span
                              key={choice.id}
                              className={`px-3 py-1 rounded-full text-sm ${
                                q.correctChoiceIds.includes(choice.id)
                                  ? 'bg-success/20 text-success'
                                  : 'bg-bg-elevated text-text-secondary'
                              }`}
                            >
                              {choice.text}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-text-muted">
                          <span className="capitalize">{q.difficulty}</span>
                          <span>•</span>
                          <span>{q.categories.map(getCategoryName).join(', ')}</span>
                          {isDuplicate && (
                            <>
                              <span>•</span>
                              <span className="text-error">finnes allerede i banken</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bank-statistikk */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-text-primary">Spørsmålsbanken</h2>
            </div>
            <div className="flex gap-2">
              {(['opentdb', 'trivia-api'] as const).map(source => {
                const count = stats.bySource[source] ?? 0;
                if (count === 0) return null;
                return (
                  <button
                    key={source}
                    onClick={() => handleDeleteBySource(source)}
                    className="text-error hover:underline text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Slett {source === 'opentdb' ? 'OpenTDB' : 'Trivia API'} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-bg-elevated rounded-xl">
                <div className="text-2xl font-display text-primary">{stats.total}</div>
                <div className="text-text-secondary text-sm">Totalt</div>
              </div>
              <div className="text-center p-3 bg-bg-elevated rounded-xl">
                <div className="text-2xl font-display text-primary">{stats.bySource.opentdb}</div>
                <div className="text-text-secondary text-sm">OpenTDB</div>
              </div>
              <div className="text-center p-3 bg-bg-elevated rounded-xl">
                <div className="text-2xl font-display text-primary">{stats.bySource['trivia-api'] ?? 0}</div>
                <div className="text-text-secondary text-sm">Trivia API</div>
              </div>
              <div className="text-center p-3 bg-bg-elevated rounded-xl">
                <div className="text-2xl font-display text-primary">
                  {stats.bySource.manual + stats.bySource.import + stats.bySource.seed}
                </div>
                <div className="text-text-secondary text-sm">Egne/Import</div>
              </div>
            </div>

            {/* Fordeling per kategori */}
            <div className="max-h-[200px] overflow-y-auto">
              <h4 className="text-text-secondary font-semibold mb-2">Fordeling per kategori:</h4>
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-text-primary">{getCategoryName(cat)}</span>
                    <span className="text-primary font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Lisens og kildehenvisning */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card border-primary/30">
          <h3 className="font-semibold text-primary mb-3">ℹ️ Om kildene</h3>
          <ul className="text-text-secondary space-y-2 text-sm">
            <li>• <strong>Open Trivia Database:</strong> gratis, ingen API-nøkkel. Maks 1 kall per 5 sekunder.</li>
            <li>• <strong>The Trivia API:</strong> gratis for ikke-kommersiell bruk (CC BY-NC 4.0). Maks 20 kall per 5 sekunder. Stabile spørsmåls-IDer.</li>
            <li>• Spørsmålene er på engelsk og lagres lokalt for offline-bruk.</li>
            <li>• Kildehenvisning lagres med hvert spørsmål og vises i spørsmålsbanken.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
