/**
 * Pålitelig nedtelling.
 *
 * - Tidsbasert på timestamp (ikke intervall-telling) – unngår drift.
 * - Pause og gjenopptakelse uten å miste tid.
 * - onTimeUp kan bare utløses én gang per start-katalog (beskyttelse mot
 *   doble timeout-hendelser ved overgang mellom spørsmål).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(onTimeUp?: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const deadlineRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (deadlineRef.current === null) return;
    const remaining = Math.max(0, deadlineRef.current - Date.now());
    setTimeRemaining(remaining);

    if (remaining <= 0 && !timeoutFiredRef.current) {
      timeoutFiredRef.current = true;
      stopInterval();
      setIsRunning(false);
      deadlineRef.current = null;
      onTimeUpRef.current?.();
    }
  }, [stopInterval]);

  /** Start nedtelling på `seconds`. Nullstiller all tilstand. */
  const start = useCallback(
    (seconds: number) => {
      stopInterval();
      timeoutFiredRef.current = false;
      deadlineRef.current = Date.now() + seconds * 1000;
      setTimeRemaining(seconds * 1000);
      setIsRunning(true);
      intervalRef.current = setInterval(tick, 100);
      tick();
    },
    [stopInterval, tick]
  );

  /** Pause uten å miste gjenstående tid. */
  const pause = useCallback(() => {
    if (deadlineRef.current !== null) {
      pausedRemainingRef.current = Math.max(0, deadlineRef.current - Date.now());
      deadlineRef.current = null;
    }
    stopInterval();
    setIsRunning(false);
  }, [stopInterval]);

  /** Gjenoppta fra pauset tid. Har ingen effekt hvis ikke pauset. */
  const resume = useCallback(() => {
    if (isRunning || deadlineRef.current !== null) return;
    const remaining = pausedRemainingRef.current;
    if (remaining <= 0) return;
    deadlineRef.current = Date.now() + remaining;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
    tick();
  }, [isRunning, tick]);

  /** Stopp og nullstill (brukes ved spørsmålsovergang og avslutning). */
  const stop = useCallback(() => {
    stopInterval();
    timeoutFiredRef.current = true; // hindre senere onTimeUp fra denne runden
    deadlineRef.current = null;
    pausedRemainingRef.current = 0;
    setIsRunning(false);
  }, [stopInterval]);

  useEffect(() => stopInterval, [stopInterval]);

  /** Gjenstående tid i hele sekunder (til visning). */
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return { timeRemainingMs: timeRemaining, secondsRemaining, isRunning, start, pause, resume, stop };
}
