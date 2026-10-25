import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Trophy, RotateCcw, Home, Crown, Medal, Award, ArrowLeft,
  CheckCircle2, XCircle, HelpCircle, Clock, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Question } from '../types';
import { statsBarFractions, type PlayerStats, type TeamResult, type AnswerRecord } from '../core/scoring';

interface ResultsProps {
  rankedPlayers: PlayerStats[];
  teamResults: TeamResult[];
  questions: Question[];
  answers: AnswerRecord[];
  quizName: string;
  durationMs: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onBackToLobby?: () => void;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '–';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} min ${seconds} sek` : `${seconds} sek`;
}

/** Stabelbar per spiller: riktig / feil / ubesvart.
 *
 * Andelene beregnes av statsBarFractions: nevneren er summen av alle
 * svarmuligheter (spillere × spørsmål i valgt modus), slik at stolpene
 * alltid summerer seg til 100 % – også for lag med flere spillere.
 */
function StatsBar({ stats }: { stats: Pick<PlayerStats, 'correct' | 'wrong' | 'unanswered'> & { playerName: string } }) {
  const fractions = statsBarFractions(stats);
  return (
    <div className="flex h-4 rounded-full overflow-hidden bg-bg-elevated w-full max-w-md" role="img" aria-label={`${stats.playerName}: ${stats.correct} riktige, ${stats.wrong} feil, ${stats.unanswered} ubesvarte`}>
      <div className="bg-success" style={{ width: `${fractions.correct}%` }} />
      <div className="bg-error" style={{ width: `${fractions.wrong}%` }} />
      <div className="bg-border/60" style={{ width: `${fractions.unanswered}%` }} />
    </div>
  );
}

export default function Results({
  rankedPlayers,
  teamResults,
  questions,
  answers,
  quizName,
  durationMs,
  onPlayAgain,
  onMainMenu,
  onBackToLobby,
}: ResultsProps) {
  const reducedMotion = useReducedMotion();
  const [showReview, setShowReview] = useState(false);

  const winner = rankedPlayers[0];
  const totalCorrect = rankedPlayers.reduce((s, p) => s + p.correct, 0);
  const totalQuestionsAll = questions.length;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-8 h-8 text-primary" />;
      case 1: return <Medal className="w-8 h-8 text-text-secondary" />;
      case 2: return <Award className="w-8 h-8 text-orange-600" />;
      default: return <span className="font-display text-2xl text-text-muted">{index + 1}</span>;
    }
  };

  /** Svar per spiller for ett spørsmål (til gjennomgang). */
  const answerFor = (questionId: string, playerId: number) =>
    answers.find(a => a.questionId === questionId && a.playerId === playerId);

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header med vinner */}
      <div className="text-center mb-10">
        <motion.div
          initial={reducedMotion ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/15 border-4 border-primary mb-4"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.p
          initial={reducedMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-text-secondary text-xl"
        >
          {quizName} • {formatDuration(durationMs)}
        </motion.p>
        <motion.h1
          initial={reducedMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="tv-heading text-primary"
        >
          {winner ? `${winner.playerName} vinner!` : 'Resultater'}
        </motion.h1>
        {winner && (
          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-text-secondary text-2xl mt-2"
          >
            {winner.totalPoints} poeng • {winner.correct} av {winner.totalQuestions} riktige ({winner.accuracy} %)
          </motion.p>
        )}
      </div>

      {/* Lagresultater (team-modus) */}
      {teamResults.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="font-display text-2xl text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Lagresultater
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamResults.map((team, index) => (
              <div key={team.teamId} className="card p-5 border-2" style={{ borderColor: team.color }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xl" style={{ color: team.color }}>
                    {index === 0 && <Crown className="inline w-5 h-5 mr-1 text-primary" />}
                    {team.name}
                  </span>
                  <span className="font-display text-2xl text-primary">{team.totalPoints} p</span>
                </div>
                <StatsBar stats={{
                  playerName: team.name,
                  correct: team.correct,
                  wrong: team.wrong,
                  unanswered: team.unanswered,
                }} />
                <p className="text-text-secondary text-sm mt-2">
                  {team.correct} riktige • {team.accuracy} % treffprosent
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rangering av spillere */}
      <div className="max-w-4xl mx-auto space-y-3 mb-10">
        {rankedPlayers.map((stats, index) => (
          <motion.div
            key={stats.playerId}
            initial={reducedMotion ? false : { x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : index * 0.08 }}
            className={`card p-5 flex flex-col md:flex-row md:items-center gap-4 ${
              index === 0 ? 'border-primary/50' : ''
            }`}
          >
            <div className="flex items-center gap-4 md:w-56 flex-shrink-0">
              {getRankIcon(index)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: stats.playerColor }} />
                  <span className="font-display text-2xl text-text-primary">{stats.playerName}</span>
                </div>
                <span className="text-primary font-display text-3xl">{stats.totalPoints} p</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <StatsBar stats={stats} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-success" /> {stats.correct} riktig
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-error" /> {stats.wrong} feil
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-text-muted" /> {stats.unanswered} ubesvart
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  {stats.avgAnswerTimeMs !== null
                    ? `${(stats.avgAnswerTimeMs / 1000).toFixed(1)} sek i snitt`
                    : 'Ingen svartid'}
                </span>
              </div>
            </div>

            <div className="text-center md:text-right flex-shrink-0">
              <div className="font-display text-3xl text-text-primary">{stats.accuracy}%</div>
              <div className="text-text-muted text-xs uppercase tracking-wide">treffprosent</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Totaler */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-primary">{totalQuestionsAll}</div>
          <div className="text-text-secondary text-sm">spørsmål</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-success">{totalCorrect}</div>
          <div className="text-text-secondary text-sm">riktige svar totalt</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-text-primary">{rankedPlayers.length}</div>
          <div className="text-text-secondary text-sm">spillere</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display text-3xl text-primary">{formatDuration(durationMs)}</div>
          <div className="text-text-secondary text-sm">spilletid</div>
        </div>
      </div>

      {/* Gjennomgang av spørsmål */}
      <div className="max-w-4xl mx-auto mb-10">
        <button
          onClick={() => setShowReview(prev => !prev)}
          className="btn-secondary w-full py-4 flex items-center justify-center gap-3 text-lg"
          aria-expanded={showReview}
        >
          {showReview ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          Gjennomgå spørsmålene ({questions.length})
        </button>

        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 mt-4">
                {questions.map((question, qIndex) => {
                  const correctChoice = question.choices.find(c => question.correctChoiceIds.includes(c.id));
                  return (
                    <div key={question.id} className="card p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="font-display text-primary text-xl flex-shrink-0">
                          {qIndex + 1}.
                        </span>
                        <p className="text-text-primary font-medium text-lg">{question.text}</p>
                      </div>
                      <p className="text-success mb-3 ml-8">
                        Riktig svar: <strong>{correctChoice?.text}</strong>
                      </p>
                      {question.explanation && (
                        <p className="text-text-secondary ml-8 mb-3 italic">{question.explanation}</p>
                      )}
                      <div className="flex flex-wrap gap-2 ml-8">
                        {rankedPlayers.map(player => {
                          const record = answerFor(question.id, player.playerId);
                          const choiceText = record?.choiceId
                            ? question.choices.find(c => c.id === record.choiceId)?.text
                            : null;
                          return (
                            <div
                              key={player.playerId}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
                                !record || record.choiceId === null
                                  ? 'border-border/50 text-text-muted bg-bg-elevated'
                                  : record.isCorrect
                                    ? 'border-success/50 text-success bg-success/10'
                                    : 'border-error/50 text-error bg-error/10'
                              }`}
                              title={
                                !record || record.choiceId === null
                                  ? `${player.playerName}: ubesvart`
                                  : `${player.playerName}: valgte «${choiceText}»`
                              }
                            >
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: player.playerColor }} />
                              <span className="font-semibold">{player.playerName}</span>
                              {!record || record.choiceId === null ? (
                                <span>ubesvart</span>
                              ) : record.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <>
                                  <span className="italic">«{choiceText}»</span>
                                  <XCircle className="w-4 h-4" />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Handlinger */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
        <button onClick={onPlayAgain} className="btn-primary flex-1 py-4 text-xl flex items-center justify-center gap-2">
          <RotateCcw className="w-6 h-6" />
          Spill igjen
        </button>
        {onBackToLobby && (
          <button onClick={onBackToLobby} className="btn-secondary flex-1 py-4 text-xl flex items-center justify-center gap-2">
            <ArrowLeft className="w-6 h-6" />
            Tilbake til lobby
          </button>
        )}
        <button onClick={onMainMenu} className="btn-secondary flex-1 py-4 text-xl flex items-center justify-center gap-2">
          <Home className="w-6 h-6" />
          Hovedmeny
        </button>
      </div>
    </div>
  );
}
