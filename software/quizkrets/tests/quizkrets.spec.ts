import { test, expect } from '@playwright/test';

test.describe('QuizKrets - UI Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Main Menu renders correctly', async ({ page }) => {
    // Check title
    await expect(page.getByText('QuizKrets')).toBeVisible();
    
    // Check navigation cards
    await expect(page.getByText('Start spill')).toBeVisible();
    await expect(page.getByText('Bygg quiz')).toBeVisible();
    await expect(page.getByText('Spørsmålsbank')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/01-main-menu.png', fullPage: true });
  });

  test('Navigate to Quiz Builder', async ({ page }) => {
    // Click "Bygg quiz"
    await page.getByText('Bygg quiz').click();
    
    // Check we're on quiz builder page
    await expect(page.getByText('Bygg din quiz')).toBeVisible();
    
    // Check sections
    await expect(page.getByText('Velg temaer')).toBeVisible();
    await expect(page.getByText('Vanskelighetsgrader')).toBeVisible();
    await expect(page.getByText('Antall spørsmål')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/02-quiz-builder.png', fullPage: true });
  });

  test('Select categories in Quiz Builder', async ({ page }) => {
    await page.getByText('Bygg quiz').click();
    
    // Select some categories
    await page.getByText('Historie').click();
    await page.getByText('Sport').click();
    await page.getByText('Teknologi').click();
    
    // Verify selection
    await expect(page.getByText('Bekreft og fortsett')).toBeEnabled();
    
    await page.screenshot({ path: 'tests/screenshots/03-quiz-builder-categories.png', fullPage: true });
  });

  test('Navigate to Lobby', async ({ page }) => {
    await page.getByText('Bygg quiz').click();
    
    // Select categories
    await page.getByText('Historie').click();
    await page.getByText('Sport').click();
    
    // Click start
    await page.getByText('Bekreft og fortsett').click();
    
    // Wait for lobby to load
    await page.waitForSelector('text=Spillerlobby', { timeout: 10000 });
    
    // Check lobby elements are present
    await expect(page.getByText('Spillerlobby')).toBeVisible();
    
    // Check player cards - look for input fields with player names
    const playerInputs = await page.locator('input[value*="Spiller"]').all();
    expect(playerInputs.length).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'tests/screenshots/04-lobby.png', fullPage: true });
  });

  test('Players can mark ready in Lobby', async ({ page }) => {
    await page.getByText('Bygg quiz').click();
    await page.getByText('Historie').click();
    await page.getByText('Bekreft og fortsett').click();
    
    await page.waitForSelector('text=Spillerlobby', { timeout: 10000 });
    
    // Mark all players as ready
    const readyButtons = await page.locator('button:has-text("Marker som klar")').all();
    expect(readyButtons.length).toBe(4); // Should have 4 players
    
    for (let i = 0; i < readyButtons.length; i++) {
      await readyButtons[i].click();
      // Small delay between clicks to allow animations
      await page.waitForTimeout(300);
    }
    
    // Check that start button is enabled
    await expect(page.getByText('Start spillet!')).toBeEnabled();
    
    await page.screenshot({ path: 'tests/screenshots/05-lobby-ready.png', fullPage: true });
  });

  test('Game Play screen', async ({ page }) => {
    // Navigate to game
    await page.getByText('Bygg quiz').click();
    await page.getByText('Historie').click();
    await page.getByText('Bekreft og fortsett').click();
    
    await page.waitForSelector('text=Spillerlobby', { timeout: 10000 });
    
    // Mark all ready and start
    const readyButtons = await page.locator('button:has-text("Marker som klar")').all();
    for (let i = 0; i < readyButtons.length; i++) {
      await readyButtons[i].click();
      await page.waitForTimeout(300);
    }
    
    await page.getByText('Start spillet!').click();
    
    // Wait for game screen
    await page.waitForSelector('text=Spørsmål 1 /', { timeout: 10000 });
    
    // Check game screen
    await expect(page.getByText('Spørsmål 1 /')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/06-game-play.png', fullPage: true });
  });

  test('Question Bank page', async ({ page }) => {
    await page.getByText('Spørsmålsbank').click();
    
    await expect(page.getByText('Spørsmålsbank')).toBeVisible();
    await expect(page.getByPlaceholder('Søk etter spørsmål...')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/07-question-bank.png', fullPage: true });
  });

  test('Keyboard navigation works', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be on "Bygg quiz" button
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toContain('Bygg quiz');
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.screenshot({ path: 'tests/screenshots/08-mobile-menu.png', fullPage: true });
    
    // Navigate to quiz builder
    await page.getByText('Bygg quiz').click();
    await page.screenshot({ path: 'tests/screenshots/09-mobile-builder.png', fullPage: true });
  });

  test('TV viewport simulation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.screenshot({ path: 'tests/screenshots/10-tv-menu.png', fullPage: false });
    
    await page.getByText('Bygg quiz').click();
    await page.screenshot({ path: 'tests/screenshots/11-tv-builder.png', fullPage: false });
  });
});
