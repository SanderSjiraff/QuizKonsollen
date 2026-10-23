import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Shuffle, Check, Save } from 'lucide-react';
import type { GameConfig } from '../hooks/useGameEngine';
import { CATEGORIES, SAMPLE_PRESETS, PLAYER_COLORS } from '../data/mockData';

interface QuizBuilderProps {
  config: GameConfig;
  updateConfig: (updates: Partial<GameConfig>) => void;
  onBack: () => void;
  onStart: () => void;
  onSaveQuiz: () => void;
}

export default function QuizBuilder({ config, updateConfig, onBack, onStart, onSaveQuiz }: QuizBuilderProps) {
  const [usePreset, setUsePreset] = useState(false);

  const toggleCategory = (categoryId: string) => {
    const newCategories = config.selectedCategories.includes(categoryId)
      ? config.selectedCategories.filter(c => c !== categoryId)
      : [...config.selectedCategories, categoryId];
    updateConfig({ selectedCategories: newCategories });
  };

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = config.selectedDifficulties.includes(difficulty)
      ? config.selectedDifficulties.filter(d => d !== difficulty)
      : [...config.selectedDifficulties, difficulty];
    updateConfig({ selectedDifficulties: newDifficulties });
  };

  const adjustQuestionCount = (delta: number) => {
    const newCount = Math.max(5, Math.min(50, config.questionCount + delta));
    updateConfig({ questionCount: newCount });
  };

  const adjustPlayerCount = (delta: number) => {
    const currentCount = config.players.length;
    const newCount = Math.max(1, Math.min(8, currentCount + delta));
    
    if (newCount > currentCount) {
      // Legg til spillere
      const newPlayers = [...config.players];
      for (let i = currentCount; i < newCount; i++) {
        newPlayers.push({
          id: i + 1,
          name: `Spiller ${i + 1}`,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
          score: 0,
          isReady: i === 0, // Spiller 1 er automatisk klar
        });
      }
      updateConfig({ players: newPlayers });
    } else if (newCount < currentCount) {
      // Fjern spillere
      updateConfig({ players: config.players.slice(0, newCount) });
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      updateConfig({
        selectedCategories: preset.categories,
        selectedDifficulties: preset.difficulties,
        questionCount: preset.questionCount,
        gameMode: preset.rounds[0].mode,
        timePerQuestion: preset.rounds[0].timeLimit,
      });
      setUsePreset(false);
    }
  };

  const canStart = config.selectedCategories.length > 0 && config.selectedDifficulties.length > 0;

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="tv-heading text-primary">Bygg din quiz</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Forhåndsinnstillinger */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-text-primary">Forhåndsinnstillinger</h2>
            <button
              onClick={() => setUsePreset(!usePreset)}
              className="text-primary hover:text-primary-hover transition-colors"
            >
              {usePreset ? 'Skjul' : 'Vis'}
            </button>
          </div>
          {usePreset && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset.id)}
                  className="text-left p-4 rounded-xl bg-bg-elevated hover:bg-bg-primary border border-border hover:border-primary transition-all"
                >
                  <h3 className="font-semibold text-lg text-text-primary">{preset.name}</h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {preset.questionCount} spørsmål • {preset.categories.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Kategorier */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Velg temaer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => {
              const isSelected = config.selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-bg-elevated hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                    {cat.name}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary mx-auto mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Vanskelighetsgrader */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Vanskelighetsgrader</h2>
          <div className="flex gap-4">
            {['lett', 'middels', 'vanskelig'].map(diff => {
              const isSelected = config.selectedDifficulties.includes(diff);
              const labels: Record<string, string> = { lett: 'Lett', middels: 'Middels', vanskelig: 'Vanskelig' };
              return (
                <button
                  key={diff}
                  onClick={() => toggleDifficulty(diff)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border bg-bg-elevated text-text-secondary hover:border-success/50'
                  }`}
                >
                  <span className="font-semibold">{labels[diff]}</span>
                  {isSelected && <Check className="w-5 h-5 mx-auto mt-2" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Antall spørsmål */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Antall spørsmål</h2>
          <div className="flex items-center gap-6">
            <button
              onClick={() => adjustQuestionCount(-5)}
              className="btn-secondary p-4"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="font-display text-5xl text-primary min-w-[100px] text-center">
              {config.questionCount}
            </span>
            <button
              onClick={() => adjustQuestionCount(5)}
              className="btn-secondary p-4"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={config.questionCount}
            onChange={(e) => updateConfig({ questionCount: parseInt(e.target.value) })}
            className="w-full mt-4 accent-primary"
          />
        </motion.div>

        {/* Spillmodus */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Spillmodus</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { id: 'classic', label: 'Klassisk', desc: 'Alle svarer på alle spørsmål', icon: Check },
              { id: 'buzzer', label: 'Buzzer', desc: 'Førstemann til å svare', icon: Plus },
              { id: 'team', label: 'Lag', desc: 'Spill på lag', icon: Shuffle }
            ] as const).map(mode => {
              const isSelected = config.gameMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => updateConfig({ gameMode: mode.id })}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-bg-elevated hover:border-primary/50'
                  }`}
                >
                  <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                    {mode.label}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tidsinnstilling */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Tid per spørsmål</h2>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary">10s</span>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={config.timePerQuestion}
              onChange={(e) => updateConfig({ timePerQuestion: parseInt(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-text-secondary">60s</span>
            <span className="font-display text-3xl text-primary min-w-[80px] text-right">
              {config.timePerQuestion}s
            </span>
          </div>
        </motion.div>

        {/* Antall spillere */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Antall spillere</h2>
          <div className="flex items-center gap-6 justify-center">
            <button
              onClick={() => adjustPlayerCount(-1)}
              disabled={config.players.length <= 1}
              className="btn-secondary p-4 disabled:opacity-50"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="font-display text-5xl text-primary min-w-[100px] text-center">
              {config.players.length}
            </span>
            <button
              onClick={() => adjustPlayerCount(1)}
              disabled={config.players.length >= 8}
              className="btn-secondary p-4 disabled:opacity-50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <p className="text-text-secondary text-center mt-2">
            {config.players.length === 1 ? "Enspiller: Spill alene og prøv å slå din egen rekord" : `Flerspiller: ${config.players.length} spillere`}
          </p>
          
          {/* Spilleroversikt */}
          <div className="flex justify-center gap-3 mt-4">
            {config.players.map((p, i) => (
              <div 
                key={p.id} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {p.id}
              </div>
            ))}
          </div>
        </motion.div>
        {/* Lagre quiz */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center pb-4"
        >
          <button
            onClick={onSaveQuiz}
            disabled={!canStart}
            className="btn-secondary text-xl px-8 py-4 flex items-center gap-3"
          >
            <Save className="w-6 h-6" />
            Lagre quiz
          </button>
        </motion.div>

        {/* Start-knapp */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex justify-center pb-12"
        >
          <button
            onClick={onStart}
            disabled={!canStart}
            className="btn-primary text-2xl px-16 py-6 flex items-center gap-4"
          >
            <Check className="w-8 h-8" />
            {canStart ? 'Bekreft og fortsett' : 'Velg minst ett tema'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
