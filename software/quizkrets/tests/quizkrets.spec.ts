import { test, expect } from '@playwright/test';

/**
 * Hovedflyter i QuizKrets.
 *
 * - Ingen hardkodede URL-er: baseURL kommer fra playwright.config.ts
 *   (TEST_BASE_URL / TEST_PORT).
 * - Ingen antagelser om 4 spillere: standardoppsettet er 1 spiller.
 * - App-tilstand (localStorage) er fersk per test siden hver test får ny
 *   browserkontekst.
 */

test.describe('Hovedmeny', () => {
  test('viser alle navigasjonsvalg', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('QuizKrets')).toBeVisible();

    // Regex: hovedknappene inneholder også beskrivelsestekst i tilgjengelig navn
    for (const label of [/Start spill/, /Bygg quiz/, /Spørsmålsbank/]) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
    for (const label of [/Lagrede quizer/, /Poengtavle/, /Hent fra nettet/, /Spørsmålsideer/]) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
  });
});

test.describe('Quizbygger', () => {
  test('valg av temaer viser tilgjengelighet og oppsummering', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();

    await expect(page.getByText('1. Temaer')).toBeVisible();

    // Velg to hovedkategorier
    await page.getByRole('button', { name: /Historie/ }).first().click();
    await page.getByRole('button', { name: /Sport/ }).first().click();

    // Tilgjengelighetsboks viser antall
    await expect(page.getByText(/ubrukte spørsmål passer valgene dine/)).toBeVisible();

    // Oppsummeringen oppdateres
    await expect(page.getByText('Historie').first()).toBeVisible();
    await expect(page.getByText(/Spillere/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Start quiz/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Lagre quiz/ })).toBeVisible();
  });

  test('starter quiz med valgte kriterier', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();

    await page.getByRole('button', { name: /Historie/ }).first().click();
    // 8 historie-spørsmål tilgjengelig – reduser antallet til 5 før start
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: /Start quiz/ }).click();

    await expect(page.getByText('Spillerlobby')).toBeVisible();
  });

  test('underkategorier kan velges', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();

    // Utvid Historie og velg underkategori
    await page
      .locator('button', { hasText: 'Underkategorier' })
      .first()
      .click();
    await page.getByRole('button', { name: /Norsk historie/ }).click();

    // Oppsummering viser 'Norsk historie'
    await expect(page.getByText('Norsk historie').first()).toBeVisible();
  });
});

test.describe('Full spillflyt (klassisk, 1 spiller)', () => {
  test('start tilfeldig quiz, svar på alle spørsmål og se resultater med statistikk', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();

    // GameSetup: reduser til 5 spørsmål
    await expect(page.getByRole('heading', { name: 'Tilfeldig quiz' })).toBeVisible();
    await page.getByLabel('Antall spørsmål').fill('5');

    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();

    // Lobby med 1 spiller
    await expect(page.getByText('Spillerlobby')).toBeVisible();
    await expect(page.getByText('1 spillere')).toBeVisible();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    // Svar på alle 5 spørsmålene
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Spørsmål ${i + 1} av 5`)).toBeVisible();
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }

    // Resultater med full statistikk
    await expect(page.getByText(/vinner!/)).toBeVisible();
    await expect(page.getByText('treffprosent')).toBeVisible();
    await expect(page.getByText(/riktige svar totalt/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Gjennomgå spørsmålene/ })).toBeVisible();
  });

  test('gjennomgang av spørsmål viser alle spørsmålene med fasit', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }

    await page.getByRole('button', { name: /Gjennomgå spørsmålene/ }).click();
    await expect(page.getByText('Riktig svar:')).toHaveCount(5);
  });

  test('spill igjen returnerer til lobby med samme quiz', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }

    await page.getByRole('button', { name: /Spill igjen/ }).click();
    await expect(page.getByText('Spillerlobby')).toBeVisible();
  });

  test('ferdigspilt quiz lagres i historikken med faktiske data', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }
    await page.getByRole('button', { name: /Hovedmeny/ }).click();

    await page.getByRole('button', { name: /Poengtavle/ }).first().click();
    // Historikken inneholder faktiske data: quiznavn og spilleresultat
    await expect(page.getByText(/Tilfeldig quiz/).first()).toBeVisible();
    await expect(page.getByText('Spiller 1').first()).toBeVisible();
  });
});

test.describe('Tastaturnavigasjon under spill', () => {
  test('svar med taster 1-4 og neste spørsmål med mellomrom', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Spørsmål ${i + 1} av 5`)).toBeVisible();
      // Tasteinput: 1 = svaralternativ A
      await page.keyboard.press('1');
      await page.waitForSelector('[data-testid="next-question"]', { state: 'visible' });
      // Mellomrom = neste spørsmål
      await page.keyboard.press(' ');
    }

    await expect(page.getByText(/vinner!/)).toBeVisible();
  });

  test('tast 1 velger første synlige alternativ selv med stokket svarrekkefølge', async ({ page }) => {
    // Regresjonstest (P0): Adaptere (OpenTDB) stokker svaralternativene, slik at
    // choice-ID ikke følger visningsrekkefølge. Tast 1 må derfor velge første
    // SYNGLIGE alternativ (choiceIndex 0), ikke choiceId 'a'.
    //
    // Seed banken med kun ett spørsmål der første synlige alternativ har id 'c'
    // (feil) og fasiten 'a' ligger synlig sist. Med riktig position-mapping
    // blir valg 1 registrert som feil (rød) og siste alternativ grønt.
    const stokketSporsmal = {
      id: 'e2e-stokket-1',
      text: 'Regresjon: hvilket tall er fire?',
      type: 'multiple_choice',
      difficulty: 'lett',
      categories: ['geografi'],
      choices: [
        { id: 'c', text: 'Feil – første synlige' },
        { id: 'd', text: 'Feil – andre synlige' },
        { id: 'b', text: 'Feil – tredje synlige' },
        { id: 'a', text: 'Fire (riktig, synlig sist)' },
      ],
      correctChoiceIds: ['a'],
      source: 'manual',
      sourceRef: 'E2E-regresjonstest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await page.addInitScript(q => {
      localStorage.setItem('quizkrets_question_bank_v1', JSON.stringify([q]));
      localStorage.setItem('quizkrets_question_bank_migrated_v1', 'done');
    }, stokketSporsmal);

    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();
    await page.getByRole('button', { name: /Geografi/ }).first().click();
    await page.getByRole('button', { name: /Start quiz/ }).click();

    // Banken har bare 1 spørsmål – den strenge dialogen tilbyr reduksjon.
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Reduser antallet til 1 spørsmål/ }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    await expect(page.getByText('Regresjon: hvilket tall er fire?')).toBeVisible();
    // Vent på at spørsmålets entré-animasjon er ferdig. Input-lytteren
    // registreres i en effect rett etter commit, og uten dette vinduet kan
    // tasteinndata gå tapt mellom render og lytterregistrering.
    await page.waitForFunction(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const q = h2s.find(el => el.textContent?.includes('Regresjon'));
      return !!q && getComputedStyle(q).opacity === '1';
    });
    await page.keyboard.press('1');
    await page.waitForSelector('[data-testid="next-question"]', { state: 'visible' });

    // Første synlige alternativ (id 'c') er valgt OG feil → rød ramme.
    // Med gammel bug ville tast 1 registrert id 'a' (riktig) og første
    // synlige alternativ ville vært umerket.
    await expect(page.locator('[data-testid="choice-0"]')).toHaveClass(/border-error/);
    // Fasiten (id 'a', synlig sist) vises grønn.
    await expect(page.locator('[data-testid="choice-3"]')).toHaveClass(/border-success/);
  });
});

test.describe('Kategorivekting i lagrede quizer (P1 #5)', () => {
  test('vekter lagres med quizen og gjenopprettes ved lasting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();

    // Bygg quiz: 100 % historie, 0 % sport
    await page.getByRole('button', { name: /Historie/ }).first().click();
    await page.getByRole('button', { name: /Sport/ }).first().click();
    await page.getByLabel('Vekt for Historie').fill('100');
    await page.getByLabel('Quiznavn').fill('Vektet lagresjekk');
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: /Lagre quiz/ }).click();

    // Tilbake til hovedmenyen og last den lagrede quizen
    await page.getByRole('button', { name: 'Tilbake' }).click();
    await page.getByRole('button', { name: /Lagrede quizer/ }).first().click();
    const card = page.locator('div.card', { hasText: 'Vektet lagresjekk' });
    await card.getByRole('button', { name: 'Spill' }).click();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    // Vektene skal være gjenopprettet: ALLE 5 spørsmål kommer fra
    // historie-poolen. Frøbankens sport-spørsmål har kun sport-kategorier,
    // så de kan aldri vises med 100 % historie-vekt. Uten gjenopprettede
    // vekter ville jevn fordeling over historie+sport trukket sport-
    // spørsmål med ~98 % sannsynlighet.
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Spørsmål ${i + 1} av 5`)).toBeVisible();
      await expect(page.getByText(/• sport/)).toHaveCount(0);
      await page.locator('[data-testid="choice-0"]').click();
      await page.locator('[data-testid="next-question"]').click();
    }

    await expect(page.getByText(/vinner!/)).toBeVisible();
  });
});

test.describe('Buzzer-modus', () => {
  test('spiller buzzer med tast, svarer, og de andre får ubesvart', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start spill/ }).click();

    // Velg buzzer-modus og 2 spillere ('Buzzer' eksakt – unngår 'Buzzer-duell'-kortet)
    await page.getByRole('button', { name: 'Buzzer', exact: true }).click();
    await page.getByLabel('Flere spillere').click();
    await page.getByLabel('Antall spørsmål').fill('5');
    await page.getByRole('button', { name: 'Start tilfeldig quiz' }).click();

    await expect(page.getByText('Spillerlobby')).toBeVisible();
    await expect(page.getByText('2 spillere')).toBeVisible();
    await page.getByRole('button', { name: 'Start spillet!' }).click();

    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Spørsmål ${i + 1} av 5`)).toBeVisible();
      // Buzz-fase: spiller 2 buzzer med tasten 2
      await expect(page.getByText(/Buzz når du kan!/)).toBeVisible();
      await page.keyboard.press('2');
      await expect(page.getByText(/svarer/)).toBeVisible();
      // Svar med tasteinput A
      await page.keyboard.press('a');
      await page.locator('[data-testid="next-question"]').click();
    }

    // Resultater: begge spillerne har statistikk (ubesvart teller for den som ikke svarte)
    await expect(page.getByText(/vinner!/)).toBeVisible();
    await expect(page.getByText(/ubesvart/).first()).toBeVisible();
  });
});

test.describe('Streng spørsmålsuttrekk (ingen fallback)', () => {
  // 'Generell kunnskap' har 4 lette/middle spørsmål i frøbanken –
  // standardantallet er 10, så valgene kan ikke oppfylles.
  const velgGenerellKunnskap = async (page: import('@playwright/test').Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Bygg quiz/ }).click();
    await page.getByRole('button', { name: /Generell kunnskap/ }).click();
    await page.getByRole('button', { name: /Start quiz/ }).click();
  };

  test('viser dialog med valg når valgene ikke kan oppfylles', async ({ page }) => {
    await velgGenerellKunnskap(page);

    // Dialogen viser tydelig beskjed og konkrete valg – aldri stille fallback
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Ikke nok spørsmål')).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /Reduser antallet til 4 spørsmål/ })
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Hent flere spørsmål fra nettet/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Avbryt/ })).toBeVisible();

    // Avbryt: brukeren endrer selv valgene
    await dialog.getByRole('button', { name: /Avbryt/ }).click();
    await expect(dialog).toHaveCount(0);
    // ...og blir værende i quizbyggeren
    await expect(page.getByText('4. Oppsummering')).toBeVisible();
  });

  test('reduser antallet starter quizen med det som finnes', async ({ page }) => {
    await velgGenerellKunnskap(page);

    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('button', { name: /Reduser antallet til 4 spørsmål/ }).click();

    // Quiz med 4 spørsmål starter
    await expect(page.getByText('Spillerlobby')).toBeVisible();
    await page.getByRole('button', { name: 'Start spillet!' }).click();
    await expect(page.getByText('Spørsmål 1 av 4')).toBeVisible();
  });
});

test.describe('Spørsmålsbank (CRUD)', () => {
  const questionText = 'Hva er testspørsmålets hovedstad?';

  test('oprett, rediger og slett spørsmål', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Spørsmålsbank/ }).click();

    // Opprett
    await page.getByRole('button', { name: /Nytt spørsmål/ }).click();
    await page.getByPlaceholder('Skriv spørsmålet her…').fill(questionText);
    await page.getByPlaceholder('Alternativ 1').fill('Testby');
    await page.getByPlaceholder('Alternativ 2').fill('Annanby');
    await page.getByPlaceholder('Alternativ 3').fill('Tredjeby');
    await page.getByPlaceholder('Alternativ 4').fill('Fjerdeby');
    await page
      .locator('[role="dialog"] button', { hasText: /Sport/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Legg til spørsmål' }).click();

    await expect(page.getByText('Spørsmålet ble lagt til!')).toBeVisible();
    // Vent til dialogen er helt lukket (avslutningsanimasjon) før vi leter i listen
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Søk frem det nye spørsmålet
    await page.getByLabel('Søk').fill('testspørsmålet');
    await expect(page.getByText(questionText)).toBeVisible();

    // Rediger
    await page
      .getByRole('button', { name: new RegExp(`Rediger spørsmålet: ${questionText.slice(0, 20)}`, 'i') })
      .click();
    await page.getByPlaceholder('Skriv spørsmålet her…').fill('Hva er den redigerte hovedstaden?');
    await page.getByRole('button', { name: 'Lagre endringer' }).click();
    await expect(page.getByText('Endringene er lagret!')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Finn det redigerte spørsmålet via søk
    await page.getByLabel('Søk').fill('redigerte');
    await expect(page.getByText('Hva er den redigerte hovedstaden?')).toBeVisible();

    // Slett med bekreftelse
    await page
      .getByRole('button', { name: /Slett spørsmålet: Hva er den redigerte/ })
      .click();
    await page.getByRole('button', { name: 'Slett', exact: true }).click();
    await expect(page.getByText('Spørsmålet er slettet.')).toBeVisible();
  });

  test('duplikatkontroll avviser samme tekst', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Spørsmålsbank/ }).click();

    // q1 i frøbanken har allerede denne teksten
    await page.getByRole('button', { name: /Nytt spørsmål/ }).click();
    await page.getByPlaceholder('Skriv spørsmålet her…').fill('Hva er hovedstaden i Australia?');
    await page.getByPlaceholder('Alternativ 1').fill('Sydney');
    await page.getByPlaceholder('Alternativ 2').fill('Canberra');
    await page
      .locator('[role="dialog"] button', { hasText: /Geografi/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Legg til spørsmål' }).click();

    // Duplikatet avvises med forklaring
    await expect(page.getByText(/finnes allerede/)).toBeVisible();
  });
});
