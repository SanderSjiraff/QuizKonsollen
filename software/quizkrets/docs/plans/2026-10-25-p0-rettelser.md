# P0-rettelser: Tastaturmapping, lagring, kategorivekting

**Goal:** Rette tre kritiske feil: tast 1 skal velge første synlige alternativ, lagringsfeil skal aldri slette data, og kategorivekting skal fungere.

**Arkitektur:** Input-hendelser endres til å bære synlig posisjon (index) i stedet for choiceId; GamePlay slår opp faktisk choiceId. `writeBank` bevarer alltid eksisterende data ved feil. `selectDistributed` får korrekt vektfilter, kategorispesifikk matching og largest-remainder-fordeling.

**Spec:** Oppfølgingsprompt for QuizKrets QA (P0 #1–#3).

## Global regler

- TDD: skriv feilende test først, verifiser at den feiler, implementer minimal fiks.
- Bevar eksisterende API der mulig; små endringer.
- Ikke slett brukerdata automatisk.

## Task 1: P0 #1 – Position-basert svarvalg ✅ (commit 2a5a686)

- `PLAYER_ANSWER` bærer `choiceIndex`; GamePlay slår opp faktisk `choiceId` i gjeldende spørsmål.
- 9 nye enhetstester for KeyboardDriver (node-miljø, DOM-mock uten jsdom).
- E2E-regresjonstest med stokket svarrekkefølge; RED→GRØNN verifisert på begge nivåer.
- Oppdaget og håndterte timing-hull i E2E (input-lytter registreres i effect etter commit).

## Task 2: P0 #2 – Aldri slett data ved lagringsfeil ✅ (commit c6ef588)

- `writeBank`: ved feil er eksisterende localStorage urørt; StorageError med eksport-hint.
- `initQuestionBank`: les-tilbake-verifikasjon før MIGRATED_KEY settes; krasjer ikke ved full kvote.
- 6 nye tester (kvote ved tillegg/endring/sletting, migrering ved full kvote, delvis lagring, normal migrering).
- UI-feilhåndtering: QuestionBank (beholder dialog åpen), ImportQuestions, FetchFromAPI.

## Task 3: P0 #3 – Robust kategorivekting ✅ (commit 5c75514)

- `selectWeighted`: størrest-rest-kvoter (sum = target), egen kategorimatching via `expandSelection([kategori])`, iterativ omfordeling med vektet fair queuing, `taken`-sett mot overlapp.
- 8 nye tester; 5× påfølgende kjøringer 22/22 stabile.

## Verifikasjon P0 (total)

- Enhetstester: 103/103 · E2E: 15/15 · TypeScript-bygg: OK

## Neste: P1 #4–#10

- Results.tsx: nevner i resultatgraf
- App.tsx: categoryWeights i lagrede quizer
- backToLobby(): nullstilling av sesjon
- Lagstruktur fra alle startpunkter
- Spørsmålsgjenbruk (< antall ønsket)
- CSV-import-validering
- Pause vs. hastighetsbonus, buzzer-lås
