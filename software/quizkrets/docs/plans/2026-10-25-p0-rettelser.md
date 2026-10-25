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

- **P1 #4** (commit 5a1f401): `statsBarFractions` i scoring.ts – lag-nevner er spillere × spørsmål; 3 nye enhetstester.
- **P1 #5** (commit 5a1f401): kategorivekter lagres/gjenopprettes via `presetToConfigUpdates`; eksplisitte vekter i alle startstier; E2E med 100 % historie-vekt.
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

- Kategori-etikett viser matchende kategori ✅ (commit 2ccfc53)
- Tilgjengelighet på ikon-knapper (SavedQuizzes/Lobby/QuestionSources/Scoreboard «Tilbake», Lobby «Bytt farge») ✅ (commit 2ccfc53)
- Testing/dokumentasjon: oppdater AGENTS.md etter bekreftede endringer ✅
- Uavhengig kodegjennomgang og endelig leveranserapport

## Verifikasjon P2 (total)

- Enhetstester: 130/130 · E2E: 24/24 · TypeScript-bygg: OK

## Uavhengig kodegjennomgang (etter P2 #13)

Dom: **«With fixes»** – ingen Critical, to Important, åtte Minor. Behandling:

### Important

1. **`.agents/skills/**` i commit 2a5a686** (~12 000 linjer verktøydokumentasjon
   i samme commit som P0 #1-fiksen). Kan kun rettes ved å omskrive Git-historikk
   (forbudt uten godkjenning) → **rapportert til bruker for beslutning**
   (forslag: `.gitignore` + ev. historieomskriving ved neste push-rydding).
2. **Stille feil fra «Lagrede quizer»** når banken ikke kan oppfylle quizen
   (startGame returnerte false uten dialog) → **fikset**: SelectionErrorDialog
   er nå koblet inn i SavedQuizzes (samme mønster som GameSetup/QuizBuilder),
   med reduser/gjenbruk/hent-flere-handlinger. E2E RED→GRØNN (dialog vises,
   «Reduser antallet til 3» starter quizen).

### Minor – fikset

- QuizBuilder: `buildTeams`-import flyttet til toppen (sto midt i filen)
- togglePause: sideeffekter flyttet ut av state-updateren (StrictMode-sikker)
- `activePlayerIdRef` oppdateres synkront i submitAnswer (hot-seat) og
  handleBuzz – samme mønster som P1 #10-phaseRef-fiksen
- Planfil: SHA-typo `5a1f4a0` → `5a1f401`
- GamePlay-kommentar: «ALDRIV» → «ALDRI»

### Minor – vurdert og avvist (med begrunnelse)

- **Enter/mellomrom på fokusert «Neste spørsmål»-knapp dobbelthopper**:
  KeyboardDriver kaller `preventDefault()` på keydown for mellomrom/Enter,
  som undertrykker knappens native aktivering – dobbeltrigging kan derfor
  ikke oppstå. Et «skip-ved-fokusert-knapp»-vakt ville i stedet brutt
  eksisterende atferd (mellomrom etter valgklikk med fokus på valgknappen).

### Minor – notert som kjente forbedringspunkter

- **Stille trunkering ved 5 000-spørsmålsgrensen** (questionStore): import som
  skyver banken over grensen mister de eldste spørsmålene uten varsel. Vurder
  eksplisitt `StorageError`/tilbakemelding når noe faktisk kuttes.
- **Import-suksessbekreftelse vises aldri** (allerede dokumentert i AGENTS.md).

Anbefaling fra reviewer om integrasjonstest av `startGame`-stier: delvis
dekket av ny E2E for Lagrede quizer; full hook-test notert til senere.
