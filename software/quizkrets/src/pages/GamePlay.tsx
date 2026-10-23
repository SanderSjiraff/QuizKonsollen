import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, ArrowRight, X } from 'lucide-react';
import type { Question, Player } from '../types';
import { useTimer } from '../hooks/useTimer';

interface GamePlayProps {
  question: Question | undefined;
  currentQuestionIndex: number;
  totalQuestions: number;
  players: Player[];
  scores: Record<number, number>;
  gameMode: string;
  onAnswer: (playerId: number, choiceId: string, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  onQuit: () => void;
}

export default function GamePlay({
  question,
  currentQuestionIndex,
  totalQuestions,
  players,
  scores,
  gameMode: _gameMode,
  onAnswer,
  onNextQuestion,
  onQuit,
}: GamePlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [activePlayerId] = useState(1);

  const { timeRemaining, start, reset } = useTimer(20, () => {
    if (!showResult) {
      handleTimeUp();
    }
  });

  useEffect(() => {
    if (question) {
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      reset(20);
      setTimeout(() => start(), 500);
    }
  }, [question, reset, start]);

  const handleTimeUp = useCallback(() => {
    setShowResult(true);
    setIsCorrect(false);
    onAnswer(activePlayerId, '', false);
  }, [activePlayerId, onAnswer]);

  const handleAnswer = (choiceId: string) => {
    if (showResult) return;

    const correct = question?.correctChoiceIds.includes(choiceId) || false;
    setSelectedAnswer(choiceId);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(activePlayerId, choiceId, correct);
  };

  const handleNext = () => {
    onNextQuestion();
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-text-secondary">Ingen spørsmål tilgjengelig</p>
      </div>
    );
  }

  const getTimerColor = () => {
    if (timeRemaining > 10) return 'text-success';
    if (timeRemaining > 5) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-12">
      {/* Top-bar: Progresjon og poeng */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onQuit} className="btn-secondary p-3">
          <X className="w-6 h-6" />
        </button>

        {/* Progresjonsbar */}
        <div className="flex-1 mx-8">
          <div className="flex justify-between text-text-secondary mb-2">
            <span>Spørsmål {currentQuestionIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Poengoversikt */}
        <div className="flex gap-4">
          {players.slice(0, 4).map(player => (
            <div key={player.id} className="text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1"
                style={{ backgroundColor: player.color }}
              >
                {player.id}
              </div>
              <span className="text-lg font-display text-primary">
                {scores[player.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hovedinnhold */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        {/* Timer */}
        <AnimatePresence>
          {!showResult && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="mb-8"
            >
              <div className={`relative w-24 h-24 rounded-full border-4 border-bg-elevated flex items-center justify-center ${getTimerColor()}`}>
                <Clock className="w-8 h-8 absolute -top-2 -right-2 bg-bg-primary rounded-full p-1" />
                <span className="font-display text-4xl">{timeRemaining}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spørsmål */}
        <motion.div
          key={question.id}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-bg-elevated text-text-secondary text-sm mb-4">
            {question.categories.join(' • ')} • {question.difficulty}
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-text-primary leading-tight">
            {question.text}
          </h2>
        </motion.div>

        {/* Svaralternativer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {question.choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice.id;
            const isCorrectAnswer = question.correctChoiceIds.includes(choice.id);
            const showCorrect = showResult && isCorrectAnswer;
            const showWrong = showResult && isSelected && !isCorrectAnswer;

            return (
              <motion.button
                key={choice.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(choice.id)}
                disabled={showResult}
                className={`p-6 md:p-8 rounded-2xl border-4 text-left transition-all duration-300 ${
                  showCorrect
                    ? 'border-success bg-success/20 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                    : showWrong
                    ? 'border-error bg-error/20 shadow-[0_0_30px_rgba(220,38,38,0.3)]'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-bg-secondary hover:border-primary/50 hover:bg-bg-elevated'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-display ${
                    showCorrect
                      ? 'bg-success text-bg-primary'
                      : showWrong
                      ? 'bg-error text-bg-primary'
                      : 'bg-bg-elevated text-text-secondary'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`text-xl md:text-2xl font-semibold ${
                    showCorrect
                      ? 'text-success'
                      : showWrong
                      ? 'text-error'
                      : 'text-text-primary'
                  }`}>
                    {choice.text}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Resultat-feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mt-8 p-6 rounded-2xl text-center ${
                isCorrect ? 'bg-success/20 border-2 border-success' : 'bg-error/20 border-2 border-error'
              }`}
            >
              <h3 className={`text-3xl font-display mb-2 ${isCorrect ? 'text-success' : 'text-error'}`}>
                {isCorrect ? 'Riktig!' : 'Feil!'}
              </h3>
              {question.explanation && (
                <p className="text-text-secondary text-lg">{question.explanation}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neste-knapp */}
        <AnimatePresence>
          {showResult && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleNext}
              className="btn-primary text-xl px-12 py-4 mt-8 flex items-center gap-3"
            >
              {currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  Neste spørsmål <ArrowRight className="w-6 h-6" />
                </>
              ) : (
                <>
                  Se resultater <Trophy className="w-6 h-6" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
