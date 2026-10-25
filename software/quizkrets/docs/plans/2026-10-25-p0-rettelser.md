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

## P1 #4–#10 (fullført)

- **P1 #4** (commit 5a1f4a0): `statsBarFractions` i scoring.ts – lag-nevner er spillere × spørsmål; 3 nye enhetstester.
- **P1 #5** (commit 5a1f4a0): kategorivekter lagres/gjenopprettes via `presetToConfigUpdates`; eksplisitte vekter i alle startstier; E2E med 100 % historie-vekt.
- **P1 #6** (commit 7019b3e): `backToLobby` oppretter alltid ny GameSession, nullstiller spørsmålsindeks og bumper answerVersion (avsluttet sesjon blokkerte nye svar via duplikatbeskyttelse; runde 2 startet på siste spørsmål). E2E RED→GRØNN.
- **P1 #7** (commit 7019b3e): `buildTeams` flyttet til `core/teams.ts`; `startGame` sikrer konsistent lagstruktur uansett startpunkt (builder, lagret quiz, GameSetup); 4 enhetstester + E2E (Lag 1/Lag 2 vises fra GameSetup-start).
- **P1 #8** (commit 7064a61): gjenbruksknapp i SelectionErrorDialog vises kun når gjenbruk faktisk kan dekke ønsket antall (tidligere felle → dialog-løkke); 2 E2E (RED→GRØNN).
- **P1 #9** (commit 7064a61): ImportQuestions var en død skjerm (ingen UI-sti) → ny «Importer fil»-knapp i GameSetup; `csvToDrafts` flyttet til `core/csvImport.ts` og returnerer `{drafts, invalid}` – ugyldige rader rapporteres radvis i stedet for å forkaste hele importen; 9 enhetstester + E2E (2 gyldige + 1 ugyldig rad, verifisert lagring i banken).
- **P1 #10** (commit df6e48d): pausetid ekskluderes fra svartid via `pausedAtRef`-kompensasjon i `questionStartRef` (E2E RED: timeTakenMs 3458 etter 3 sek pause → GRØNN < 2000); `handleBuzz` setter `phaseRef.current` synkront (race-fiks i P0 #1-stil; defensive for fremtidige controller-kilder).

## Verifikasjon P1 (total)

- Enhetstester: 123/123 · E2E: 22/22 · TypeScript-bygg: OK

## Noterte P2-funn (til P2 #11–13)

- Import-suksessbekreftelsen vises aldri: `onImportComplete` navigerer umiddelbart, så «N spørsmål importert»-meldingen forsvinner i samme render.
- Kategori-etikett i GamePlay viser kun `question.categories[0]` – ikke nødvendigvis matchende/valgt kategori.

## Neste: P2 #11–13

- Kategori-etikett viser matchende kategori
- Tilgjengelighet på ikon-knapper (f.eks. SavedQuizzes «Tilbake»)
- Testing/dokumentasjon: oppdater AGENTS.md etter bekreftede endringer
- Uavhengig kodegjennomgang og endelig leveranserapport
