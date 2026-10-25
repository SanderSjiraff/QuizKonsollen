# QuizKrets – Implementeringsplan

## 1. Faseoversikt

| Fase | Navn | Varighet (est.) | Hovedmål |
|------|------|-----------------|----------|
| 0 | Fundament | 1 dag | Prosjektsetup + designsystem |
| 1 | MVP Frontend | 3-5 dager | Klikkbar prototype |
| 2 | Spillmotor | 2-3 dager | Tilstandsmaskin + logikk |
| 3 | Spørsmålsbank | 2-3 dager | Import, CRUD, filter |
| 4 | Testing | 2-3 dager | Enhetstester, E2E, QA |
| 5 | Elektronikk-integrasjon | 5-7 dager | Pico 2, buzzer, serial |
| 6 | Polish | 2-3 dager | Animasjoner, lyd, finpuss |
| 7 | Raspberry Pi | 2-3 dager | Deploy, kiosk-modus |

**Totalt estimat: 19-28 dager (1-1.5 måneder med 50% stilling)**

---

## 2. Oppgavedetaljer

### Fase 0: Fundament

#### Oppgave 0.1: Prosjektsetup
**Mål:** Funksjonell React+TypeScript+Vite+Tailwind-bas
**Moduler:** Hele prosjektet
**Avhengigheter:** Ingen
**Leveranser:**
- [x] package.json med alle avhengigheter
- [x] Tailwind-konfigurasjon med QuizKrets-tema
- [x] Google Fonts (Righteous + Poppins)
- [x] Basestruktur (komponenter, pages, hooks, data)
**Akseptanse:** `npm run build` fullføres uten feil
**Tester:** Bygg-verifisering

#### Oppgave 0.2: Designsystem
**Mål:** Komplett designsystem implementert
**Moduler:** `src/styles/`, Tailwind-config
**Avhengigheter:** Oppgave 0.1
**Leveranser:**
- [x] CSS-variabler for alle design tokens
- [x] Button-komponenter (primary, secondary, danger)
- [x] Card-komponenter
- [x] Spillerfarger (8 farger)
- [x] Typografisk system
- [x] Animasjons-utility-klasser
**Akseptanse:** Visuell inspeksjon av alle komponenter
**Tester:** Ingen (visuell QA)

**Status: ✅ FULLFØRT – 23.10.2026**

---

### Fase 1: MVP Frontend

#### Oppgave 1.1: Typedefinisjoner
**Mål:** Alle TypeScript-typer definert
**Moduler:** `src/types/`
**Avhengigheter:** Oppgave 0
**Leveranser:**
- [x] Question, Player, GameConfig, GameState, etc.
- [x] Spillmodus-typer
- [x] Input-event-typer
**Akseptanse:** Ingen `any`-typer i koden
**Tester:** TypeScript-kompilering

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.2: Mock-data
**Mål:** Realistisk testdata for utvikling
**Moduler:** `src/data/mockData.ts`
**Avhengigheter:** Oppgave 1.1
**Leveranser:**
- [x] 10+ spørsmål i ulike kategorier og vanskelighetsgrader
- [x] 8 kategorier med ikoner og farger
- [x] 2 forhåndsinnstillinger (presets)
- [x] Standard spillere med farger
**Akseptanse:** Data kan brukes i UI uten feil
**Tester:** Validering av datastruktur

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.3: Hovedmeny
**Mål:** Startskjerm med navigasjon
**Moduler:** `src/pages/MainMenu.tsx`
**Avhengigheter:** Oppgave 0.2, 1.2
**Leveranser:**
- [x] Logo med glød-effekt
- [x] 5 navigasjonskort med ikoner
- [x] Animerte innvinninger (Framer Motion)
- [x] Tastaturnavigasjon
**Akseptanse:** Alle knapper navigerer til riktig skjerm
**Tester:** Navigasjonstester

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.4: Quizbygger
**Mål:** Konfigurere quiz før spill
**Moduler:** `src/pages/QuizBuilder.tsx`
**Avhengigheter:** Oppgave 1.3
**Leveranser:**
- [x] Kategori-velger (flere samtidig)
- [x] Vanskelighetsgrad-velger
- [x] Antall spørsmål (slider + knapper)
- [x] Spillmodus-velger
- [x] Tidsinnstilling
- [x] Forhåndsinnstillinger
- [x] Bekreft-knapp med validering
**Akseptanse:** Bruker kan sette sammen en komplett quiz
**Tester:** Validering av valg, filtrering

**Status: ✅ FULLF�ØRT – 23.10.2026**

#### Oppgave 1.5: Lobby
**Mål:** Spillerregistrering før spill
**Moduler:** `src/pages/Lobby.tsx`
**Avhengigheter:** Oppgave 1.4
**Leveranser:**
- [x] Spillerbokser med farger
- [x] Navn-redigering
- [x] Fargebytte
- [x] Klar-status per spiller
- [x] Start-knapp (aktiveres når alle er klare)
**Akseptanse:** Alle 4 spillere kan konfigureres og starte
**Tester:** Spilleradministrasjon, start-forutsetninger

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.6: Spillvisning
**Mål:** Spille gjennom spørsmål
**Moduler:** `src/pages/GamePlay.tsx`
**Avhengigheter:** Oppgave 1.5, useTimer
**Leveranser:**
- [x] Progresjonsbar
- [x] Tidsur (nedtelling)
- [x] Spørsmålstekst (stor, lesbar)
- [x] Svaralternativer (A/B/C/D)
- [x] Poengoversikt
- [x] Tilbakemelding (riktig/feil)
- [x] Forklaring (hvis tilgjengelig)
- [x] "Neste"-knapp
**Akseptanse:** Komplett spillrunde kan gjennomføres
**Tester:** Svar-validering, timer, poengberegning

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.7: Resultatskjerm
**Mål:** Vise sluttresultater
**Moduler:** `src/pages/Results.tsx`
**Avhengigheter:** Oppgave 1.6
**Leveranser:**
- [x] Vinner-fremheving med glød
- [x] Rangering med søylediagram
- [x] Spillerfarger gjennomgående
- [x] "Spill igjen"-knapp
- [x] "Hovedmeny"-knapp
**Akseptanse:** Korrekt rangering, visuelt tiltalende
**Tester:** Poengsortering, navigasjon

**Status: ✅ FULLFØRT – 23.10.2026**

#### Oppgave 1.8: Spørsmålsbank
**Mål:** Administrere spørsmål
**Moduler:** `src/pages/QuestionBank.tsx`
**Avhengigheter:** Oppgave 1.2
**Leveranser:**
- [x] Søkefelt
- [x] Kategorifiltre
- [x] Spørsmålsliste med kort
- [x] Vis svaralternativer og riktig svar
- [x] Rediger/slett-knapper (UI)
**Akseptanse:** Bruker kan finne og inspisere spørsmål
**Tester:** Søk, filtrering

**Status: ✅ FULLFØRT – 23.10.2026**

---

### Fase 2: Spillmotor

#### Oppgave 2.1: useGameEngine-hook
**Mål:** Sentral spilltilstandshåndtering
**Moduler:** `src/hooks/useGameEngine.ts` + ren logikk i `src/core/gameSession.ts`
**Avhengigheter:** Fase 1
**Leveranser:**
- [x] Spillkonfigurasjon (GameConfig)
- [x] Spilleradministrasjon
- [x] Spørsmålsfiltrering og -stokking (Fisher–Yates i questionSelector)
- [x] Poengberegning (ScoreConfig adskilt fra statistikk)
- [x] Skjermbytte-logikk
- [x] Fasestyring (answering/buzzing/revealed) – enum-tilnærmet i GamePlay
- [x] Pause-funksjonalitet (PAUSE_GAME-hendelse)
- [x] Lag-administrasjon (team-modus med auto-inndeling)
**Akseptanse:** Komplett spillflyt fungerer
**Tester:** Enhetstester for alle funksjoner

**Status: ✅ FULLFØRT – 25.10.2026 (ombygget; logikk i src/core/, testbar uten React)**

#### Oppgave 2.2: Avansert poengsystem
**Mål:** Fleksibel poengberegning
**Moduler:** `src/core/scoring.ts`
**Avhengigheter:** Oppgave 2.1
**Leveranser:**
- [x] Bonus for raskt svar (valgfri speed-bonus, lineær mot 0)
- [x] Anti-cheat (duplikatsjekk i gameSession.registerAnswer)
- [ ] Vekting per kategori
- [ ] Bonusrunder
**Akseptanse:** Korrekt poeng ved ulike scenarier
**Tester:** Poengberegningstester med mock-data

**Status: ⏳ DELVIS FULLFØRT – speed-bonus og duplikatbeskyttelse klare; kategori-vekting og bonusrunder gjenstår**

---

### Fase 3: Spørsmålsbank (CRUD)

#### Oppgave 3.1: localStorage-persistens
**Mål:** Lagre spørsmål lokalt
**Moduler:** `src/data/questionStore.ts`
**Avhengigheter:** Ingen
**Leveranser:**
- [x] Lagre spørsmål (bank + CRUD)
- [x] Hente spørsmål (med søk, filtre, duplikatkontroll)
- [x] Oppdatere spørsmål
- [x] Slette spørsmål
- [x] Lagre spilloppsett (quizkrets_saved_quizzes) og historikk
- [x] Idempotent migrering av legacy-nøkler
**Akseptanse:** Data persistert mellom sesjoner
**Tester:** 11 questionStore-tester + 11 adapter-tester

**Status: ✅ FULLFØRT – 25.10.2026**

#### Oppgave 3.2: Import/eksport
**Mål:** JSON/CSV import og eksport
**Moduler:** `src/pages/ImportQuestions.tsx` + `src/core/questionValidation.ts`
**Avhengigheter:** Oppgave 3.1
**Leveranser:**
- [x] JSON-import med sentral validering og feilrapport per spørsmål
- [x] CSV-import
- [x] Feilhåndtering (tydelige meldinger, ingenting lagres ved feil)
- [ ] JSON-eksport av banken
**Akseptanse:** Validert import/eksport av spørsmål
**Tester:** questionValidation-tester; import dekkes indirekte av valideringstestene

**Status: ⏳ DELVIS FULLFØRT – import klar; eksport gjenstår**

---

### Fase 4: Testing

#### Oppgave 4.1: Enhetstester
**Mål:** Teste forretningslogikk
**Moduler:** `src/core/__tests__/`, `src/data/__tests__/`
**Avhengigheter:** Fase 2
**Leveranser:**
- [x] Poengberegning (10 tester)
- [x] Kategorihåndtering (10)
- [x] Spørsmålsvalidering (12)
- [x] Uttrekk/tilstand (14 + gameSession)
- [x] questionStore + adaptere (22)
**Akseptanse:** All ren logikk testet uten React
**Tester:** Vitest

**Status: ✅ FULLFØRT – 25.10.2026 (7 filer, 77/77 passerer)**

#### Oppgave 4.2: E2E-tester
**Mål:** Teste komplett spillflyt
**Moduler:** `tests/quizkrets.spec.ts`
**Avhengigheter:** Alle foregående faser
**Leveranser:**
- [x] Hovedmeny → Spill → Resultater (full flyt med statistikk)
- [x] Quizbygger med kategorier og underkategorier
- [x] Lobby med konfigurerbart antall spillere
- [x] Svar via tastatur (1–4) og buzzer (1–8) + mellomrom
- [x] Uttrekksdialog uten fallback (reduser/avbryt)
- [x] QuestionBank CRUD + duplikatkontroll
- [x] Historikk med faktiske data
**Akseptanse:** Alle tester består
**Tester:** Playwright (baseURL fra TEST_PORT/TEST_BASE_URL)

**Status: ✅ FULLFØRT – 25.10.2026 (14/14 passerer)**

#### Oppgave 4.3: Visuell QA
**Mål:** Sikre visuell kvalitet
**Moduler:** Alle skjermer
**Avhengigheter:** Fase 1
**Leveranser:**
- [x] Skjermbilder 1920×1080
- [x] Skjermbilder 1280×720
- [x] Skjermbilder mobil (390×844)
- [x] Skjermbilder av alle hovedskjermer (10 totalt, i tests/screenshots/)
- [ ] Systematisk kontrast-sjekk (WCAG) – manuell gjennomgang gjort
**Akseptanse:** Ingen visuelle feil
**Tester:** Playwright screenshots

**Status: ✅ FULLFØRT – 25.10.2026**

---

### Fase 5: Elektronikk-integrasjon

#### Oppgave 5.1: Input-adapter-grensesnitt
**Mål:** Abstrakt kontrollerlag
**Moduler:** `src/core/inputEvents.ts`
**Avhengigheter:** Fase 2
**Leveranser:**
- [x] InputEvent-typer (PLAYER_BUZZ/ANSWER/READY, NEXT_QUESTION, PAUSE_GAME)
- [x] Hendelses-hub som normaliserer alle kilder
- [x] KeyboardDriver (tast 1–4 = svar, 1–8 = buzz, mellomrom = neste)
- [ ] InputAdapter-grensesnitt for serie/HID (formalisering til Pico-fasen)
**Akseptanse:** Tastaturstøtte fungerer som MVP; ny kilde kobles til uten endringer i spillmotoren
**Tester:** inputEvents dekket via gameSession-tester + E2E tastaturtester

**Status: ✅ FULLFØRT (hub og tastaturdriver) – 25.10.2026; adapter-formalisering gjøres i Pico-fasen**

#### Oppgave 5.2: Pico 2-firmware
**Mål:** Mikrokontroller-programvare
**Moduler:** `hardware/pico_firmware/`
**Avhengigheter:** Oppgave 5.1
**Leveranser:**
- [ ] GPIO-oppsett for 4 knapper
- [ ] Debouncing
- [ ] Buzzer-vindu (arm/reset)
- [ ] Serial-kommunikasjon (JSON)
- [ ] Spiller-ID-mapping
**Akseptanse:** Knappetrykk registreres korrekt
**Tester:** Fysiske tester med oscilloskop/multimeter

**Status: ⏳ IKKE STARTET**

#### Oppgave 5.3: Serial-adapter
**Mål:** Koble Pico til frontend
**Moduler:** `src/adapters/PicoSerialAdapter.ts`
**Avhengigheter:** Oppgave 5.2
**Leveranser:**
- [ ] Serial-port-lesing
- [ ] JSON-protokoll
- [ ] Reconnect-håndtering
- [ ] Feilmeldinger i UI
**Akseptanse:** Knappetrykk på Pico trigger UI-hendelser
**Tester:** E2E med fysisk hardware

**Status: ⏳ IKKE STARTET**

---

### Fase 6: Polish

#### Oppgave 6.1: Animasjoner
**Mål:** Professionelle overganger
**Moduler:** `src/styles/animations.css`
**Avhengigheter:** Fase 1
**Leveranser:**
- [ ] Page transitions
- [ ] Ripple-effekt på knapper
- [ ] Poengtall-animasjon
- [ ] Timer-puls
- [ ] Confetti ved seier
**Akseptanse:** Smooth 60fps-animasjoner
**Tester:** Ytelsestesting

**Status: ⏳ IKKE STARTET**

#### Oppgave 6.2: Lyd
**Mål:** Lydeffekter
**Moduler:** `src/audio/`
**Avhengigheter:** Fase 1
**Leveranser:**
- [ ] Riktig svar-lyd
- [ ] Feil svar-lyd
- [ ] Buzzer-lyd
- [ ] Countdown-lyd
- [ ] Bakgrunnsmusikk (optional)
- [ ] Lyd av/på-innstilling
**Akseptanse:** Synkronisert lyd med UI
**Tester:** Manuell testing

**Status: ⏳ IKKE STARTET**

---

### Fase 7: Raspberry Pi

#### Oppgave 7.1: RPi-deploy
**Mål:** Kjøre på Raspberry Pi
**Moduler:** Hele applikasjonen
**Avhengigheter:** Alle foregående faser
**Leveranser:**
- [ ] Build for ARM64
- [ ] Kiosk-modus (Chromium)
- [ ] Autostart
- [ ] Fullskjerm uten chrome
- [ ] Tastatur-fjerning (hvis ikke nødvendig)
**Akseptanse:** Systemet starter ved boot, quiz kan spilles
**Tester:** E2E på Raspberry Pi

**Status: ⏳ IKKE STARTET**

---

## 3. Paralleliserbare oppgaver

### Git Worktree-oppsett

For å tillate parallell utvikling av isolerte funksjoner:

```bash
# Hovedgren (MVP)
git worktree add ../quizkrets-mvp main

# Spillmotor-gren
git worktree add ../quizkrets-engine feature/game-engine

# Elektronikk-gren
git worktree add ../quizkrets-hardware feature/pico-integration

# Polish-gren
git worktree add ../quizkrets-polish feature/animations-sound
```

### Parallelliseringskart

| Oppgave | Parallell med | Grenseflater |
|---------|---------------|--------------|
| 1.1-1.8 (Frontend) | 0.1-0.2 (Design) | Design tokens |
| 2.1-2.2 (Spillmotor) | 1.3-1.8 (UI) | GameConfig, GameState |
| 3.1-3.2 (Bank) | 1.8 (Bank UI) | Question-typer |
| 5.1-5.3 (Elektronikk) | 4.1-4.3 (Testing) | InputEvent |
| 6.1-6.2 (Polish) | 7.1 (RPi) | Ingen (visuelt) |

---

## 4. Risikoanalyse

| Risiko | Sannsynlighet | Impact | Mitigering |
|--------|--------------|--------|------------|
| Pixelfont uleselig på TV | Middels | Høy | Bruk Poppins, stor størrelse |
| Tidsur synkroniseringsfeil | Lav | Høy | Bruk requestAnimationFrame |
| Pico-serial disconnect | Middels | Middels | Reconnect-logikk, fallback til tastatur |
| For få spørsmål i banken | Middels | Middels | Import-funksjonalitet, fallback-melding |
| Lav ytelse på RPi | Middels | Høy | Optimalisering, reduserte effekter |
| Fargeblindhet-problemer | Lav | Middels | Ikoner + farge, høy kontrast |
| Nettleserkompatibilitet | Lav | Lav | Test i Chrome/Firefox |

---

## 5. Nærmeste neste steg (anbefalt prioritet)

1. **Test i praksis** – spill komplette runder på TV med flere spillere og
   buzzere; verifiser leseavstand og turtak
2. **Fyll spørsmålsbanken** – importer fra OpenTDB/The Trivia API og rediger
   `til-gjennomgang`-kategoriene; mål 200+ godkjente spørsmål
3. **JSON-eksport** – eksport av banken for deling og backup
4. **Pico 2-firmware** – buzzerknapper + serieadapter mot input-huben
   (grensesnittet er klart; spillmotoren endres ikke)
5. **Lyd** – vurder Web Audio for riktig/feil/buzzer (beslutning 3.2)

---

## 6. Definisjon av MVP-fullført

QuizKrets MVP er fullført når:

- [x] Bruker kan navigere gjennom alle skjermer
- [x] Quizbygger fungerer med flere temaer og vanskelighetsgrader
- [x] Lobby med spilleradministrasjon fungerer
- [x] Komplett spillrunde kan spilles (spørsmål → svar → poeng)
- [x] Resultatskjerm viser korrekt rangering
- [x] Spørsmålsbank med søk og filter fungerer
- [x] Designsystem er konsistent på tvers av alle skjermer
- [x] Tastaturnavigasjon fungerer
- [x] Applikasjonen bygger uten feil
- [x] Prototypen kjører lokalt uten internett
- [x] Full svarstatistikk (riktig/feil/ubesvart/treff%/svartid) per spiller
- [x] Uttrekk respekterer alltid valgte kriterier (ingen fallback)
- [x] Flerspiller korrekt (hot-seat, buzzer, team – ingen hardkodet spiller 1)
- [x] Spørsmålshistorikk med faktiske data
- [x] Enhetstester og E2E-tester passerer

**NÅVÆRENDE STATUS: MVP fullført med tilstandsdybde – spillmotor, statistikk,
spørsmålsbank, import/API og testdeksjon på plass (25.10.2026). Neste fase:
innholdsmengde (spørsmålsbank) og fysisk kontroller (Pico 2). 🎉**

---

*Sist oppdatert: 25. oktober 2026*
