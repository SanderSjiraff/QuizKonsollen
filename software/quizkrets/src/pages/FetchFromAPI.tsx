import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Globe, AlertCircle, Check, Loader2, 
  Database, Trash2, BarChart3, Wifi, WifiOff
} from 'lucide-react';
import { 
  fetchCategories, 
  fetchQuestions, 
  convertToQuizKretsFormat,
  cacheQuestions,
  clearQuestionCache,
  getCacheStats,
  type OpenTDBCategory,
} from '../data/openTriviaDB';

interface FetchQuestionsProps {
  onBack: () => void;
  onImportComplete: (questions: any[]) => void;
}

export default function FetchFromAPI({ onBack, onImportComplete }: FetchQuestionsProps) {
  const [categories, setCategories] = useState<OpenTDBCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<string>('');
  const [type, setType] = useState<string>('multiple');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState({ total: 0, byCategory: {} as Record<string, number> });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadCategories();
    updateCacheStats();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      setError('Kunne ikke laste kategorier. Sjekk internettforbindelsen.');
    }
  };

  const updateCacheStats = () => {
    setCacheStats(getCacheStats());
  };

  const handleFetch = async () => {
    if (!isOnline) {
      setError('Du er offline. Koble til internett for å hente spørsmål.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewQuestions([]);

    try {
      const rawQuestions = await fetchQuestions({
        amount,
        category: selectedCategory,
        difficulty: difficulty || undefined,
        type: type || undefined,
      });

      const converted = convertToQuizKretsFormat(rawQuestions);
      
      setPreviewQuestions(converted);
      updateCacheStats();
      setSuccess(`Hentet ${converted.length} spørsmål!`);
    } catch (err: any) {
      setError(err.message || 'Ukjent feil ved henting av spørsmål');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = () => {
    if (previewQuestions.length === 0) return;
    
    cacheQuestions(previewQuestions);
    onImportComplete(previewQuestions);
    updateCacheStats();
    setSuccess(`${previewQuestions.length} spørsmål lagret i spørsmålsbanken!`);
    setPreviewQuestions([]);
  };

  const handleClearCache = () => {
    clearQuestionCache();
    updateCacheStats();
    setSuccess('Cache tømt!');
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="tv-heading text-primary">Hent spørsmål fra nettet</h1>
            <p className="text-text-secondary">Open Trivia Database - Gratis API med 5000+ spørsmål</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-success text-sm">
              <Wifi className="w-4 h-4" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-error text-sm">
              <WifiOff className="w-4 h-4" />
              Offline
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Konfigurasjon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl text-text-primary">Spørsmålsinnstillinger</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kategori */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Kategori</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full p-4 bg-bg-elevated border border-border rounded-xl text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="">Alle kategorier</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Antall spørsmål */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Antall spørsmål</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="font-display text-3xl text-primary min-w-[60px] text-center">
                  {amount}
                </span>
              </div>
              <p className="text-text-muted text-sm mt-1">Maks 50 per forespørsel</p>
            </div>

            {/* Vanskelighet */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Vanskelighet</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '', label: 'Tilfeldig' },
                  { value: 'easy', label: 'Lett' },
                  { value: 'medium', label: 'Middels' },
                  { value: 'hard', label: 'Vanskelig' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`py-3 px-2 rounded-xl border-2 font-semibold transition-all text-sm ${
                      difficulty === opt.value
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-text-secondary mb-2 font-semibold">Spørsmålstype</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'multiple', label: 'Flervalg' },
                  { value: 'boolean', label: 'Sant/Usant' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                      type === opt.value
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hent-knapp */}
          <button
            onClick={handleFetch}
            disabled={loading || !isOnline}
            className="w-full mt-6 btn-primary text-xl py-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Henter spørsmål (vent 5 sek)...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Hent {amount} spørsmål
              </>
            )}
          </button>

          {amount > 10 && (
            <p className="text-text-muted text-sm mt-2 text-center">
              ⚡ Tips: Start med 10 spørsmål for å teste kategorien først
            </p>
          )}
        </motion.div>

        {/* Feilmelding */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="card border-error flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <span className="text-error">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suksessmelding */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="card border-success flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-success">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview */}
        {previewQuestions.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-text-primary">Forhåndsvisning</h3>
              <button
                onClick={handleSaveToBank}
                className="btn-primary flex items-center gap-2"
              >
                <Database className="w-5 h-5" />
                Lagre i spørsmålsbanken
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {previewQuestions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-primary font-display text-lg">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium mb-2">{q.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.choices.map((choice: any) => (
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
                        <span>{q.categories[0]}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cache-statistikk */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-text-primary">Hentede spørsmål</h2>
            </div>
            {cacheStats.total > 0 && (
              <button
                onClick={handleClearCache}
                className="text-error hover:underline text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Tøm cache
              </button>
            )}
          </div>

          {cacheStats.total === 0 ? (
            <p className="text-text-muted text-center py-4">
              Ingen spørsmål hentet ennå. Bruk skjemaet over for å hente spørsmål.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-bg-elevated rounded-xl">
                  <div className="text-2xl font-display text-primary">{cacheStats.total}</div>
                  <div className="text-text-secondary text-sm">Totalt hentet</div>
                </div>
                <div className="text-center p-3 bg-bg-elevated rounded-xl">
                  <div className="text-2xl font-display text-primary">
                    {Object.keys(cacheStats.byCategory).length}
                  </div>
                  <div className="text-text-secondary text-sm">Kategorier</div>
                </div>
              </div>

              {/* Kategori-liste */}
              <div className="max-h-[200px] overflow-y-auto">
                <h4 className="text-text-secondary font-semibold mb-2">Fordeling per kategori:</h4>
                {Object.entries(cacheStats.byCategory)
                  .sort(([,a], [,b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-text-primary capitalize">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-primary font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Informasjon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card border-primary/30"
        >
          <h3 className="font-semibold text-primary mb-3">ℹ️ Om Open Trivia Database</h3>
          <ul className="text-text-secondary space-y-2 text-sm">
            <li>• Gratis API - ingen registrering eller API-nøkkel nødvendig</li>
            <li>• 5,000+ verifiserte spørsmål i 24 kategorier</li>
            <li>• Rate limit: maks 1 forespørsel per 5 sekunder</li>
            <li>• Hent 10-50 spørsmål om gangen for best ytelse</li>
            <li>• Spørsmålene caches lokalt for offline-bruk</li>
            <li>• Maks 1,000 spørsmål lagret lokalt</li>
            <li>• Spørsmålene er på engelsk - kan oversettes manuelt eller med AI</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
