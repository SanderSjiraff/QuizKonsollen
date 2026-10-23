import { motion } from 'framer-motion';
import { ArrowLeft, Users, Palette, Check, Play } from 'lucide-react';
import type { Player } from '../types';
import { PLAYER_COLORS } from '../data/mockData';

interface LobbyProps {
  players: Player[];
  updatePlayer: (playerId: number, updates: Partial<Player>) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function Lobby({ players, updatePlayer, onStart, onBack }: LobbyProps) {
  const allReady = players.every(p => p.isReady);

  const toggleReady = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    updatePlayer(playerId, { isReady: !player?.isReady });
  };

  const cycleColor = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    const currentIndex = PLAYER_COLORS.indexOf(player?.color || PLAYER_COLORS[0]);
    const nextIndex = (currentIndex + 1) % PLAYER_COLORS.length;
    updatePlayer(playerId, { color: PLAYER_COLORS[nextIndex] });
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="tv-heading text-primary">Spillerlobby</h1>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Users className="w-6 h-6" />
          <span className="text-xl">{players.length} spillere</span>
        </div>
      </div>

      {/* Spilleroversikt */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border-4 transition-all duration-500 ${
                player.isReady
                  ? 'border-success bg-success/10'
                  : 'border-border bg-bg-secondary'
              }`}
            >
              {/* Farge-indikator */}
              <button
                onClick={() => cycleColor(player.id)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: player.color }}
                title="Bytt farge"
              >
                <Palette className="w-5 h-5 text-white/80 mx-auto" />
              </button>

              {/* Spiller-ikon */}
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-display"
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 0 30px ${player.color}40`,
                }}
              >
                {player.id}
              </div>

              {/* Navn */}
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                className="w-full text-center bg-transparent text-xl font-semibold text-text-primary border-b-2 border-border focus:border-primary focus:outline-none pb-2"
              />

              {/* Klar-knapp */}
              <button
                onClick={() => toggleReady(player.id)}
                className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  player.isReady
                    ? 'bg-success text-bg-primary'
                    : 'bg-bg-elevated text-text-secondary hover:bg-primary hover:text-bg-primary'
                }`}
              >
                {player.isReady ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Klar!
                  </span>
                ) : (
                  'Marker som klar'
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Start-knapp */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mt-8 pb-8"
      >
        <button
          onClick={onStart}
          disabled={!allReady}
          className="btn-primary text-2xl px-16 py-6 flex items-center gap-4"
        >
          <Play className="w-8 h-8" />
          {allReady ? 'Start spillet!' : 'Alle må være klare'}
        </button>
      </motion.div>
    </div>
  );
}
