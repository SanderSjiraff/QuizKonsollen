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
**Moduler:** `src/hooks/useGameEngine.ts`
**Avhengigheter:** Fase 1
**Leveranser:**
- [x] Spillkonfigurasjon
- [x] Spilleradministrasjon
- [x] Spørsmålsfiltrering og -stokking
- [x] Poengberegning
- [x] Skjermbytte-logikk
- [ ] Tilstandsmaskin (enum-basert)
- [ ] Pause/funksjonalitet
- [ ] Lag-administrasjon
**Akseptanse:** Komplett spillflyt fungerer
**Tester:** Enhetstester for alle funksjoner

**Status: ⏳ DELVIS FULLFØRT – grunnleggende hook fungerer**

#### Oppgave 2.2: Avansert poengsystem
**Mål:** Fleksibel poengberegning
**Moduler:** `src/utils/scoring.ts`
**Avhengigheter:** Oppgave 2.1
**Leveranser:**
- [ ] Bonus for raskt svar
- [ ] Vekting per kategori
- [ ] Bonusrunder
- [ ] Anti-cheat (duplikatsjekk)
**Akseptanse:** Korrekt poeng ved ulike scenarier
**Tester:** Poengberegningstester med mock-data

**Status: ⏳ IKKE STARTET**

---

### Fase 3: Spørsmålsbank (CRUD)

#### Oppgave 3.1: localStorage-persistens
**Mål:** Lagre spørsmål lokalt
**Moduler:** `src/data/localStorage.ts`
**Avhengigheter:** Ingen
**Leveranser:**
- [ ] Lagre spørsmål
- [ ] Hente spørsmål
- [ ] Oppdatere spørsmål
- [ ] Slette spørsmål
- [ ] Lagre spilloppsett
**Akseptanse:** Data persistert mellom sesjoner
**Tester:** localStorage-wrapper-tester

**Status: ⏳ IKKE STARTET**

#### Oppgave 3.2: Import/eksport
**Mål:** JSON/CSV import og eksport
**Moduler:** `src/utils/importExport.ts`
**Avhengigheter:** Oppgave 3.1
**Leveranser:**
- [ ] JSON-import med validering
- [ ] JSON-eksport
- [ ] CSV-import
- [ ] Feilhåndtering
**Akseptanse:** Validert import/eksport av spørsmål
**Tester:** Import/eksport-tester

**Status: ⏳ IKKE STARTET**

---

### Fase 4: Testing

#### Oppgave 4.1: Enhetstester
**Mål:** Teste forretningslogikk
**Moduler:** `tests/unit/`
**Avhengigheter:** Fase 2
**Leveranser:**
- [ ] Poengberegning
- [ ] Spørsmålsfiltrering
- [ ] Tilstandsmaskin
- [ ] Timer-logikk
**Akseptanse:** >80% kodestarting
**Tester:** Vitest

**Status: ⏳ IKKE STARTET**

#### Oppgave 4.2: E2E-tester
**Mål:** Teste komplett spillflyt
**Moduler:** `tests/e2e/`
**Avhengigheter:** Alle foregående faser
**Leveranser:**
- [ ] Hovedmeny → Spill → Resultater
- [ ] Quizbygger med alle valg
- [ ] Lobby med alle spillere
- [ ] Spill med alle svaralternativer
- [ ] Navigasjon med tastatur
**Akseptanse:** Alle tester består
**Tester:** Playwright

**Status: ⏳ IKKE STARTET**

#### Oppgave 4.3: Visuell QA
**Mål:** Sikre visuell kvalitet
**Moduler:** Alle skjermer
**Avhengigheter:** Fase 1
**Leveranser:**
- [ ] Skjermbilder 1920×1080
- [ ] Skjermbilder 1280×720
- [ ] Kontrast-sjekk (WCAG)
- [ ] Responsivitetstest
**Akseptanse:** Ingen visuelle feil
**Tester:** Playwright screenshots

**Status: ⏳ IKKE STARTET**

---

### Fase 5: Elektronikk-integrasjon

#### Oppgave 5.1: Input-adapter-grensesnitt
**Mål:** Abstrakt kontrollerlag
**Moduler:** `src/adapters/`
**Avhengigheter:** Fase 2
**Leveranser:**
- [ ] InputEvent-typer
- [ ] InputAdapter-grensesnitt
- [ ] KeyboardAdapter (tastatur-simulering)
- [ ] Event-bus for input
**Akseptanse:** Tastaturstøtte fungerer som MVP
**Tester:** Adapter-enhetstester

**Status: ⏳ IKKE STARTET**

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

1. **Test prototypen** – Spill gjennom en komplett quiz og dokumenter feil
2. **Implementer localStorage** – Persistens for spørsmål og oppsett
3. **Bygg game engine** – Full tilstandsmaskin med enum-baserte tilstander
4. **Utvid spørsmålsbanken** – 100+ spørsmål med variasjon
5. **Start testing** – Vitest + Playwright setup

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

**NÅVÆRENDE STATUS: MVP Frontend er fullført! 🎉**

---

*Sist oppdatert: 23. oktober 2026*
