import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Trophy, Medal, Award, Crown, Calendar, Clock,
  BarChart3, TrendingUp, Target, Star, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import type { QuizHistory } from '../data/quizHistory';
import { getQuizHistory, deleteQuizHistory, clearAllHistory } from '../data/quizHistory';

interface ScoreboardProps {
  onBack: () => void;
}

export default function Scoreboard({ onBack }: ScoreboardProps) {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setHistory(getQuizHistory());
  }, []);

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    const itemDate = new Date(item.date);
    const now = new Date();
    switch (filter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return itemDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-primary" />;
      case 1: return <Medal className="w-6 h-6 text-text-secondary" />;
      case 2: return <Award className="w-6 h-6 text-orange-600" />;
      default: return <span className="font-display text-xl text-text-muted w-6 text-center">{index + 1}</span>;
    }
  };

  const handleDelete = (id: string) => {
    deleteQuizHistory(id);
    setHistory(getQuizHistory());
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    clearAllHistory();
    setHistory([]);
    setShowDeleteConfirm(false);
  };

  // Stats
  const totalQuizzes = history.length;
  const totalQuestions = history.reduce((sum, h) => sum + h.totalQuestions, 0);
  const totalDuration = history.reduce((sum, h) => sum + h.duration, 0);
  const bestScore = history.length > 0 ? Math.max(...history.flatMap(h => h.players.map(p => p.score))) : 0;
  const avgDuration = totalQuizzes > 0 ? Math.round(totalDuration / totalQuizzes) : 0;

  /** Varighet er lagret i millisekunder (0 i gamle oppføringer). */
  const formatMinutes = (ms: number) => (ms > 0 ? `${Math.max(1, Math.round(ms / 60000))} min` : '–');

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="tv-heading text-primary">Quiz-historikk</h1>
          </div>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary text-error border-error hover:bg-error hover:text-bg-primary"
          >
            <Trash2 className="w-5 h-5" />
            Tøm historikk
          </button>
        )}
      </div>

      {/* Statistikkoversikt */}
      {history.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card p-4 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-display text-primary">{totalQuizzes}</div>
            <div className="text-text-secondary text-sm">Quizer spilt</div>
          </div>
          <div className="card p-4 text-center">
            <Star className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-display text-primary">{bestScore}</div>
            <div className="text-text-secondary text-sm">Toppscore</div>
          </div>
          <div className="card p-4 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-display text-primary">{totalQuestions}</div>
            <div className="text-text-secondary text-sm">Spørsmål besvart</div>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-display text-primary">{formatMinutes(avgDuration)}</div>
            <div className="text-text-secondary text-sm">Gjennomsnittlig tid</div>
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Filter-knapper */}
        <div className="flex gap-3 mb-8 justify-center">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === f
                  ? 'bg-primary text-bg-primary'
                  : 'bg-bg-elevated text-text-secondary hover:bg-bg-primary'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'today' ? 'I dag' : f === 'week' ? 'Denne uken' : 'Denne måneden'}
            </button>
          ))}
        </div>

        {/* Historikk-liste */}
        {filteredHistory.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-16"
          >
            <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-xl mb-2">Ingen quizer i historikken</p>
            <p className="text-text-muted">Spill noen quizer for å se oversikten!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((quiz, index) => {
              const sortedPlayers = [...quiz.players].sort((a, b) => b.score - a.score);
              const winner = sortedPlayers[0];
              const isExpanded = expandedId === quiz.id;

              return (
                <motion.div
                  key={quiz.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
                >
                  {/* Overskrift - alltid synlig */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : quiz.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-text-muted text-sm">#{history.length - index}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-text-primary">{quiz.quizName}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                            {quiz.mode === 'team' ? 'Lag' : quiz.mode === 'buzzer' ? 'Buzzer' : 'Klassisk'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(quiz.date).toLocaleDateString('no-NO')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatMinutes(quiz.duration)}
                          </span>
                          <span>•</span>
                          <span>{quiz.totalQuestions} spørsmål</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {winner && (
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-primary">{winner.name}</span>
                          </div>
                          <div className="text-sm text-text-secondary">{winner.score} poeng</div>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Utvidet innhold */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-border p-4"
                    >
                      <h4 className="font-semibold text-text-secondary mb-3">Resultater</h4>
                      <div className="space-y-2">
                        {sortedPlayers.map((player, pIndex) => {
                          const correct = quiz.correctByPlayer?.[player.id];
                          return (
                          <div key={player.id} className="flex items-center gap-3">
                            <div className="w-8 flex justify-center">
                              {getRankIcon(pIndex)}
                            </div>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="flex-1 text-text-primary">{player.name}</span>
                            {correct !== undefined && (
                              <span className="text-text-secondary text-sm">
                                {correct}/{quiz.totalQuestions} riktige
                              </span>
                            )}
                            <span className="font-display text-xl text-primary">{player.score}</span>
                          </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex justify-end">
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="text-error hover:underline text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Slett fra historikk
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bekreftelse for tømming */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
        >
          <div className="card max-w-md w-full">
            <h3 className="font-display text-2xl text-error mb-4">Tøm historikk?</h3>
            <p className="text-text-secondary mb-6">
              Dette vil slette alle {history.length} quizer fra historikken. Dette kan ikke angres.
            </p>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button 
                onClick={handleClearAll}
                className="btn-primary bg-error hover:bg-error"
              >
                Tøm alt
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
