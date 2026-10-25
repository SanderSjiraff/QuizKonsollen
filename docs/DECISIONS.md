# QuizKrets – Arkitektur- og designbeslutninger

*Oppdatert: 25. oktober 2026*

## 1. Beslutninger tatt (planleggingsfasen, 23. oktober 2026)

### 1.1 Designretning: "TV Show" (Retning C)

**Dato:** 23. oktober 2026

**Alternative vurdert:**
- Retning A: Pixel Art / Arcade Neon (retro 8-bit)
- Retning B: Modern Bold (lys bakgrunn, SaaS-lignende)
- Retning C: TV Show Entertainment (mørk, varm amber)

**Beslutning:** Retning C - "TV Show"

**Begrunnelse:**
1. **TV-optimalisering:** Mørk bakgrunn med høykontrastfarger er optimalt for TV-visning på avstand
2. **Sosial stemning:** Varm amber (#F59E0B) gir festlig, innbydende følelse
3. **Balansert identitet:** Underholdende uten å bli barnslig eller generisk
4. **Lesbarhet:** Righteous + Poppins gir både personlighet og klarhet
5. **Vedlikeholdbarhet:** Mørk-first design er enklere å utvide

**Konsekvenser:**
- Lys modus er ikke prioritert
- All tekst må være minimum 24px for TV
- Fokus-markeringer må være ekstra tydelige

---

### 1.2 Teknologistack: React + TypeScript + Vite + Tailwind

**Dato:** 23. oktober 2026

**Alternative vurdert:**
- Vue 3 + Vite (enklere læringskurve)
- Svelte (raskere ytelse)
- Next.js (SSR, raskere FCP)
- Plain HTML/CSS/JS (minst kompleksitet)

**Beslutning:** React 18 + TypeScript + Vite + Tailwind CSS

**Begrunnelse:**
1. **React:** Stort økosystem, bra dokumentasjon, lett å finne hjelp
2. **TypeScript:** Typesikkerhet, bedre IDE-støtte, færre runtime-feil
3. **Vite:** Raskere bygg enn CRA, moderne dev server
4. **Tailwind:** Konsistent design system, rask prototyping
5. **Framer Motion:** React-native animasjoner, bra dokumentasjon
6. **Lucide React:** Konsistente, tilgjengelige ikoner

**Konsekvenser:**
- Bundle-størrelse er større enn Svelte/Vanilla
- Krever Node.js/npm for bygging
- Læringskurve for nye utviklere

---

### 1.3 Ingen backend i MVP

**Dato:** 23. oktober 2026

**Beskrivelse:** MVP-en kjører kun med frontend. Spillmotor og data ligger i
nettleseren; lagring skjer per i dag i localStorage (beslutning 2.2).

**Begrunnelse:**
1. **Simplicity:** Færre komponenter å sette opp og vedlikeholde
2. **Offline-first:** Kjernen fungerer uten nettverk (API-henting er valgfritt tillegg)
3. **Rask prototyping:** Komponentene bygges raskere uten API-design
4. **Senere fleksibilitet:** Backend kan introduseres når behovet oppstår

**Konsekvenser:**
- Ingen deling av quizer mellom enheter
- Ingen multiplayer over nettverk
- Større frontend-bundle (all logikk og frødata inkludert)

---

### 1.4 Tastatur som primærinput i MVP

**Dato:** 23. oktober 2026

**Begrunnelse:**
1. **Ingen hardware-avhengighet:** MVP kan testes umiddelbart
2. **Universal tilgjengelighet:** Alle har tastatur
3. **Fremtidig fallback:** Tastatur fungerer alltid som backup
4. **Mapping:** Tastatur-input kan enkelt oversettes til fysiske knapper

**Faktisk mapping per 25.10.2026 (KeyboardDriver):**
- Svar: taster 1–4 (A–D)
- Buzzer: taster 1–8 (spillernummer)
- Neste spørsmål: mellomrom
- Pause: P

---

### 1.5 Spillmotor i frontend (ikke separat prosess)

**Dato:** 23. oktober 2026

**Begrunnelse:**
1. **Simplicity:** Ingen IPC eller API-kall
2. **Ytelse:** Direkte tilstandsendringer uten serialisering
3. **Utvikling:** Lett å debugge i React DevTools
4. **Fremtidig flytting:** Ren logikk ligger i `src/core/` og kan senere
   ekstraheres til backend uten omskriving

**Konsekvenser:**
- Spilltilstanden er i minnet (mister pågående runde ved refresh – historikk lagres)
- Ingen multiplayer-over-nettverk

---

## 2. Beslutninger tatt i ombyggingen (24.–25. oktober 2026)

### 2.1 Streng spørsmålsuttrekk – aldri fallback

**Beslutning:** `questionSelector` returnerer `SelectionError` når valgene ikke
kan oppfylles. UI viser dialog med konkrete valg (reduser antall, hent flere
fra nettet, tillat gjenbruk, avbryt). Ingen stille reduksjon, ingen utvidelse
av kriterier bak ryggen på brukeren.

**Begrunnelse:** Brukeren skal stole på at quizen faktisk handler om det som
ble valgt. En quiz som lover "Historie + vanskelig" og leverer annet er verre
enn en tydelig feilmelding.

---

### 2.2 localStorage som lagring (foreløpig)

**Beslutning:** questionStore bruker localStorage.

**Begrunnelse:** Banken er < 2000 spørsmål ≈ 1–2 MB, godt innenfor grensen.
Synkront API gir enkel kode og tester. SQLite vurderes i Raspberry Pi-fasen
(backend), IndexedDB ble valgt bort – asynkron kompleksitet uten gevinst på
denne størrelsen. Begrunnelsen er dokumentert i questionStore.ts.

---

### 2.3 Hierarkiske kategorier med sentral migreringsmap

**Beslutning:** Flate kebab-case-IDer med `parentId`. Filtrering via
`expandSelection` (hovedkategori matcher underkategorier). Leverandørkategorier
oversettes gjennom én sentral map; ukjente navn → kategorien `til-gjennomgang`
med `needsReview`-flagg, aldri vilkårlig plassering. Ukjente *tags* hos
The Trivia API droppes.

**Begrunnelse:** Stabile IDer overlever endringer i visningsnavn; én
migreringsmap er det eneste stedet leverandørnavn håndteres; ukjente kategorier
skal fyres opp i lyset, ikke begraves.

---

### 2.4 Stabile spørsmåls-IDer med innholdshash

**Beslutning:** OpenTDB-IDer = `otdb-<FNV-1a>` over normalisert tekst;
The Trivia API = `tapi-<API-id>`; manuelle = `q-<UUID>`. Aldri kun `Date.now()`.
Duplikatkontroll på normalisert tekst + innholdshash.

**Begrunnelse:** Gjenbrukssporing (`used_question_ids`) og duplikatsjekk krever
IDer som overlever re-henting fra samme kilde.

---

### 2.5 The Trivia API integrert (andre leverandør)

**Beslutning:** The Trivia API v2 integreres ved siden av Open Trivia DB, bak
samme adaptergrensesnitt (`QuestionSourceAdapter`).

**Undersøkelse før integrasjon:**
- Dokumentasjon: the-trivia-api.com (v2-endpoint)
- Lisens: **CC BY-NC 4.0** – gratis ikke-kommersiell bruk; kildehenvisning
  vises i UI og lagres i `sourceRef`
- Begrensninger: maks 50 spørsmål per kall, 20 kall per 5 s, stabile IDer
- Begrensning funnet: støtter **ikke** sant/usann – adapteren avviser med
  norsk feilmelding i stedet for å fake støtte

---

### 2.6 Poeng adskilt fra statistikk

**Beslutning:** `ScoreConfig` (poeng + valgfri speed-bonus, lineær mot 0) er
atskilt fra `AnswerRecord`/`PlayerStats` (riktig/feil/ubesvart/treff%/svartid).

**Begrunnelse:** Endrer man poengreglene skal ikke historisk statistikk endre
seg. Treffprosent er et faktum, poeng er et designvalg.

---

### 2.7 Timestamp-basert timer med duplikatbeskyttelse

**Beslutning:** Nedtelling regnes på tidsstempler (ikke kumulativt tick), og
`timeoutFiredRef` hindrer doble timeout-hendelser. `gameSession.registerAnswer`
nektar duplikatsvar per spiller/spørsmål.

**Begrunnelse:** Bakgrunnsfaner, throttling og doble hendelser (tast +
kontroller) ellers gir feil statistikk og hoppede spørsmål.

---

### 2.8 Ingen AI-generering av spørsmål

**Beslutning:** Spørsmål kommer fra frøbank, manuell redigering, import og
leverandør-API-er. AI brukes ikke til å generere faktaspørsmål.

**Begrunnelse:** Faktaspørsmål fra AI kan inneholde feil uten at brukeren
oppdager det; leverandørene har redaksjonelt hold.

---

### 2.9 Generisk input-hub for fremtidig elektronikk

**Beslutning:** All input normaliseres til
`PLAYER_BUZZ / PLAYER_ANSWER / PLAYER_READY / NEXT_QUESTION / PAUSE_GAME`
i `src/core/inputEvents.ts`. Tastaturet er bare én driver. Ingen firmware i
denne fasen – men fysiske kontrollere kobles til uten endringer i spillmotoren.

---

### 2.10 Playwright med miljøvariabel-styrt port

**Beslutning:** `TEST_PORT`/`TEST_BASE_URL` i playwright.config, `--strictPort`
på dev-serveren, `reuseExistingServer` lokalt. Ingen URL-er i testene.

**Begrunnelse:** Dev-servere opptar ofte flere porter; stille gjenbruk av en
tilfeldig server på forventet port gir falske testresultater.

---

### 2.11 Byggeartefakter spores ikke i git

**Beslutning:** `dist/` ignoreres konsekvent; `dist/index.html` som ved en
tilfeldighet var sporet fra før ignore-regelen, er tatt ut av sporingen.

**Begrunnelse:** Byggeoutput skal aldri i versjonskontroll; produksjonsbygg
genereres med `npm run build` ved behov.

---

## 3. Åpne beslutninger

### 3.1 Fysisk kontroller-design

**Alternativer:**
- **Buzzer-knapp:** Én stor knapp per spiller. Enkelt, billig, passer "førstemann"
- **A/B/C/D-panel:** Fire knapper per spiller. Støtter alle spørsmålstyper
- **Hybrid:** Stor buzzer + A/B/C/D. Støtter alt, men komplekst og stort

**Avgjørelsessituasjon:** Ikke avgjort. Anbefalt å starte med buzzer (enklest),
deretter vurdere A/B/C/D basert på brukertesting. Input-huben (beslutning 2.9)
støtter begge uansett.

---

### 3.2 Lyd og lyseffekter

**Alternativer:**
- Web Audio API - Ingen eksterne filer, generer lyder
- Preloadede lydfiler - Bedre kvalitet, større bundle
- Ingen lyd i MVP - Enklest, men mindre engasjerende

**Avgjørelse:** Ikke i MVP. Vurderes i Fase 6.

---

### 3.3 Backend-teknologi (når behovet oppstår)

**Alternativer:**
- FastAPI (Python) - Foreslått i originaldokument, god for læring
- Express/Next.js (Node.js) - Samme språk som frontend
- Supabase/Firebase - Managed backend, raskere å sette opp

**Avgjørelse trengs før:** Nettverk/multiplayer eller Raspberry Pi-fasen
(SQLite). Per 25.10.2026 er localStorage tilstrekkelig (beslutning 2.2).

---

## 4. Beslutningslogg

| Dato | Beslutning | Status |
|------|-----------|--------|
| 23.10.2026 | Designretning: TV Show | ✅ Bestemt |
| 23.10.2026 | Teknologistack: React+Vite+Tailwind | ✅ Bestemt |
| 23.10.2026 | Ingen backend i MVP | ✅ Bestemt |
| 23.10.2026 | Tastatur-input først | ✅ Bestemt |
| 23.10.2026 | Spillmotor i frontend | ✅ Bestemt |
| 25.10.2026 | Streng spørsmålsuttrekk uten fallback | ✅ Bestemt |
| 25.10.2026 | localStorage som lagring (SQLite til RPi-fasen) | ✅ Bestemt |
| 25.10.2026 | Hierarkiske kategorier + sentral migreringsmap | ✅ Bestemt |
| 25.10.2026 | Stabile IDer via FNV-1a/innholdshash | ✅ Bestemt |
| 25.10.2026 | The Trivia API integrert (CC BY-NC 4.0) | ✅ Bestemt |
| 25.10.2026 | Poeng adskilt fra statistikk | ✅ Bestemt |
| 25.10.2026 | Timestamp-timer + duplikatbeskyttelse | ✅ Bestemt |
| 25.10.2026 | Ingen AI-generering av spørsmål | ✅ Bestemt |
| 25.10.2026 | Generisk input-hub (tastatur = én driver) | ✅ Bestemt |
| 25.10.2026 | Playwright med TEST_PORT/TEST_BASE_URL | ✅ Bestemt |
| 25.10.2026 | dist/ tas ut av git-sporing | ✅ Bestemt |
| ?? | Kontroller-design (buzzer vs A/B/C/D) | ⏳ Ikke bestemt |
| ?? | Lyd/lys-strategi | ⏳ Ikke bestemt |
| ?? | Backend-teknologi (post-MVP) | ⏳ Ikke bestemt |

---

## 5. Konsekvenser av beslutninger

### Kort sikt (nå)
- ✅ Full spillflyt med statistikk, buzzer og team – testbar uten backend
- ✅ 77 enhetstester + 24 E2E-tester passerer
- ⚠️ Ingen deling mellom enheter

### Medium sikt (Fase 2-3)
- 📋 Import/eksport for deling av spørsmålsbank
- 📋 Pico 2-kontrollere via input-huben
- 📋 Backend vurderes ved behov for multiplayer

### Lang sikt (Fase 4+)
- 📋 FastAPI-backend hvis nettverk/multiplayer
- 📋 SQLite-database for spørsmålsbank (Raspberry Pi-fasen)
- 📋 Raspberry Pi-konsoll i kiosk-modus

---

## 6. Retningslinjer for fremtidige beslutninger

1. **Bevar modularitet:** Nye funksjoner skal ikke bryte eksisterende arkitektur
2. **TV-first:** Design- og UX-beslutninger prioriterer TV-opplevelse
3. **Offline-first:** Kjernen skal fungere uten internett
4. **Ingen fallback som skjuler feil:** Hvis valgene ikke kan oppfylles, si det
5. **Testbarhet:** Ren logikk i `src/core/`, UI tester med Playwright
6. **Dokumenter:** Alle viktige beslutninger loggføres her
