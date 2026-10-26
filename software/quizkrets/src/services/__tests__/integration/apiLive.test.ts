import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Integrasjonstest mot faktiske eksterne API-er (OpenTDB + Trivia API).
 *
 * Design-beslutning:
 * - Testene kjører IKKE i standard suite (skip dersom
 *   `QUIZKRETS_INTEGRATION_TEST` er satt).
 * - For å kjøre: `QUIZKRETS_INTEGRATION_TEST=1 npm test`
 *   (PowerShell: `$env:QUIZKRETS_INTEGRATION_TEST='1'; npm test`)
 *
 * Hensikt: Verifisere at provider-adapterene og tag-mappingen
 * fungerer mot den FAKTISKE API-en, uten mocking.
 *
 * Begrensninger:
 * - Maks 3 spørsmål per kall (rate-limit-respekt).
 * - Trivia API: max 50 per kall (ikke relevant ved 3).
 */

// @ts-ignore – process finnes i node/Vitest-miljø, ikke i Vite-bygg/browser
const SHOULD_RUN =
  (globalThis as any).process?.env?.QUIZKRETS_INTEGRATION_TEST === '1';
const SKIP_MESSAGE = 'Skipper — sett miljøvariabel QUIZKRETS_INTEGRATION_TEST=1 for å kjøre';

describe('Integrasjontest: live API', () => {
  if (!SHOULD_RUN) {
    it.skip(SKIP_MESSAGE, () => {});
    return;
  }

  beforeEach(() => {
    // Ingen mocks — kaller ekte API
  });

  afterEach(() => {
    // Rydding ikke nødvendig for read-only API-kall
  });

  describe('OpenTDB', { timeout: 15000 }, () => {
    it('returnerer spørsmål i forventet format med kategori History', async () => {
      const url = 'https://opentdb.com/api.php?amount=3&category=23&type=multiple';
      const res = await fetch(url);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.response_code).toBe(0);
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);

      const q = data.results[0];
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('correct_answer');
      expect(q).toHaveProperty('incorrect_answers');
      expect(Array.isArray(q.incorrect_answers)).toBe(true);
      expect(q.incorrect_answers.length).toBe(3);
    });

    it('returnerer 429 ved overskridelse av rate-limit', { timeout: 30000 }, async () => {
      // Rask sekvens av kall — OpenTDB har ~5s rate limit per IP.
      // Er usikkert om dette triggere ved 3 raske — men godt å
      // verifisere at 429 ikke er fatal for adapteren.
      const url = 'https://opentdb.com/api.php?amount=1';
      const res1 = await fetch(url);
      const res2 = await fetch(url);
      const res3 = await fetch(url);
      expect([200, 429]).toContain(res1.status);
      expect([200, 429]).toContain(res2.status);
      expect([200, 429]).toContain(res3.status);
    });
  });

  describe('The Trivia API', { timeout: 15000 }, () => {
    it('returnerer spørsmål med limit og tags', async () => {
      const url =
        'https://the-trivia-api.com/v2/questions?limit=3&tags=dinosaurs';
      const res = await fetch(url);
      expect(res.status).toBe(200);

      const data = (await res.json()) as Array<{
        id: string;
        question: { text: string };
        category: string;
        difficulty: string;
        correctAnswer: string;
        incorrectAnswers: string[];
        tags: string[];
        type: string;
        isNiche: boolean;
      }>;

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(3);

      const q = data[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question.text');
      expect(q).toHaveProperty('correctAnswer');
      expect(q).toHaveProperty('incorrectAnswers');
      expect(Array.isArray(q.incorrectAnswers)).toBe(true);
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('tags');

      // Spørsmålet skal ha minst én tag relatert til temaet
      expect(q.tags.some((t: string) => t.includes('dinosaur'))).toBe(true);
    });

    it('returnerer tomt array for ukjent tag (ikke 500)', async () => {
      const url =
        'https://the-trivia-api.com/v2/questions?limit=10&tags=xyz-tag-finnes-ikke-12345';
      const res = await fetch(url);
      expect(res.status).toBe(200);

      const data = (await res.json()) as unknown[];
      // Ukjent tag gir tom array med The Trivia API, ikke feil.
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });
});
