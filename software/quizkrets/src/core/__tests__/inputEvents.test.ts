/**
 * Enhetstester for tastaturdriverens mapping til GameInputEvent.
 *
 * Mønster fra questionStore.test.ts: minimal DOM-mock i node-miljø
 * (ingen jsdom-avhengighet).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyboardDriver, InputHub, type GameInputEvent, type KeyboardContext } from '../inputEvents';

/** Minimal KeyboardEvent-mock med det driveren faktisk bruker. */
class FakeKeyboardEvent {
  key: string;
  target: { tagName?: string; isContentEditable?: boolean } | null;
  defaultPrevented = false;
  constructor(key: string, target: { tagName?: string; isContentEditable?: boolean } | null = null) {
    this.key = key;
    this.target = target;
  }
  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

/** Minimal window-mock: registrering og utsendelse av keydown-lyttere. */
class FakeWindow {
  private listeners = new Set<(e: FakeKeyboardEvent) => void>();
  addEventListener(_type: string, fn: (e: FakeKeyboardEvent) => void): void {
    this.listeners.add(fn);
  }
  removeEventListener(_type: string, fn: (e: FakeKeyboardEvent) => void): void {
    this.listeners.delete(fn);
  }
  dispatchKeydown(e: FakeKeyboardEvent): void {
    for (const fn of this.listeners) fn(e);
  }
}

const fakeWindow = new FakeWindow();
(globalThis as Record<string, unknown>).window = fakeWindow;

/** Send et tastetrykk til den registrerte lytteren. */
function pressKey(key: string, target?: { tagName?: string; isContentEditable?: boolean }): FakeKeyboardEvent {
  const e = new FakeKeyboardEvent(key, target ?? null);
  fakeWindow.dispatchKeydown(e);
  return e;
}

/** Oppsett: fyll KeyboardContext-verdier som driveren skal bruke. */
function makeDriver(ctx: Partial<KeyboardContext> = {}) {
  const fullCtx: KeyboardContext = {
    activePlayerId: 1,
    buzzMode: false,
    choiceCount: 4,
    playerCount: 2,
    ...ctx,
  };
  return new KeyboardDriver(() => fullCtx);
}

describe('KeyboardDriver – position-basert svarvalg', () => {
  let events: GameInputEvent[];
  let hub: InputHub;

  beforeEach(() => {
    events = [];
    const driver = makeDriver();
    hub = new InputHub();
    hub.register(driver);
    hub.start(e => events.push(e));
  });

  afterEach(() => {
    hub.stop();
  });

  it('tast 1 gir PLAYER_ANSWER med choiceIndex 0 (første synlige alternativ)', () => {
    pressKey('1');
    const answer = events.find(e => e.type === 'PLAYER_ANSWER');
    expect(answer).toBeDefined();
    if (answer?.type === 'PLAYER_ANSWER') {
      expect(answer.choiceIndex).toBe(0);
    }
  });

  it('tast 2 og 3 gir choiceIndex 1 og 2', () => {
    pressKey('2');
    pressKey('3');
    const answers = events.filter(e => e.type === 'PLAYER_ANSWER');
    expect(answers).toHaveLength(2);
    if (answers[0]?.type === 'PLAYER_ANSWER') expect(answers[0].choiceIndex).toBe(1);
    if (answers[1]?.type === 'PLAYER_ANSWER') expect(answers[1].choiceIndex).toBe(2);
  });

  it('tast utenfor choiceCount ignoreres', () => {
    pressKey('5'); // choiceCount er 4
    const answer = events.find(e => e.type === 'PLAYER_ANSWER');
    expect(answer).toBeUndefined();
  });

  it('bokstav-tast a/b gir choiceIndex 0/1 i vanlig modus', () => {
    pressKey('a');
    pressKey('b');
    const answers = events.filter(e => e.type === 'PLAYER_ANSWER');
    expect(answers).toHaveLength(2);
    if (answers[0]?.type === 'PLAYER_ANSWER') expect(answers[0].choiceIndex).toBe(0);
    if (answers[1]?.type === 'PLAYER_ANSWER') expect(answers[1].choiceIndex).toBe(1);
  });

  it('handled tast preventDefault – uhandlet tast påvirkes ikke', () => {
    const handled = pressKey('1');
    expect(handled.defaultPrevented).toBe(true);
    const ignored = pressKey('9'); // hverken svar (max 4) eller spiller
    expect(ignored.defaultPrevented).toBe(false);
  });

  it('buzz-modus: tall er buzzer, bokstaver er svar', () => {
    hub.stop();
    events = [];
    const driver = makeDriver({ buzzMode: true, playerCount: 2, choiceCount: 4 });
    hub = new InputHub();
    hub.register(driver);
    hub.start(e => events.push(e));

    pressKey('2');
    pressKey('a');

    const buzz = events.find(e => e.type === 'PLAYER_BUZZ');
    const answer = events.find(e => e.type === 'PLAYER_ANSWER');
    expect(buzz).toBeDefined();
    if (buzz?.type === 'PLAYER_BUZZ') expect(buzz.playerId).toBe(2);
    expect(answer).toBeDefined();
    if (answer?.type === 'PLAYER_ANSWER') expect(answer.choiceIndex).toBe(0);
  });

  it('mellomrom gir NEXT_QUESTION', () => {
    pressKey(' ');
    expect(events.some(e => e.type === 'NEXT_QUESTION')).toBe(true);
  });

  it('p gir PAUSE_GAME og r gir PLAYER_READY for aktiv spiller', () => {
    pressKey('p');
    pressKey('r');
    expect(events.some(e => e.type === 'PAUSE_GAME')).toBe(true);
    const ready = events.find(e => e.type === 'PLAYER_READY');
    expect(ready).toBeDefined();
    if (ready?.type === 'PLAYER_READY') expect(ready.playerId).toBe(1);
  });

  it('ignorerer taster når fokus er i inputfelt', () => {
    pressKey('1', { tagName: 'INPUT' });
    pressKey('2', { tagName: 'TEXTAREA' });
    expect(events).toHaveLength(0);
  });
});
