/**
 * Generisk input-grensesnitt for spillhendelser.
 *
 * Alle inputkilder (tastatur i dag, elektroniske kontrollere via USB/Pico 2 senere)
 * sender de samme hendelsestypene. Spillmotoren lytter kun på GameInputEvent og
 * bryr seg ikke om hvor hendelsen kommer fra.
 *
 * Implementerer observer-mønsteret: en InputDriver emitter, spillmotoren abonnerer.
 */

export type GameInputEvent =
  | { type: 'PLAYER_BUZZ'; playerId: number; timestamp: number }
  | { type: 'PLAYER_ANSWER'; playerId: number; choiceIndex: number; timestamp: number }
  | { type: 'PLAYER_READY'; playerId: number; timestamp: number }
  | { type: 'NEXT_QUESTION'; timestamp: number }
  | { type: 'PAUSE_GAME'; timestamp: number };

export type GameInputHandler = (event: GameInputEvent) => void;

/** Grensesnitt som alle inputkilder implementerer (tastatur, kontroller, testmotor). */
export interface InputDriver {
  /** Unik ID for kilden, f.eks. 'keyboard' eller 'serial:pico2-1'. */
  readonly id: string;
  /** Start levering av hendelser. Returnerer en stopp-funksjon. */
  start(handler: GameInputHandler): () => void;
  /** Frigi ressurser (f.eks. seriekobling). */
  stop(): void;
}

/** Enkel hendelsessentral som samler flere drivere. */
export class InputHub {
  private drivers: InputDriver[] = [];
  private stops: Array<() => void> = [];
  private handler: GameInputHandler | null = null;

  register(driver: InputDriver): void {
    this.drivers.push(driver);
    if (this.handler) {
      this.stops.push(driver.start(this.handler));
    }
  }

  start(handler: GameInputHandler): void {
    this.handler = handler;
    for (const driver of this.drivers) {
      this.stops.push(driver.start(handler));
    }
  }

  stop(): void {
    for (const stop of this.stops) stop();
    this.stops = [];
    this.handler = null;
  }
}

/** Kontekst tastaturdriveren trenger for å tolke tastetrykk riktig. */
export interface KeyboardContext {
  /** Spilleren som for øyeblikket skal svare (hot-seat/buzzer). */
  activePlayerId: number;
  /** True hvis taster 1-8 betyr buzze; da velges svar med A-D. */
  buzzMode: boolean;
  /** Antall gyldige svaralternativer (begrenser A-D). */
  choiceCount: number;
  /** Antall spillere som kan buzze (begrenser 1-8). */
  playerCount: number;
}

const CHOICE_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Tastaturdriver: oversetter tastetrykk til GameInputEvent.
 *
 * Mapping (position-basert, P0-fiks):
 * - Svar sendes som synlig posisjon (choiceIndex), ikke choiceId.
 *   GamePlay slår opp faktisk choiceId i gjeldende spørsmål – stokket
 *   svarrekkefølge fra eksterne kilder påvirker dermed aldri valget.
 * - Buzz-modus: 1-8 buzzer fra spiller 1-8, A-D gir svar for aktiv spiller.
 * - Vanlig modus: 1-8 velger svaralternativ 1-8 for aktiv spiller.
 * - Mellomrom/Enter → neste spørsmål, P → pause, R → klar.
 */
export class KeyboardDriver implements InputDriver {
  readonly id = 'keyboard';
  private active = false;
  private stopFn: (() => void) | null = null;

  constructor(private readonly getContext: () => KeyboardContext) {}

  start(handler: GameInputHandler): () => void {
    if (this.stopFn) return this.stopFn;
    this.active = true;

    const onKey = (e: KeyboardEvent) => {
      if (!this.active) return;
      // Ikke fang opp taster mens brukeren skriver i inputfelter
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const ctx = this.getContext();
      const now = performance.now();
      const key = e.key.toLowerCase();
      let event: GameInputEvent | null = null;

      if (key === ' ' || key === 'enter') {
        event = { type: 'NEXT_QUESTION', timestamp: now };
      } else if (key === 'p') {
        event = { type: 'PAUSE_GAME', timestamp: now };
      } else if (key === 'r') {
        event = { type: 'PLAYER_READY', playerId: ctx.activePlayerId, timestamp: now };
      } else if (/^[1-8]$/.test(key)) {
        const n = Number(key);
        if (ctx.buzzMode) {
          if (n <= ctx.playerCount) {
            event = { type: 'PLAYER_BUZZ', playerId: n, timestamp: now };
          }
        } else if (n <= ctx.choiceCount) {
          event = {
            type: 'PLAYER_ANSWER',
            playerId: ctx.activePlayerId,
            choiceIndex: n - 1,
            timestamp: now,
          };
        }
      } else {
        const choiceIndex = CHOICE_KEYS.indexOf(key);
        if (choiceIndex >= 0 && choiceIndex < ctx.choiceCount) {
          event = {
            type: 'PLAYER_ANSWER',
            playerId: ctx.activePlayerId,
            choiceIndex,
            timestamp: now,
          };
        }
      }

      if (event) {
        e.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', onKey);
    this.stopFn = () => {
      this.active = false;
      window.removeEventListener('keydown', onKey);
      this.stopFn = null;
    };
    return this.stopFn;
  }

  stop(): void {
    if (this.stopFn) this.stopFn();
  }
}
