# QuizKrets – Arkitektur- og designbeslutninger

## 1. Beslutninger tatt

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

**Beskrivelse:** MVP-en kjører kun med frontend og mock-data.

**Begrunnelse:**
1. **Simplicity:** Færre komponenter å sette opp og vedlikeholde
2. **Offline-first:** Ingen nettverksavhengighet
3. **Rask prototyping:** Komponentene bygges raskere uten API-design
4. **Senere fleksibilitet:** Backend kan introduseres når behovet oppstår

**Konsekvenser:**
- Data (spørsmål, resultater) persistert via localStorage i senere fase
- Ingen deling av quizer mellom enheter
- Ingen multiplayer over nettverk
- Større frontend-bundle (all data inkludert)

---

### 1.4 Tastatur som primærinput i MVP

**Dato:** 23. oktober 2026

**Begrunnelse:**
1. **Ingen hardware-avhengighet:** MVP kan testes umiddelbart
2. **Universal tilgjengelighet:** Alle har tastatur
3. **Fremtidig fallback:** Tastatur fungerer alltid som backup
4. **Mapping:** Tastatur-input kan enkelt oversettes til fysiske knapper

**Planlagt input-mapping:**
- Spiller 1: Taster 1, Q, A, Z
- Spiller 2: Taster 2, W, S, X
- Spiller 3: Taster 3, E, D, C
- Spiller 4: Taster 4, R, F, V
- Spillleder: Enter, Escape, Space

---

### 1.5 Spillmotor i frontend (ikke separat prosess)

**Dato:** 23. oktober 2026

**Begrunnelse:**
1. **Simplicity:** Ingen IPC eller API-kall
2. **Ytelse:** Direkte tilstandsendringer uten serialisering
3. **Utvikling:** Lett å debugge i React DevTools
4. **Fremtidig flytting:** Logikken kan senere ekstraheres til backend

**Konsekvenser:**
- Spilltilstanden er i minnet (mister data ved refresh)
- Ingen multiplayer-over-nettverk
- Hardere å dele logikk med hardware-adapterne

---

## 2. Åpne beslutninger

### 2.1 Backend-teknologi

**Alternativer:**
- FastAPI (Python) - Foreslått i originaldokument, god for læring
- Express/Next.js (Node.js) - Enklere med samme språk som frontend
- Supabase/Firebase - Managed backend, raskere å sette opp
- Ingen backend - Fortsette med frontend-only

**Avgjørelse trenges før:** Fase 3 (nettverk/multiplayer, statistikk)

---

### 2.2 Database-løsning

**Alternativer:**
- SQLite (lokal fil) - Enkel, ingen server
- IndexedDB (browser) - Ingen filer, async
- localStorage - Enklest, men begrenset størrelse (5MB)
- PostgreSQL (med backend) - Skalerbart, krever server

**Avgjørelse trenges før:** Fase 2 (persistens av spørsmål og resultater)

---

### 2.3 Fysisk kontroller-design

**Alternativer:**
- **Buzzer-knapp:** Én stor knapp per spiller. Enkelt, billig, passer "førstemann"
- **A/B/C/D-panel:** Fire knapper per spiller. Støtter alle spørsmålstyper
- **Hybrid:** Stor buzzer + A/B/C/D. Støtter alt, men komplekst og stort

**Avgjørelsessituasjon:** Ikke avgjort ennå. Anbefalt å starte med buzzer (enklest), deretter vurdere A/B/C/D basert på brukertesting.

---

### 2.4 Antall støttede spillere

**Alternativer:**
- 4 spillere (standard)
- 6 spillere
- 8 spillere (maksimum i MVP-UI)

**Avgjørelse:** 4 spillere i MVP, men UI-en støtter 8 med farger definert.

---

### 2.5 Spørsmålsgenerering

**Alternativer:**
- Manuelt opprettet (nåværende)
- AI-generert (GPT/Claude API) - Krever API-nøkkel
- Import fra Open Trivia DB - Krever internett og lisens-sjekk
- Bruker-generert - Krever moderering

**Avgjørelse trenges før:** Fase 3 (storskalig spørsmålsbank)

---

### 2.6 Lyd og lyseffekter

**Alternativer:**
- Web Audio API - Ingen eksterne filer, generer lyder
- Preloadede lydfiler - Bedre kvalitet, større bundle
- Ingen lyd i MVP - Enklest, men mindre engasjerende

**Avgjørelse:** Ikke i MVP. Vurderes i Fase 6.

---

## 3. Beslutningslogg

| Dato | Beslutning | Hvem | Status |
|------|-----------|------|--------|
| 23.10.2026 | Designretning: TV Show | AI-agent (Kimi) | ✅ Bestemt |
| 23.10.2026 | Teknologistack: React+Vite+Tailwind | AI-agent (Kimi) | ✅ Bestemt |
| 23.10.2026 | Ingen backend i MVP | AI-agent (Kimi) | ✅ Bestemt |
| 23.10.2026 | Tastatur-input først | AI-agent (Kimi) | ✅ Bestemt |
| 23.10.2026 | Spillmotor i frontend | AI-agent (Kimi) | ✅ Bestemt |
| ?? | Backend-teknologi | Ukjent | ⏳ Ikke bestemt |
| ?? | Database-løsning | Ukjent | ⏳ Ikke bestemt |
| ?? | Kontroller-design | Ukjent | ⏳ Ikke bestemt |
| ?? | Spørsmålsgenerering | Ukjent | ⏳ Ikke bestemt |
| ?? | Lyd/lys-strategi | Ukjent | ⏳ Ikke bestemt |

---

## 4. Konsekvenser av beslutninger

### Kort sikt (MVP)
- ✅ Rask utvikling uten backend-kompleksitet
- ✅ Funksjonell prototype på < 1 uke
- ✅ Kan testes umiddelbart av brukere
- ⚠️ Begrenset data-persistens
- ⚠️ Ingen deling mellom enheter

### Medium sikt (Fase 2-3)
- 📋 localStorage for spørsmål og oppsett
- 📋 Import/eksport for deling
- 📋 Spillmotor ekstraheres til egen modul
- 📋 Backend vurderes ved behov for multiplayer

### Lang sikt (Fase 4+)
- 📋 FastAPI-backend hvis nettverk/multiplayer
- 📋 SQLite-database for spørsmålsbank
- 📋 Elektronikkintegrasjon med Pico 2
- 📋 Raspberry Pi-konsoll

---

## 5. Retningslinjer for fremtidige beslutninger

1. **Bevar modularitet:** Nye funksjoner skal ikke bryte eksisterende arkitektur
2. **TV-first:** Design- og UX-beslutninger prioriterer TV-opplevelse
3. **Offline-first:** Ingen funksjonalitet skal kreve internett
4. **KISS:** Velg den enkleste løsningen som fungerer
5. **Testbarhet:** Alle beslutninger skal gjøre systemet lettere å teste
6. **Dokumenter:** Alle viktige beslutninger loggføres her

---

*Sist oppdatert: 23. oktober 2026*
