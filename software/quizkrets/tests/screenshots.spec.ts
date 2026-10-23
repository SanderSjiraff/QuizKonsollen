import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('QuizKrets - Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('01 - Main Menu', async ({ page }) => {
    await expect(page.getByText('QuizKrets')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/01-main-menu.png', fullPage: true });
  });

  test('02 - Quiz Builder', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForSelector('text=Bygg din quiz', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: 'tests/screenshots/02-quiz-builder.png', fullPage: true });
  });

  test('03 - Quiz Builder with selections', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForSelector('text=Bygg din quiz', { state: 'visible', timeout: 10000 });
    
    // Select categories
    await page.getByRole('button', { name: /Historie/i }).first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Sport/i }).first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Teknologi/i }).first().click();
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'tests/screenshots/03-quiz-builder-selected.png', fullPage: true });
  });

  test('04 - Lobby', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForSelector('text=Bygg din quiz', { state: 'visible', timeout: 10000 });
    
    // Select category
    await page.getByRole('button', { name: /Historie/i }).first().click();
    await page.waitForTimeout(200);
    
    // Navigate to lobby
    await page.getByRole('button', { name: /Bekreft og fortsett/i }).click();
    await page.waitForSelector('text=Spillerlobby', { state: 'visible', timeout: 10000 });
    
    await page.screenshot({ path: 'tests/screenshots/04-lobby.png', fullPage: true });
  });

  test('05 - Lobby all ready', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForSelector('text=Bygg din quiz', { state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: /Historie/i }).first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Bekreft og fortsett/i }).click();
    await page.waitForSelector('text=Spillerlobby', { state: 'visible', timeout: 10000 });
    
    // Click all ready buttons
    for (let i = 0; i < 4; i++) {
      const buttons = await page.getByRole('button', { name: /Marker som klar/i }).all();
      if (buttons.length > 0) {
        await buttons[buttons.length - 1].click();
        await page.waitForTimeout(300);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/05-lobby-ready.png', fullPage: true });
  });

  test('06 - Game Play', async ({ page }) => {
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForSelector('text=Bygg din quiz', { state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: /Historie/i }).first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Bekreft og fortsett/i }).click();
    await page.waitForSelector('text=Spillerlobby', { state: 'visible', timeout: 10000 });
    
    // Click all ready buttons
    for (let i = 0; i < 4; i++) {
      const buttons = await page.getByRole('button', { name: /Marker som klar/i }).all();
      if (buttons.length > 0) {
        await buttons[buttons.length - 1].click();
        await page.waitForTimeout(300);
      }
    }
    
    // Start game
    await page.getByRole('button', { name: /Start spillet/i }).click();
    await page.waitForSelector('text=Spørsmål 1', { state: 'visible', timeout: 10000 });
    
    await page.screenshot({ path: 'tests/screenshots/06-game-play.png', fullPage: true });
  });

  test('07 - Question Bank', async ({ page }) => {
    await page.getByRole('button', { name: /Spørsmålsbank/i }).click();
    await page.waitForSelector('text=Spørsmålsbank', { state: 'visible', timeout: 10000 });
    
    await page.screenshot({ path: 'tests/screenshots/07-question-bank.png', fullPage: true });
  });

  test('08 - Keyboard navigation', async ({ page }) => {
    // Test that tab navigation works
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('role') || document.activeElement?.tagName);
    console.log('Focused element:', focused);
    await page.screenshot({ path: 'tests/screenshots/08-keyboard-nav.png', fullPage: true });
  });

  test('09 - Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'tests/screenshots/09-mobile-menu.png', fullPage: true });
    
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/10-mobile-builder.png', fullPage: true });
  });

  test('10 - TV viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/11-tv-menu.png', fullPage: false });
    
    await page.getByRole('button', { name: /Bygg quiz/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/12-tv-builder.png', fullPage: false });
  });
});
