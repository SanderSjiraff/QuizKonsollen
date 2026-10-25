import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Clock, X, Pause, Play, Zap, CheckCircle2, XCircle, Eye } from 'lucide-react';
import type { Question, Player } from '../types';
import type { AnswerRecord } from '../core/scoring';
import { useTimer } from '../hooks/useTimer';
import { InputHub, KeyboardDriver } from '../core/inputEvents';
import { pickDisplayCategory, getCategoryName } from '../core/categories';

interface GamePlayProps {
  question: Question | undefined;
  currentQuestionIndex: number;
  totalQuestions: number;
  players: Player[];
  scores: Record<number, number>;
  gameMode: string;
  /** Sekunder per spørsmål fra quizkonfigurasjonen. */
  timePerQuestion: number;
  onAnswer: (playerId: number, choiceId: string, timeTakenMs: number) => boolean;
  onTimeout: () => void;
  onNextQuestion: () => void;
  onQuit: () => void;
  onPause?: () => void;
  onResume?: () => void;
  /** Svar registrert så langt for gjeldende spørsmål. */
  questionAnswers: AnswerRecord[];
  /** Kategorier brukeren valgte for quizen – styrer kategori-etiketten (P2 #11). */
  selectedCategories?: string[];
}

/** Fase i svarflyten for ett spørsmål. */
type Phase = 'answering' | 'buzzing' | 'revealed';

export default function GamePlay({
  question,
  currentQuestionIndex,
  totalQuestions,
  players,
  scores,
  gameMode,
  timePerQuestion,
  onAnswer,
  onTimeout,
  onNextQuestion,
  onQuit,
  onPause,
  onResume,
  questionAnswers,
  selectedCategories = [],
}: GamePlayProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('answering');
  /** Spilleren som for øyeblikket skal svare (hot-seat/buzzer). */
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  /** Kort per-spiller-feedback i hot-seat ("Spiller 2: riktig!"). */
  const [lastFeedback, setLastFeedback] = useState<{ playerId: number; correct: boolean } | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const questionStartRef = useRef<number>(Date.now());
  const phaseRef = useRef<Phase>('answering');
  phaseRef.current = phase;

  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  const activePlayerIdRef = useRef(activePlayerId);
  useEffect(() => { activePlayerIdRef.current = activePlayerId; }, [activePlayerId]);

  const isBuzzer = gameMode === 'buzzer' && players.length > 1;

  const timer = useTimer(() => {
    // Enkel timeout per spørsmål: alt som ikke er besvart registreres som ubesvart.
    if (phaseRef.current !== 'revealed') {
      phaseRef.current = 'revealed';
      setPhase('revealed');
      onTimeout();
    }
  });

  // Når et nytt spørsmål vises: nullstill fase og start tidturen fra konfigurasjonen.
  useEffect(() => {
    if (!question) return;
    questionStartRef.current = Date.now();
    pausedAtRef.current = null;
    setLastFeedback(null);
    setIsPaused(false);
    if (isBuzzer) {
      phaseRef.current = 'buzzing';
      setPhase('buzzing');
      setActivePlayerId(null);
    } else {
      phaseRef.current = 'answering';
      setPhase('answering');
      const first = players[0];
      setActivePlayerId(first ? first.id : null);
    }
    timer.start(timePerQuestion);
    return () => timer.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, timePerQuestion]);

  const answeredIds = useMemo(
    () => new Set(questionAnswers.map(a => a.playerId)),
    [questionAnswers]
  );

  /** Ref som alltid peker på gjeldende spørsmål (slik at tastaturlisten ikke
   * trenger å re-registreres når spørsmålet bytter). */
  const questionRef = useRef(question);
  useEffect(() => { questionRef.current = question; }, [question]);

  /** P1 #10: tidspunktet eventuell pågående pause startet (null = ikke pauset). */
  const pausedAtRef = useRef<number | null>(null);

  /** Fullfør spørsmålet og vis fasit. */
  const reveal = useCallback(() => {
    timer.stop();
    phaseRef.current = 'revealed';  // synkron oppdatering slik at input-lytter ser riktig fase med én gang
    setPhase('revealed');
  }, [timer]);

  /** Håndter at den aktive spilleren velger et svar.
   *
   * Merk: Vi sjekker IKKE phase her, fordi React-state kan ligge et hendelses-
   * løpet. GameSession (via onAnswer) har egen duplikatbeskyttelse som blokkerer
   * dersom spilleren allerede har svart på det gjeldende spørsmålet. */
  const submitAnswer = useCallback(
    (playerId: number, choiceId: string) => {
      if (isPausedRef.current) return;
      if (answeredIds.has(playerId)) return;
      if (!questionRef.current) return;

      const timeTaken = Date.now() - questionStartRef.current;
      const ok = onAnswer(playerId, choiceId, timeTaken);
      if (!ok) return;

      const correct = questionRef.current.correctChoiceIds.includes(choiceId);
      setLastFeedback({ playerId, correct });

      if (isBuzzer) {
        // Buzzer: bare én spiller svarer – avslør umiddelbart.
        reveal();
      } else {
        // Hot-seat: neste spiller som ikke har svart, ellers avslør.
        const next = players.find(p => !answeredIds.has(p.id) && p.id !== playerId);
        if (next) {
          setActivePlayerId(next.id);
        } else {
          reveal();
        }
      }
    },
    [answeredIds, onAnswer, players, isBuzzer, reveal]
  );

  /** Håndter buzz fra en spiller (buzzer-modus). */
  const handleBuzz = useCallback(
    (playerId: number) => {
      if (phaseRef.current !== 'buzzing' || isPausedRef.current) return;
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      // Synkron lås (P1 #10): første buzz vinner. Uten synkron ref-oppdatering
      // kan to buzz-hendelser i samme hendelsesbølge (f.eks. to spillere som
      // trykker samtidig på en flatsapp) begge passere vakten, og den siste
      // stjeler turvennen fra den første.
      phaseRef.current = 'answering';
      setPhase('answering');
      setActivePlayerId(playerId);
    },
    [players]
  );

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'revealed') return;
    setIsPaused(prev => {
      const next = !prev;
      if (next) {
        pausedAtRef.current = Date.now();
        timer.pause();
        onPause?.();
      } else {
        // P1 #10: ekskluder pausetiden fra svartiden, slik at hastighets-
        // bonusen ikke straffes for tiden spillet sto i pause (nedtellingen
        // står også stille i pausen).
        if (pausedAtRef.current !== null) {
          questionStartRef.current += Date.now() - pausedAtRef.current;
          pausedAtRef.current = null;
        }
        timer.resume();
        onResume?.();
      }
      return next;
    });
  }, [timer, onPause, onResume]);

  // Refs til callback-funksjoner slik at tastaturlisten ALDRIV trenger å
  // re-registreres (unngår race condition ved hurtige tastetrykk).
  const submitAnswerRef = useRef(submitAnswer);
  submitAnswerRef.current = submitAnswer;
  const handleBuzzRef = useRef(handleBuzz);
  handleBuzzRef.current = handleBuzz;
  const togglePauseRef = useRef(togglePause);
  togglePauseRef.current = togglePause;
  const onNextQuestionRef = useRef(onNextQuestion);
  onNextQuestionRef.current = onNextQuestion;

  // Generisk input: tastatur → GameInputEvent.
  // Registreres én gang per spørsmål (avhenger kun av question?.id).
  useEffect(() => {
    if (!question) return;

    const hub = new InputHub();
    const driver = new KeyboardDriver(() => ({
      activePlayerId: activePlayerIdRef.current ?? 1,
      buzzMode: phaseRef.current === 'buzzing',
      choiceCount: questionRef.current?.choices.length ?? 0,
      playerCount: players.length,
    }));
    hub.register(driver);
    // Debounce neste-spørsmål for å unngå dobbeltrigging ved race conditions.
    let nextDebounce = false;
    hub.start(event => {
      if (isPausedRef.current) return;
      if (event.type === 'PLAYER_ANSWER' && activePlayerIdRef.current !== null) {
        // Position-basert input: choiceIndex er synlig posisjon i gjeldende
        // spørsmål. Faktisk choiceId slås opp her, så stokket svarrekkefølge
        // (f.eks. fra OpenTDB) ikke påvirker valget.
        const choice = questionRef.current?.choices[event.choiceIndex];
        if (choice) {
          submitAnswerRef.current(activePlayerIdRef.current, choice.id);
        }
      } else if (event.type === 'PLAYER_BUZZ') {
        handleBuzzRef.current(event.playerId);
      } else if (event.type === 'NEXT_QUESTION') {
        if (phaseRef.current === 'revealed' && !nextDebounce) {
          nextDebounce = true;
          onNextQuestionRef.current();
        }
      } else if (event.type === 'PAUSE_GAME') {
        togglePauseRef.current();
      }
    });
    return () => {
      nextDebounce = false;
      hub.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary text-xl">Ingen spørsmål å vise.</p>
      </div>
    );
  }

  const activePlayer = players.find(p => p.id === activePlayerId);
  const timeRatio = timePerQuestion > 0 ? timer.secondsRemaining / timePerQuestion : 1;
  const timeCritical = timer.secondsRemaining <= 5 && timer.isRunning;

  const choiceState = (choiceId: string) => {
    if (phase !== 'revealed') return 'idle' as const;
    const isCorrect = question.correctChoiceIds.includes(choiceId);
    return isCorrect ? ('correct' as const) : ('wrong' as const);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      {/* Topprad: fremdrift, spillere, tid, pause */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onQuit} className="btn-secondary p-2.5" aria-label="Avslutt spillet">
            <X className="w-6 h-6" />
          </button>
          <div>
            <p className="text-text-secondary text-sm">
              Spørsmål {currentQuestionIndex + 1} av {totalQuestions}
            </p>
            <p className="text-text-muted text-xs capitalize">
              {question.difficulty}
              {(() => {
                // P2 #11: vis kategorien som matchet brukerens valg –
                // ikke nødvendigvis spørsmålets første kategori.
                const cat = pickDisplayCategory(question.categories, selectedCategories);
                return cat ? ` • ${getCategoryName(cat)}` : '';
              })()}
            </p>
          </div>
        </div>

        {/* Poengtavle med spillerstatus */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {players.map(player => {
            const answered = answeredIds.has(player.id);
            const record = questionAnswers.find(a => a.playerId === player.id);
            const isActive = player.id === activePlayerId && phase !== 'revealed';
            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/15 scale-105'
                    : answered
                      ? 'border-border/50 bg-bg-elevated opacity-80'
                      : 'border-border/50 bg-bg-elevated'
                }`}
                style={isActive ? { borderColor: player.color } : undefined}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="font-semibold text-text-primary">{player.name}</span>
                <span className="text-primary font-display">{scores[player.id] ?? 0}</span>
                {phase === 'revealed' && record && (
                  record.choiceId === null ? (
                    <Eye className="w-4 h-4 text-text-muted" aria-label="Ubesvart" />
                  ) : record.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-success" aria-label="Riktig" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error" aria-label="Feil" />
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={togglePause} className="btn-secondary p-2.5" aria-label={isPaused ? 'Fortsett' : 'Pause'}>
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          <div
            className={`flex items-center gap-2 font-display text-4xl tabular-nums ${
              timeCritical ? 'text-error' : 'text-primary'
            }`}
            aria-live="polite"
            aria-label={`Tid igjen: ${timer.secondsRemaining} sekunder`}
          >
            <Clock className={`w-8 h-8 ${timeCritical ? 'animate-pulse' : ''}`} />
            {timer.secondsRemaining}s
          </div>
        </div>
      </div>

      {/* Tidslinje */}
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden mb-8" role="progressbar" aria-valuenow={timer.secondsRemaining} aria-valuemin={0} aria-valuemax={timePerQuestion}>
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            timeCritical ? 'bg-error' : 'bg-primary'
          }`}
          style={{ width: `${Math.max(0, timeRatio * 100)}%` }}
        />
      </div>

      {/* Aktiv spiller-banner */}
      <AnimatePresence mode="wait">
        {(phase === 'buzzing' || (phase === 'answering' && activePlayer)) && (
          <motion.div
            key={phase === 'buzzing' ? 'buzz' : `active-${activePlayer?.id}`}
            initial={reducedMotion ? false : { y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="self-center mb-4 px-6 py-3 rounded-2xl border-2 flex items-center gap-3"
            style={{
              borderColor: phase === 'buzzing' ? 'var(--color-primary)' : activePlayer?.color,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
            }}
          >
            <Zap className="w-6 h-6 text-primary" />
            {phase === 'buzzing' ? (
              <span className="font-display text-2xl text-text-primary">
                Buzz når du kan! Trykk spillernummeret ditt (1–{players.length})
              </span>
            ) : (
              <span className="font-display text-2xl text-text-primary">
                {activePlayer?.name} svarer
                <span className="text-text-secondary text-lg ml-2">
                  (tast 1–{question.choices.length})
                </span>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spørsmål */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.h2
            key={question.id}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -20 }}
            className="tv-heading text-center text-text-primary leading-tight"
          >
            {question.text}
          </motion.h2>
        </AnimatePresence>

        {/* Svaralternativer – store, TV-vennlige */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {question.choices.map((choice, index) => {
            const state = choiceState(choice.id);
            const isSelectedByActive =
              phase === 'revealed' &&
              questionAnswers.some(a => a.choiceId === choice.id);
            return (
              <motion.button
                key={choice.id}
                data-testid={`choice-${index}`}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : index * 0.05 }}
                onClick={() => {
                  if (phase === 'buzzing') return;
                  if (phase === 'answering' && activePlayerId !== null) {
                    submitAnswer(activePlayerId, choice.id);
                  }
                }}
                disabled={phase === 'revealed' || isPaused || phase === 'buzzing'}
                className={`
                  relative p-6 rounded-2xl border-2 text-left font-semibold text-xl
                  transition-all min-h-[88px] flex items-center gap-4
                  ${state === 'correct'
                    ? 'border-success bg-success/15 text-success'
                    : state === 'wrong' && isSelectedByActive
                      ? 'border-error bg-error/15 text-error'
                      : state === 'wrong'
                        ? 'border-border/30 bg-bg-elevated/50 text-text-muted'
                        : 'border-border bg-bg-elevated text-text-primary hover:border-primary hover:bg-primary/10 hover:-translate-y-0.5'
                  }
                  disabled:cursor-default disabled:hover:translate-y-0
                `}
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center font-display text-primary text-lg border border-border">
                  {index + 1}
                </span>
                <span className="flex-1">{choice.text}</span>
                {state === 'correct' && <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Per-spiller feedback i hot-seat */}
        <AnimatePresence>
          {lastFeedback && phase !== 'revealed' && (
            <motion.div
              initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`px-5 py-2.5 rounded-xl font-semibold text-lg ${
                lastFeedback.correct
                  ? 'bg-success/15 text-success border border-success/50'
                  : 'bg-error/15 text-error border border-error/50'
              }`}
              role="status"
            >
              {players.find(p => p.id === lastFeedback.playerId)?.name}:{' '}
              {lastFeedback.correct ? 'riktig! ✔' : 'feil ✘'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fasit og forklaring */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            initial={reducedMotion ? false : { y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 mb-2 max-w-5xl mx-auto w-full"
          >
            {question.explanation && (
              <p className="text-text-secondary text-center mb-4 text-lg">{question.explanation}</p>
            )}
            <button
              onClick={onNextQuestion}
              data-testid="next-question"
              className="btn-primary w-full py-4 text-xl font-display flex items-center justify-center gap-2"
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Neste spørsmål' : 'Se resultater'}
              <span className="text-sm font-normal text-primary/80">(mellomrom)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause-overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg/90 flex flex-col items-center justify-center gap-6 z-50"
          >
            <h3 className="font-display text-5xl text-primary">Pause</h3>
            <p className="text-text-secondary text-xl">Spillet er stanset. Tidturen står stille.</p>
            <button onClick={togglePause} className="btn-primary text-xl py-4 px-10 flex items-center gap-3">
              <Play className="w-6 h-6" />
              Fortsett
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
