import { motion } from 'framer-motion';
import { ArrowLeft, Users, Timer, Zap } from 'lucide-react';
import type { GameConfig } from '../hooks/useGameEngine';

interface GameSetupProps {
  config: GameConfig;
  updateConfig: (updates: Partial<GameConfig>) => void;
  onBack: () => void;
  onStart: () => void;
}

export default function GameSetup({ config, updateConfig, onBack, onStart }: GameSetupProps) {
  const adjustPlayerCount = (delta: number) => {
    const newCount = Math.max(2, Math.min(8, config.players.length + delta));
    if (newCount > config.players.length) {
      const newPlayers = [...config.players];
      for (let i = config.players.length; i < newCount; i++) {
        newPlayers.push({
          id: i + 1,
          name: `Spiller ${i + 1}`,
          color: ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#06B6D4', '#F97316'][i],
          score: 0,
          isReady: false,
        });
      }
      updateConfig({ players: newPlayers });
    } else if (newCount < config.players.length) {
      updateConfig({ players: config.players.slice(0, newCount) });
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="tv-heading text-primary">Spilloppsett</h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Antall spillere */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl text-text-primary">Antall spillere</h2>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => adjustPlayerCount(-1)}
              className="btn-secondary p-4"
              disabled={config.players.length <= 2}
            >
              −
            </button>
            <span className="font-display text-5xl text-primary min-w-[80px] text-center">
              {config.players.length}
            </span>
            <button
              onClick={() => adjustPlayerCount(1)}
              className="btn-secondary p-4"
              disabled={config.players.length >= 8}
            >
              +
            </button>
          </div>
        </motion.div>

        {/* Spillere med farger */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="font-display text-2xl text-text-primary mb-4">Spillere</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.players.map(player => (
              <div
                key={player.id}
                className="p-4 rounded-xl bg-bg-elevated text-center"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-text-secondary text-sm">Spiller {player.id}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Spillmodus */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl text-text-primary">Spillmodus</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['classic', 'buzzer', 'team'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => updateConfig({ gameMode: mode })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  config.gameMode === mode
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-bg-elevated hover:border-primary/50'
                }`}
              >
                <h3 className={`font-semibold ${config.gameMode === mode ? 'text-primary' : 'text-text-primary'}`}>
                  {mode === 'classic' ? 'Klassisk' : mode === 'buzzer' ? 'Buzzer' : 'Lag'}
                </h3>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tidsinnstilling */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <Timer className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl text-text-primary">Tid per spørsmål</h2>
          </div>
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

        {/* Start-knapp */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center pb-12"
        >
          <button
            onClick={onStart}
            className="btn-primary text-2xl px-16 py-6 flex items-center gap-4"
          >
            <Zap className="w-8 h-8" />
            Start spillet!
          </button>
        </motion.div>
      </div>
    </div>
  );
}
