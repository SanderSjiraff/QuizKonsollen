import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Play, Save, Users, Zap, Check, Gauge, Timer,
  AlertTriangle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import type { GameConfig, SelectionError } from '../hooks/useGameEngine';
import {
  getMainCategories,
  getSubcategories,
  getCategoryName,
} from '../core/categories';
import { PLAYER_COLORS } from '../data/mockData';
import SelectionErrorDialog from '../components/SelectionErrorDialog';
import type { Difficulty, GameMode, Player, Team } from '../types';

interface QuizBuilderProps {
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
  onFetchMore?: () => void;
  onBack: () => void;
  /** Start quizen. Kan sende konfigurasjonsendringer (f.eks. redusert antall). */
  onStart: (configUpdates?: Partial<GameConfig>) => void;
  onSaveQuiz: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'lett', label: 'Lett' },
  { value: 'middels', label: 'Middels' },
  { value: 'vanskelig', label: 'Vanskelig' },
];

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

/** Bygg to lag fra spillernes teamId. */
function buildTeams(players: Player[]): Team[] {
  return [1, 2].map(teamId => ({
    id: teamId,
    name: `Lag ${teamId}`,
    color: teamId === 1 ? '#3B82F6' : '#F59E0B',
    score: 0,
    playerIds: players.filter(p => (p.teamId ?? (p.id % 2 === 1 ? 1 : 2)) === teamId).map(p => p.id),
  }));
}

export default function QuizBuilder({
  config,
  updateConfig,
  getAvailability,
  selectionError,
  onDismissSelectionError,
  onStartWithReuse,
  onFetchMore,
  onBack,
  onStart,
  onSaveQuiz,
}: QuizBuilderProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const mainCategories = getMainCategories();
  const difficulties = config.selectedDifficulties as Difficulty[];

  /** Total tilgjengelighet for hele utvalget. */
  const availability = getAvailability({
    categories: config.selectedCategories,
    difficulties,
    count: config.questionCount,
  });

  const enoughAvailable = availability.fresh >= config.questionCount;

  const toggleCategory = (categoryId: string) => {
    const newCategories = config.selectedCategories.includes(categoryId)
      ? config.selectedCategories.filter(c => c !== categoryId)
      : [...config.selectedCategories, categoryId];
    updateConfig({ selectedCategories: newCategories });
  };

  const setCategoryWeight = (categoryId: string, weight: number) => {
    const current = config.categoryWeights ?? {};
    if (weight <= 0) {
      const { [categoryId]: _removed, ...rest } = current;
      updateConfig({ categoryWeights: rest });
    } else {
      updateConfig({ categoryWeights: { ...current, [categoryId]: weight } });
    }
  };

  const toggleSubcategory = (subId: string) => {
    const newCategories = config.selectedCategories.includes(subId)
      ? config.selectedCategories.filter(c => c !== subId)
      : [...config.selectedCategories, subId];
    updateConfig({ selectedCategories: newCategories });
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const newDifficulties = difficulties.includes(difficulty)
      ? difficulties.filter(d => d !== difficulty)
      : [...difficulties, difficulty];
    updateConfig({ selectedDifficulties: newDifficulties.length > 0 ? newDifficulties : [difficulty] });
  };

  const setPlayerCount = (count: number) => {
    const players = buildPlayers(count, config.players);
    updateConfig({
      players,
      teams: config.gameMode === 'team' ? buildTeams(players) : [],
    });
  };

  const setGameMode = (mode: GameMode) => {
    updateConfig({
      gameMode: mode,
      teams: mode === 'team' ? buildTeams(config.players) : [],
    });
  };

  /** Flytt en spiller mellom lag 1 og lag 2. */
  const togglePlayerTeam = (playerId: number) => {
    const players = config.players.map(p => {
      if (p.id !== playerId) return p;
      const current = p.teamId ?? (p.id % 2 === 1 ? 1 : 2);
      return { ...p, teamId: current === 1 ? 2 : 1 };
    });
    updateConfig({ players, teams: buildTeams(players) });
  };

  const summaryChips = useMemo(
    () =>
      config.selectedCategories.length > 0
        ? config.selectedCategories.map(getCategoryName)
        : ['Alle kategorier'],
    [config.selectedCategories]
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="tv-heading text-primary">Bygg quiz</h1>
            <p className="text-text-secondary">Velg temaer, vanskelighet og spillinnstillinger</p>
          </div>
        </div>
        <input
          type="text"
          value={config.quizName}
          onChange={e => updateConfig({ quizName: e.target.value })}
          placeholder="Navn på quizen"
          className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-semibold focus:border-primary focus:outline-none min-w-[240px]"
          aria-label="Quiznavn"
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Venstre kolonne: temaer og vanskelighet */}
        <div className="space-y-6">
          {/* Temaer */}
          <div className="card p-5">
            <h2 className="font-display text-xl text-text-primary mb-4">1. Temaer</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {mainCategories.map(cat => {
                const selected = config.selectedCategories.includes(cat.id);
                const subs = getSubcategories(cat.id);
                const expanded = expandedCategory === cat.id;
                const catAvailability = getAvailability({
                  categories: [cat.id],
                  difficulties,
                });
                return (
                  <div key={cat.id} className="contents">
                    <div className="col-span-2 sm:col-span-1">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/15'
                            : 'border-border bg-bg-elevated hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary flex items-center gap-2">
                            <span>{cat.icon}</span>
                            {cat.name}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md ${
                              catAvailability.fresh > 0
                                ? 'bg-success/15 text-success'
                                : 'bg-error/15 text-error'
                            }`}
                          >
                            {catAvailability.fresh}
                          </span>
                        </div>
                      </button>
                      {subs.length > 0 && (
                        <button
                          onClick={() => setExpandedCategory(expanded ? null : cat.id)}
                          className="text-text-muted text-xs mt-1 flex items-center gap-1 hover:text-text-secondary transition-colors"
                          aria-expanded={expanded}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          Underkategorier
                        </button>
                      )}
                      {expanded && (
                        <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-bg-card rounded-lg">
                          {subs.map(sub => {
                            const subSelected = config.selectedCategories.includes(sub.id);
                            return (
                              <button
                                key={sub.id}
                                onClick={() => toggleSubcategory(sub.id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                  subSelected
                                    ? 'border-primary bg-primary/15 text-primary'
                                    : 'border-border text-text-secondary hover:border-primary/50'
                                }`}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vanskelighet og antall */}
          <div className="card p-5">
            <h2 className="font-display text-xl text-text-primary mb-4">2. Vanskelighet og antall</h2>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => toggleDifficulty(d.value)}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    difficulties.includes(d.value)
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-3">
              <Timer className="w-5 h-5 text-primary" />
              <span className="text-text-secondary font-semibold flex-1">
                Antall spørsmål: <span className="text-primary font-display text-2xl">{config.questionCount}</span>
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={config.questionCount}
              onChange={e => updateConfig({ questionCount: parseInt(e.target.value, 10) })}
              className="w-full accent-primary"
              aria-label="Antall spørsmål"
            />

            <div
              className={`mt-4 rounded-xl p-3 text-sm ${
                enoughAvailable ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}
              role="status"
            >
              {enoughAvailable ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {availability.fresh} ubrukte spørsmål passer valgene dine
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Bare {availability.fresh} ubrukte spørsmål ({availability.withReuse} med gjenbruk)
                </span>
              )}
            </div>
          </div>

          {/* Kategorivekting */}
          {config.selectedCategories.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display text-xl text-text-primary mb-4">2b. Kategorivekting (valgfritt)</h2>
              <p className="text-text-muted text-sm mb-3">
                Juster hvor mange spørsmål fra hver kategori. Uten vekter velges spørsmål tilfeldig blant alle valgte kategorier.
              </p>
              <div className="space-y-3">
                {config.selectedCategories.map(catId => (
                  <div key={catId} className="flex items-center gap-3">
                    <span className="text-text-secondary text-sm w-24 truncate">{getCategoryName(catId)}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={config.categoryWeights?.[catId] ?? 0}
                      onChange={e => setCategoryWeight(catId, parseInt(e.target.value, 10))}
                      className="flex-1 accent-primary"
                      aria-label={`Vekt for ${getCategoryName(catId)}`}
                    />
                    <span className="text-primary font-display w-10 text-right">{config.categoryWeights?.[catId] ?? 0}%</span>
                  </div>
                ))}
              </div>
              {Object.keys(config.categoryWeights ?? {}).length === 0 && (
                <p className="text-text-muted text-xs mt-2 italic">Ingen vekter satt – tilfeldig fordeling.</p>
              )}
            </div>
          )}
        </div>

        {/* Høyre kolonne: spillinnstillinger og oppsummering */}
        <div className="space-y-6">
          {/* Spillinnstillinger */}
          <div className="card p-5">
            <h2 className="font-display text-xl text-text-primary mb-4">3. Spillinnstillinger</h2>

            {/* Modus */}
            <p className="text-text-secondary font-semibold mb-2">Spillmodus</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(
                [
                  { value: 'classic' as GameMode, label: 'Klassisk', icon: Check },
                  { value: 'buzzer' as GameMode, label: 'Buzzer', icon: Zap },
                  { value: 'team' as GameMode, label: 'Lag', icon: Users },
                ]
              ).map(m => (
                <button
                  key={m.value}
                  onClick={() => setGameMode(m.value)}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all flex flex-col items-center gap-1 ${
                    config.gameMode === m.value
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
                onClick={() => setPlayerCount(Math.max(1, config.players.length - 1))}
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
                onClick={() => setPlayerCount(Math.min(8, config.players.length + 1))}
                className="btn-secondary px-5 py-2 text-xl"
                aria-label="Flere spillere"
              >
                +
              </button>
            </div>

            {/* Lag-inndeling (kun i lag-modus) */}
            {config.gameMode === 'team' && config.players.length >= 2 && (
              <div className="mb-5">
                <p className="text-text-secondary font-semibold mb-2">
                  Laginndeling (trykk for å bytte lag)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map(teamId => (
                    <div key={teamId} className="rounded-xl border border-border p-3 bg-bg-elevated">
                      <p className="font-semibold mb-2" style={{ color: teamId === 1 ? '#3B82F6' : '#F59E0B' }}>
                        Lag {teamId}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {config.players
                          .filter(p => (p.teamId ?? (p.id % 2 === 1 ? 1 : 2)) === teamId)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => togglePlayerTeam(p.id)}
                              className="px-2.5 py-1 rounded-full text-sm border border-border hover:border-primary transition-colors"
                              title="Bytt lag"
                            >
                              {p.name}
                            </button>
                          ))}
                        {config.players.filter(p => (p.teamId ?? (p.id % 2 === 1 ? 1 : 2)) === teamId).length === 0 && (
                          <span className="text-text-muted text-sm">Ingen spillere</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tid per spørsmål */}
            <div className="flex items-center gap-4 mb-3">
              <Gauge className="w-5 h-5 text-primary" />
              <span className="text-text-secondary font-semibold flex-1">
                Tid per spørsmål:{' '}
                <span className="text-primary font-display text-2xl">{config.timePerQuestion}s</span>
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={config.timePerQuestion}
              onChange={e => updateConfig({ timePerQuestion: parseInt(e.target.value, 10) })}
              className="w-full accent-primary mb-5"
              aria-label="Tid per spørsmål"
            />

            {/* Poeng */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-text-secondary text-sm font-semibold mb-1">
                  Poeng riktig
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={50}
                  value={config.pointsPerCorrect}
                  onChange={e => updateConfig({ pointsPerCorrect: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2.5 text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm font-semibold mb-1">
                  Poeng feil
                </label>
                <input
                  type="number"
                  min={-500}
                  max={500}
                  step={25}
                  value={config.pointsPerWrong}
                  onChange={e => updateConfig({ pointsPerWrong: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2.5 text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => updateConfig({ bonusForSpeed: !config.bonusForSpeed })}
                  className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    config.bonusForSpeed
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-primary/50'
                  }`}
                >
                  Hastighetsbonus {config.bonusForSpeed ? 'på' : 'av'}
                </button>
              </div>
            </div>
          </div>

          {/* Oppsummering */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card border-primary/30 p-5"
          >
            <h2 className="font-display text-xl text-text-primary mb-4">4. Oppsummering</h2>
            <dl className="space-y-2.5 text-lg mb-6">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Navn</dt>
                <dd className="text-text-primary font-semibold text-right">{config.quizName || 'Uten navn'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Temaer</dt>
                <dd className="text-text-primary font-semibold text-right">{summaryChips.join(', ')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Vanskelighet</dt>
                <dd className="text-text-primary font-semibold">
                  {difficulties.map(d => DIFFICULTIES.find(x => x.value === d)?.label).join(' · ')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Spørsmål</dt>
                <dd className="text-text-primary font-semibold">
                  {config.questionCount} (av {availability.fresh} tilgjengelige)
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Modus</dt>
                <dd className="text-text-primary font-semibold capitalize">
                  {config.gameMode === 'classic' ? 'Klassisk' : config.gameMode === 'buzzer' ? 'Buzzer' : 'Lag'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Spillere</dt>
                <dd className="text-text-primary font-semibold">
                  {config.players.length}
                  {config.gameMode === 'team' && config.teams.length > 0
                    ? ` (i ${config.teams.length} lag)`
                    : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Tid per spørsmål</dt>
                <dd className="text-text-primary font-semibold">{config.timePerQuestion} sek</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Poeng</dt>
                <dd className="text-text-primary font-semibold">
                  +{config.pointsPerCorrect} / {config.pointsPerWrong}
                  {config.bonusForSpeed ? ' + hastighetsbonus' : ''}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onStart()}
                className="btn-primary flex-1 py-4 text-xl flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                Start quiz
              </button>
              <button
                onClick={onSaveQuiz}
                className="btn-secondary flex-1 py-4 text-xl flex items-center justify-center gap-2"
              >
                <Save className="w-6 h-6" />
                Lagre quiz
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dialog når valgene ikke kan oppfylles */}
      {selectionError && (
        <SelectionErrorDialog
          error={selectionError}
          categories={config.selectedCategories}
          difficulties={difficulties}
          onReduceCount={newCount => onStart({ questionCount: newCount })}
          onAllowReuse={onStartWithReuse}
          onFetchMore={onFetchMore ?? onDismissSelectionError}
          onDismiss={onDismissSelectionError}
        />
      )}
    </div>
  );
}
