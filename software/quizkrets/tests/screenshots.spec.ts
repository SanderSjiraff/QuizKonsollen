import { test, expect } from '@playwright/test';

/**
 * Skjermbilder av hovedskjermene – til dokumentasjon og visuell regresjon.
 * baseURL kommer fra playwright.config.ts (ingen hardkodede URL-er).
 */

test.describe.configure({ mode: 'serial' });

test.describe('QuizKrets - Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('01 - Hovedmeny', async ({ page }) => {
    await expect(page.getByText('QuizKrets')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/01-main-menu.png', fullPage: true });
  });

  test('02 - Quizbygger', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/ }).click();
    await expect(page.getByText('1. Temaer')).toBeVisible();

    // Gjør noen valg for et mer representativt bilde
    await page.getByRole('button', { name: /Historie/ }).first().click();
    await page.getByRole('button', { name: /Vitenskap/ }).first().click();

    await page.screenshot({ path: 'tests/screenshots/02-quiz-builder.png', fullPage: true });
  });

  test('03 - Oppsett av spill', async ({ page }) => {
    await page.getByRole('button', { name: /Start spill/ }).click();
    await expect(page.getByRole('heading', { name: 'Tilfeldig quiz' })).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/03-game-setup.png', fullPage: true });
  });

  test('04 - Spørsmålsbank', async ({ page }) => {
    await page.getByRole('button', { name: /Spørsmålsbank/ }).click();
    await expect(page.getByText(/spørsmål totalt/)).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/04-question-bank.png', fullPage: true });
  });

  test('05 - Spill (spørsmål vist)', async ({ page }) => {
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    await expect(page.getByText('Spørsmål 1 av 5')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/05-gameplay.png' });
  });

  test('06 - Spill (fasit avslørt)', async ({ page }) => {
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    await page.locator('[data-testid="choice-0"]').click();
    await expect(page.locator('[data-testid="next-question"]')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/06-gameplay-revealed.png' });
  });

  test('07 - Resultater med statistikk', async ({ page }) => {
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }

    await expect(page.getByText(/vinner!/)).toBeVisible();
    await page.getByRole('button', { name: /Gjennomgå spørsmålene/ }).click();
    await page.screenshot({ path: 'tests/screenshots/07-results.png', fullPage: true });
  });

  test('08 - TV-oppløsning 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    await expect(page.getByText('Spørsmål 1 av 5')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/08-tv-1080p.png' });
  });

  test('09 - 1280x720 (liten TV/projektor)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    await expect(page.getByText('Spørsmål 1 av 5')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/09-tv-720p.png' });
  });

  test('10 - Mobil 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText('QuizKrets')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/10-mobile.png', fullPage: true });
  });
});
