# P0-rettelser: Tastaturmapping, lagring, kategorivekting

**Goal:** Rette tre kritiske feil: tast 1 skal velge første synlige alternativ, lagringsfeil skal aldri slette data, og kategorivekting skal fungere.

**Arkitektur:** Input-hendelser endres til å bære synlig posisjon (index) i stedet for choiceId; GamePlay slår opp faktisk choiceId. `writeBank` bevarer alltid eksisterende data ved feil. `selectDistributed` får korrekt vektfilter, kategorispesifikk matching og largest-remainder-fordeling.

**Spec:** Oppfølgingsprompt for QuizKrets QA (P0 #1–#3).

## Global regler

- TDD: skriv feilende test først, verifiser at den feiler, implementer minimal fiks.
- Bevar eksisterende API der mulig; små endringer.
- Ikke slett brukerdata automatisk.

## Task 1: P0 #1 – Position-basert svarvalg (inputEvents + GamePlay)

**Files:**
- Modify: `src/core/inputEvents.ts` (PLAYER_ANSWER bærer `choiceIndex`)
- Modify: `src/pages/GamePlay.tsx` (slår opp choiceId fra `question.choices[choiceIndex]`)
- Test: `src/core/__tests__/inputEvents.test.ts` (ny)

**Interfaces:**
- `PLAYER_ANSWER`-hendelse: `{ type: 'PLAYER_ANSWER'; playerId: number; choiceIndex: number; timestamp: number }`
- GamePlay: `const choice = questionRef.current?.choices[event.choiceIndex]; submitAnswer(playerId, choice.id)`

**Steg:**
- [ ] Skriv feilende test: KeyboardDriver med taste '1' og choiceCount 4 → hendelse `choiceIndex: 0`. Taste 'a' → `choiceIndex: 0`, 'b' → 1.
- [ ] Verifiter at testen feiler (choiceId finnes, choiceIndex mangler).
- [ ] Endre GameInputEvent og KeyboardDriver til å sende choiceIndex.
- [ ] Oppdater GamePlay til å slå opp choiceId fra gjeldende spørsmål (bounds-sjekk).
- [ ] E2E: verifiser tastaturtest med stokkede alternativer passerer.
- [ ] Commit.

## Task 2: P0 #2 – Aldri slett data ved lagringsfeil

**Files:**
- Modify: `src/data/questionStore.ts` (writeBank: bevar data, kast tydelig feil)
- Test: `src/data/__tests__/questionStore.test.ts` (utvid)

**Steg:**
- [ ] Skriv feilende test: kvotefeil (mock localStorage.setItem kaster QuotaExceededError) → gammel bank intakt, StorageError kastes med eksport-hint.
- [ ] Skriv test: migrering markeres IKKE som fullført når writeBank feiler.
- [ ] Fjern pruning fra writeBank; behold gammel lagring urørt; kast StorageError.
- [ ] Verifiter at enhetstester og E2E (spørsmålsbank CRUD) passerer.
- [ ] Commit.

## Task 3: P0 #3 – Robust kategorivekting

**Files:**
- Modify: `src/core/questionSelector.ts` (selectDistributed)
- Test: `src/core/__tests__/questionSelector.test.ts` (utvid)

**Steg:**
- [ ] Skriv feilende test: 20 spørsmål, vekter {historie: 50, sport: 30, teknologi: 20} → 10/6/4.
- [ ] Skriv tester: utilstrekkelig pool (omfordeling), overlappende kategorier, avrundingskant (f.eks. count=10 med 3 kategorier 50/30/20).
- [ ] Rett vektfilter (verdi, ikke nøkkel), kategorispesifikk matching, largest-remainder-fordeling med omfordeling ved utilstrekkelig utvalg.
- [ ] Verifiter alle tester.
- [ ] Commit.
