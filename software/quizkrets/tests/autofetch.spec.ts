import { test, expect } from '@playwright/test';

/**
 * E2E-tester for AutoFetchService + customTheme i QuizBuilder.
 *
 * - Mock API-kall via page.route() (ingen eksterne nettverksavhengigheter)
 * - Fersk localStorage per test (ny browserkontekst per test)
 */

/** Mock svar fra OpenTDB – kategori 'History' migreres til 'historie'. */
function mockOpenTdbHistory(amount = 5) {
  return {
    response_code: 0,
    results: Array.from({ length: amount }, (_, i) => ({
      category: 'History',
      type: 'multiple',
      difficulty: 'easy',
      question: `Mock historie-spørsmål ${i + 1} fra OpenTDB?`,
      correct_answer: 'Riktig',
      incorrect_answers: ['Feil 1', 'Feil 2', 'Feil 3'],
    })),
  };
}

/** Mock svar fra The Trivia API – category 'history' migreres til 'historie'. */
function mockTriviaApiHistory(amount = 5) {
  return Array.from({ length: amount }, (_, i) => ({
    id: `mock-trivia-${i + 1}`,
    question: { text: `Mock historie-spørsmål ${i + 1} fra Trivia API?` },
    category: 'history',
    correctAnswer: 'Riktig',
    incorrectAnswers: ['Feil 1', 'Feil 2', 'Feil 3'],
    difficulty: 'easy',
    tags: ['history'],
    type: 'text_choice',
    regions: [],
    isNiche: false,
  }));
}

/** Hjelper: naviger til QuizBuilder. */
async function navigateToBuilder(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
  const btn = page.getByRole('button', { name: /Bygg quiz/ });
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.click();
  await expect(page.getByText('1. Temaer')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}

test.describe('AutoFetch + customTheme', () => {
  test('egendefinert tema som gjenkjennes – viser matching og auto-fetch-knapp', async ({ page }) => {
    // Tom bank – ingen lokale spørsmål
    await page.addInitScript(() => {
      localStorage.setItem('quizkrets_question_bank_migrated_v1', 'done');
      localStorage.setItem('quizkrets_question_bank_v1', JSON.stringify([]));
      localStorage.setItem('quizkrets_used_question_ids', JSON.stringify([]));
    });

    // Mock API-er
    await page.route('https://opentdb.com/api.php?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOpenTdbHistory(5)),
      });
    });

    await page.route('https://the-trivia-api.com/v2/questions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTriviaApiHistory(5)),
      });
    });

    await navigateToBuilder(page);

    // Skriv inn et kjent tema
    await page.getByLabel('Eget tema').fill('historie');

    // Venter på at temaet matche
    await expect(page.getByText(/Gjenkjent:/)).toBeVisible();

    // Siden det er 0 historie-spørsmål lokalt og vi ber om 10:
    // auto-fetch knappen skal vises
    const fetchBtn = page.getByRole('button', { name: /Hent flere spørsmål automatisk/ });
    await expect(fetchBtn).toBeVisible();

    // Klikk auto-fetch
    await fetchBtn.click();

    // Vent til fremdrifts-UI viser at henting er ferdig (ikje lenger "Henter")
    await expect(page.getByText(/Henter spørsmål…/)).toBeVisible();
    // Vent på at status endres fra "Henter" til noe annet
    await expect(page.getByText(/Henter spørsmål…/)).toHaveCount(0, { timeout: 15000 });

    // Etter henting: spørsmålene er lagret (testet i unit-tester)
    // Quizbuilder skal nå vise at spørsmål er klare
  });

  test('egendefinert tema som IKKE gjenkjennes – viser tydelig melding', async ({ page }) => {
    await navigateToBuilder(page);

    await page.getByLabel('Eget tema').fill('xyz-tema-finnes-ikke');

    // Venter på at meldingen vises
    await expect(page.getByText(/Fant ingen tilgjengelige spørsmål/)).toBeVisible();

    // Auto-fetch-knappen skal IKKE vises når temaet ikke er gjenkjent
    await expect(
      page.getByRole('button', { name: /Hent flere spørsmål automatisk/ })
    ).toHaveCount(0);
  });

  test('offline – viser status uten auto-fetch-knapp når lokale spørsmål dekker', async ({ page }) => {
    // Frøbank med 5 geografi-spørsmål
    const bank = Array.from({ length: 5 }, (_, i) => ({
      id: `offline-geo-${i + 1}`,
      text: `Offline geografi-spørsmål ${i + 1}?`,
      type: 'multiple_choice',
      difficulty: 'lett',
      categories: ['geografi'],
      choices: [
        { id: 'a', text: 'Svar A' },
        { id: 'b', text: 'Svar B' },
      ],
      correctChoiceIds: ['a'],
      source: 'seed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await page.addInitScript((b) => {
      localStorage.setItem('quizkrets_question_bank_migrated_v1', 'done');
      localStorage.setItem('quizkrets_question_bank_v1', JSON.stringify(b));
    });

    // Simuler offline ved å blokker kun API-kallene – IKKE Vite-serveren
    await page.route('https://opentdb.com/api.php?*', (route) => route.abort('internetdisconnected'));
    await page.route('https://the-trivia-api.com/v2/questions?*', (route) => route.abort('internetdisconnected'));

    await navigateToBuilder(page);

    // Skriv tema som matcher geografi
    const themeInput = page.getByLabel('Eget tema');
    await themeInput.fill('geografi');
    await expect(page.getByText(/Gjenkjent:/)).toBeVisible();

    // Reduser spørsmålsantallet til 5 så lokale spørsmål dekker
    const countSlider = page.locator('input[type="range"][aria-label="Antall spørsmål"]');
    await countSlider.fill('5');

    // Nok lokalt spørsmål: ingen auto-fetch knapp
    await expect(
      page.getByRole('button', { name: /Hent flere spørsmål automatisk/ })
    ).toHaveCount(0);
  });

  test('lagring og gjenoppretting av customTheme i lagrede quizer', async ({ page }) => {
    await navigateToBuilder(page);

    // Velg et tema
    await page.getByLabel('Eget tema').fill('fotball');
    await expect(page.getByText(/Gjenkjent:/)).toBeVisible();

    // Gi quizen et navn og lagre
    await page.getByLabel('Quiznavn').fill('Fotball-tema');
    await page.getByRole('button', { name: /Lagre quiz/ }).click();

    // Tilbake til hovedmeny
    await page.getByRole('button', { name: 'Tilbake' }).click();

    // Gå til lagrede quizer
    await page.getByRole('button', { name: /Lagrede quizer/ }).first().click();

    // Finn og spill den lagrede quizen
    const card = page.locator('.card', { hasText: 'Fotball-tema' });
    await card.getByRole('button', { name: 'Spill' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    // Spillet skal starte – quizen ble lastet med fotball-temaet
    await expect(page.getByText(/Spørsmål 1 av/)).toBeVisible();
  });

  test('avbryt-knapp stopper auto-fetch', async ({ page }) => {
    // Tom bank – ingen lokale spørsmål
    await page.addInitScript(() => {
      localStorage.setItem('quizkrets_question_bank_migrated_v1', 'done');
      localStorage.setItem('quizkrets_question_bank_v1', JSON.stringify([]));
    });

    // Mock API med kunstig forsinkelse
    await page.route('https://opentdb.com/api.php?*', async (route) => {
      await new Promise((r) => setTimeout(r, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOpenTdbHistory(5)),
      });
    });

    await navigateToBuilder(page);

    await page.getByLabel('Eget tema').fill('historie');

    const fetchBtn = page.getByRole('button', { name: /Hent flere spørsmål automatisk/ });
    await expect(fetchBtn).toBeVisible();
    await fetchBtn.click();

    // Fremdrifts-UI vises
    await expect(page.getByText(/Henter spørsmål/)).toBeVisible();

    // Klikk avbryt
    await page.getByRole('button', { name: /Avbryt/ }).click();

    // Etter avbryt: auto-fetch knappen skal være tilbake
    await expect(fetchBtn).toBeVisible();
  });
});
