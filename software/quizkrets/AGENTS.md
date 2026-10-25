# QuizKrets – Agent-dokumentasjon

## Siste endringer

### v1.3 – AutoFetchService + customTheme

1. **AutoFetchService integrert i QuizBuilder**
   - Nytt "Skriv inn et eget tema"-tekstfelt nederst i kategoriseksjonen
   - Debounced matching mot `matchTheme()` fra `themeMatcher`
   - Viser resultat: antall lokale matcher, om det er hentbart fra API
   - Når lokale spørsmål mangler: automatisk henting via `AutoQuestionFetcher`
   - Fremdrifts-UI med fremdriftsbar og feilmeldinger
   - "Avbryt"-knapp som kaller `.cancel()`

2. **GameConfig utvidet med `customTheme`**
   - `customTheme?: string` lagres i GameConfig
   - Bevares ved quiz-start via `configUpdates`

3. **QuizPreset utvidet med `customTheme`**
   - `customTheme` bevares ved lagring og lasting av quizer
   - `presetToConfigUpdates` overfører `customTheme` fra preset til config

4. **Playwright E2E-tester for AutoFetch**
   - `tests/autofetch.spec.ts`: 5 nye E2E-tester
   - Automatisk innhenting når lokale spørsmål mangler (mock API via `page.route()`)
   - Egendefinert tema som finnes i tags vs. ikke gjenkjent
   - Offline: bruk lokale spørsmål
   - Lagring/gjenoppretting av customTheme
   - Avbryt-knapp stopper auto-fetch

5. **GitHub Actions CI/CD**
   - `.github/workflows/test.yml` – kjører build + unit-test + Playwright E2E på push/PR

### Kvalitetssikring (v1.1 → v1.2): P1-spillflyt/datakvalitet og P2-UI

Alle endringer nedenfor er verifisert med TDD (RED→GRØNN) og full test-suite.

#### Spillflyt (P1)

6. **Fersk sesjon fra lobby (P1 #6)**
   - `backToLobby` opprettet tidligere IKKE ny GameSession: gamle svar
     blokkerte nye registreringer (duplikatbeskyttelse) og spørsmålsindeksen
     sto på siste spørsmål. Nå: ny sesjon + nullstilt indeks + bumpet
     answerVersion ved hver tilbake-til-lobby.

7. **Lagstruktur fra alle startpunkter (P1 #7)**
   - `buildTeams` flyttet til `core/teams.ts` (delt hjelper)
   - `startGame` sikrer alltid konsistent `teams`: ved lag-modus bygges
     lagene fra gjeldende spillere (respekterer `teamId` fra byggeren),
     ved andre moduser er `teams` tom

8. **Gjenbruk bare når det hjelper (P1 #8)**
   - SelectionErrorDialog viser «Tillat gjenbruk» KUN når gjenbruk faktisk
     kan dekke ønsket antall (`availableWithReuse >= requested`) – ellers
     var knappen en felle som ledet tilbake til samme dialog.

9. **Radvis CSV-validering + filimport tilgjengelig (P1 #9)**
   - ImportQuestions-siden var en død skjerm; ny «Importer fil»-knapp i
     GameSetup navigerer dit
   - `parseCsv`/`csvToDrafts` flyttet til `core/csvImport.ts`
   - `csvToDrafts` returnerer `{ drafts, invalid }`: rader med ugyldig
     fasit-bokstav rapporteres radvis i «avvist»-listen (samme UX som
     JSON-import) i stedet for å forkaste hele filen

10. **Pause vs. hastighetsbonus + buzz-lås (P1 #10)**
    - `timeTakenMs` ekskluderer nå pausetid (`pausedAtRef`-kompensasjon i
      `questionStartRef`) – nedtellingen står stille i pause, og det skal
      hastighetsbonusen også gjøre
    - `handleBuzz` setter `phaseRef.current` SYNKRONT (samme race-mønster
      som P0 #1): første buzz vinner også når to hendelser ankommer i
      samme hendelsesbølge (relevant for fremtidige USB-kontrollere)

#### UI/UX (P2)

11. **Kategori-etikett viser matchende kategori**
    - Ny `pickDisplayCategory` i `core/categories.ts`: etiketten i GamePlay
      viser kategorien som matchet brukerens valg (via `expandSelection`),
      ikke spørsmålets første tilfeldige kategori. Visningsnavn via
      `getCategoryName`.

12. **Tilgjengelighet på ikon-knapper**
    - `aria-label="Tilbake"` på SavedQuizzes, Lobby, QuestionSources og
      Scoreboard (de fem andre sidene hadde det allerede)
    - `aria-label="Bytt farge for <navn>"` på fargeknappen i Lobby

13. **Feildialog fra «Lagrede quizer» (kodegjennomgang)**
    - En lagret quiz banken ikke kan oppfylle feilet stille (ingenting skjedde).
      SelectionErrorDialog er nå koblet inn i SavedQuizzes med
      reduser/gjenbruk/hent-flere – samme mønster som GameSetup/QuizBuilder.
    - `activePlayerIdRef` oppdateres synkront i submitAnswer/handleBuzz
      (samme race-mønster som P1 #10), og togglePause har sideeffekter utenfor
      state-updateren (StrictMode-sikker)

#### Kjente forbedringspunkter (ikke blokkerende)

- Import-suksessbekreftelsen vises aldri: `onImportComplete` navigerer
  umiddelbart tilbake, så «N spørsmål importert»-meldingen rekker aldri
  rendres synlig. Vurder bekreftelse på målsiden eller forsinket navigering.
- Stille trunkering ved 5 000-spørsmålsgrensen i `questionStore`: import som
  skyver banken over grensen mister de eldste spørsmålene uten varsel.

## Tidligere: P0-rettelser (v1.0 → v1.1)

1. **Tastaturinput race condition**
   - `GamePlay.tsx`: Ref-basert input-lytter som ikke re-registreres ved render
   - `useTimer.ts`: Stabil `useMemo`-wrapper for API, unngår uendelige re-renders
   - Synkron `phaseRef`-oppdatering i `timer` og `reveal()`
   - Debounce på `NEXT_QUESTION` for å unngå dobbeltrigging

2. **Ubesvart-statistikk**
   - `computePlayerStats`: `unanswered = totalQuestions - answered`
   - Timeout-registreringer (choiceId = null) telles korrekt som ubesvart

3. **Lagstatistikk**
   - `computeTeamResults`: accuracy = correct / (totalQuestions × players.length)
   - `statsBarFractions`: lag-nevner = spillere × spørsmål

4. **CSV-import fasit**
   - `csvToDrafts`: mapper fasitbokstav via `letters.indexOf()`
   - Avviser ugyldige bokstaver eksplisitt (radvis, se P1 #9)

5. **Datatap i questionStore**
   - `StorageError`-klasse med kvotehåndtering; `writeBank` bevarer alltid
     eksisterende data ved feil; eksplisitt feilrapportering til kaller

## Kjøring av tester

```bash
# Enhetstester (Vitest)
npm run test                    # 166 tester, alle grønne

# E2E-tester (Playwright)
npx playwright test tests/quizkrets.spec.ts   # 25 tester, alle grønne
npx playwright test tests/autofetch.spec.ts   # 5 tester, alle grønne

# Produksjonsbygg
npm run build                   # Vite, OK
```

Merk (Windows/PowerShell): Playwright starter/gjenbruker dev-server på
TEST_PORT (f.eks. `$env:TEST_PORT='3005'`); Vite serverer fersk kode ved
gjenbruk.

## Arkitektur

### Viktige filer

| Fil | Ansvar |
|-----|--------|
| `src/services/autoQuestionFetcher.ts` | Automatisk henting av spørsmål fra API |
| `src/core/themeMatcher.ts` | Matching av brukerdefinerte temaer mot kategorier/tags |
| `src/pages/QuizBuilder.tsx` | Quiz-konfigurasjon med customTheme + AutoFetch UI |
| `src/hooks/useGameEngine.ts` | Spilltilstand og logikk, GameConfig med customTheme |
| `src/data/savedQuizzes.ts` | Lagring/lasting av quizer med customTheme |
| `src/core/gameSession.ts` | Svarregistrering, poeng, spilletid |
| `src/core/scoring.ts` | Statistikk, poengberegning, `statsBarFractions` |
| `src/core/questionSelector.ts` | Spørsmålsuttrekk, vekting, gjenbruk |
| `src/core/categories.ts` | Kategorioppsett, matching, `pickDisplayCategory` |
| `src/core/teams.ts` | Lagbygging (delt: builder + motor) |
| `src/core/csvImport.ts` | CSV-parsing med radvis validering |
| `src/core/questionValidation.ts` | Felles spørsmålsvalidering (alle kilder) |
| `src/core/inputEvents.ts` | Generisk input-hub (tastatur i dag, kontrollere senere) |
| `src/hooks/useGameEngine.ts` | Spilltilstand og logikk |
| `src/hooks/useTimer.ts` | Nedtelling med pause |
| `src/pages/GamePlay.tsx` | Spillskjerm med input-håndtering |
| `src/pages/QuizBuilder.tsx` | Quiz-konfigurasjon |
| `src/pages/ImportQuestions.tsx` | Filimport (JSON/CSV) |
| `src/data/questionStore.ts` | localStorage persistens |

### Byggesteiner

- React 18 + TypeScript
- Vite (dev + build)
- Tailwind CSS
- Framer Motion (animasjoner)
- Lucide React (ikoner)
- Vitest + Playwright (testing)
