import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, Crown, Medal, Award } from 'lucide-react';
import type { Player } from '../types';

interface ResultsProps {
  players: Player[];
  scores: Record<number, number>;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function Results({ players, scores, onPlayAgain, onMainMenu }: ResultsProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores[a.id] || 0;
    const scoreB = scores[b.id] || 0;
    return scoreB - scoreA;
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-8 h-8 text-primary" />;
      case 1: return <Medal className="w-8 h-8 text-text-secondary" />;
      case 2: return <Award className="w-8 h-8 text-orange-600" />;
      default: return <span className="font-display text-2xl text-text-muted">{index + 1}</span>;
    }
  };

  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <Trophy className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="tv-heading text-primary text-glow-primary">Resultater</h1>
        <p className="text-text-secondary text-xl mt-2">Spillet er ferdig!</p>
      </motion.div>

      {/* Podium / Rangering */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        {/* Vinner (hvis det er noen spillere) */}
        {sortedPlayers.length > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-center mb-12"
          >
            <div
              className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                backgroundColor: sortedPlayers[0].color,
                boxShadow: `0 0 40px ${sortedPlayers[0].color}60`,
              }}
            >
              <Crown className="w-16 h-16 text-white" />
            </div>
            <h2 className="font-display text-4xl text-text-primary mb-2">
              {sortedPlayers[0].name}
            </h2>
            <p className="font-display text-5xl text-primary text-glow-primary">
              {scores[sortedPlayers[0].id] || 0} poeng
            </p>
            <p className="text-success text-xl mt-2 font-semibold">Vinner!</p>
          </motion.div>
        )}

        {/* Full rangering */}
        <div className="w-full space-y-4">
          {sortedPlayers.map((player, index) => {
            const score = scores[player.id] || 0;
            const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

            return (
              <motion.div
                key={player.id}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                {/* Rank */}
                <div className="w-12 flex justify-center">
                  {getRankIcon(index)}
                </div>

                {/* Spiller-info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-semibold text-text-primary">{player.name}</span>
                    <span className="font-display text-2xl text-primary">{score}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-4 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: player.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Knapper */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-6 mt-12 pb-8"
      >
        <button onClick={onPlayAgain} className="btn-primary text-xl flex items-center gap-3">
          <RotateCcw className="w-6 h-6" />
          Spill igjen
        </button>
        <button onClick={onMainMenu} className="btn-secondary text-xl flex items-center gap-3">
          <Home className="w-6 h-6" />
          Hovedmeny
        </button>
      </motion.div>
    </div>
  );
}
