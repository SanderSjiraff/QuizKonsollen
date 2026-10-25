# QuizKrets – Agent-dokumentasjon

## Siste endringer

### Kvalitetssikring (v1.0 → v1.1)

#### Faste feil (P0)

1. **Tastaturinput race condition**
   - `GamePlay.tsx`: Ref-basert input-lytter som ikke re-registreres ved render
   - `useTimer.ts`: Stabil `useMemo`-wrapper for API, unngår uendelige re-renders
   - Synkron `phaseRef`-oppdatering i `timer` og `reveal()`
   - Debounce på `NEXT_QUESTION` for å unngå dobbeltrigging

2. **Ubesvart-statistikk**
   - `computePlayerStats`: `unanswered = totalQuestions - answered` (ikke `playerAnswers.length`)
   - Timeout-registreringer (choiceId = null) telles nå korrekt som ubesvart

3. **Lagstatistikk**
   - `computeTeamResults`: accuracy = correct / (totalQuestions × players.length)
   - Unngår treffprosent over 100% ved flere spillere per lag

4. **CSV-import fasit**
   - `csvToDrafts`: Mapper fasitbokstav via `letters.indexOf()` i stedet for tekstsøk
   - Avviser ugyldige bokstaver eksplisitt

5. **Datatap i questionStore**
   - `StorageError`-klasse med kvotehåndtering
   - Aggressiv pruning ved lagringsfeil
   - Eksplisitt feilrapportering til kaller

#### Forbedringer (P1)

6. **Spilletid**
   - `GameSession`: Separat `start()` metode (kalles ved `startGameplay`)
   - `pause()` / `resume()` for korrekt spilletid-ekskludering
   - `getDurationMs()` returnerer faktisk spilltid uten lobby og pause

7. **Kategorivekting**
   - `selectDistributed()` integrert i `useGameEngine`
   - `categoryWeights` lagt til i `GameConfig`
   - UI-slidere i `QuizBuilder` per valgt kategori

## Kjøring av tester

```bash
# Enhetstester (Vitest)
npm run test                    # 80 tester, alle grønne

# E2E-tester (Playwright)
npx playwright test tests/quizkrets.spec.ts   # 14 tester, alle grønne

# Produksjonsbygg
npm run build                   # Vite, OK
```

## Arkitektur

### Viktige filer

| Fil | Ansvar |
|-----|--------|
| `src/core/gameSession.ts` | Svarregistrering, poeng, spilletid |
| `src/core/scoring.ts` | Statistikk og poengberegning |
| `src/core/questionSelector.ts` | Spørsmålsuttrekk og vekting |
| `src/hooks/useGameEngine.ts` | Spilltilstand og logikk |
| `src/hooks/useTimer.ts` | Nedtelling med pause |
| `src/pages/GamePlay.tsx` | Spillskjerm med input-håndtering |
| `src/pages/QuizBuilder.tsx` | Quiz-konfigurasjon |
| `src/data/questionStore.ts` | localStorage persistens |

### Byggesteiner

- React 18 + TypeScript
- Vite (dev + build)
- Tailwind CSS
- Framer Motion (animasjoner)
- Lucide React (ikoner)
- Vitest + Playwright (testing)
