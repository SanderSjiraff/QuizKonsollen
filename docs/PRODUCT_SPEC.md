# QuizKrets – Produktspesifikasjon

## Sammendrag

QuizKrets er en modulær quizplattform designet for sosial underholdning på TV eller stor skjerm. Systemet kombinerer en fleksibel spørsmålsbank med konfigurerbare spillmoduser og fremtidig støtte for fysiske kontrollere.

---

## 1. Visjon

QuizKrets skal være det mest fleksible og underholdende quizspillet for venner og familie. Brukerne skal kunne sette sammen sine egne quizer ved å kombinere temaer, vanskelighetsgrader og spillregler, uten å være begrenset til ferdiglagde quizer.

---

## 2. Målgruppe

- **Primær:** Grupper av venner og familie (4-8 personer) som samles for sosial underholdning
- **Sekundær:** Læringsmiljøer, bedriftsarrangementer, pub-quiz arrangører
- **Alder:** 12+, med spørsmål tilpasset ulike aldersgrupper

---

## 3. Nøkkelfunksjoner

### MVP (Fase 1)
- [x] Hovedmeny med navigasjon til alle funksjoner
- [x] Quizbygger med valg av:
  - [x] Flere temaer samtidig
  - [x] Vanskelighetsgrader
  - [x] Antall spørsmål (5-50)
  - [x] Spillmodus (klassisk, buzzer, lag)
  - [x] Tidsbegrensning per spørsmål
- [x] Spilloppsett med spilleradministrasjon
- [x] Lobby med spillerregistrering og klar-status
- [x] Spillvisning med:
  - [x] Store spørsmålstekster
  - [x] Tydelige svaralternativer (A/B/C/D)
  - [x] Synkende tidsur
  - [x] Poengoversikt
  - [x] Tilbakemelding på svar (riktig/feil)
- [x] Resultatskjerm med rangering og vinner
- [x] Spørsmålsbank med søk og filtrering
- [x] Tastaturnavigasjon (piltaster + Enter)
- [x] TV-optimalisert design (dark mode, stor tekst, høy kontrast)
- [x] Offline-funksjonalitet (ingen backend påkrevd i MVP)

### Fase 2
- [ ] Avansert quizbygger med:
  - [ ] Runder med forskjellige spillmoduser
  - [ ] Vekting mellom temaer
  - [ ] Bonuspoeng for raskt svar
- [ ] Lag-administrasjon
- [ ] Import/eksport av spørsmål (JSON/CSV)
- [ ] Lagring og lasting av quizoppsett
- [ ] Duplikatkontroll
- [ ] Flere spørsmålstyper (sant/usant, bilde-spørsmål)

### Fase 3
- [ ] Integrasjon med fysiske kontrollere (Pico 2)
- [ ] Buzzermoduser med rettferdighetshåndtering
- [ ] Spilllederkontroll
- [ ] Lyd og lyseffekter
- [ ] Raspberry Pi-kompatibilitet
- [ ] Statistikk og historikk

### Fase 4
- [ ] Trådløse kontrollere (ESP32)
- [ ] Flere språk
- [ ] AI-assistert spørsmålsgenerering
- [ ] Nettverks-deling av spørsmålspakker
- [ ] Avanserte spillmoduser (Jeopardy, kaosmodus)

---

## 4. Brukerreiser

### Brukerreise 1: Førstegangsbruker
1. Åpner QuizKrets
2. Klikker "Start spill" fra hovedmenyen
3. Velger temaer og vanskelighetsgrader i quizbyggeren
4. Fordeler spillerne farger og navn i lobbyen
5. Spiller gjennom quizen med store tydelige spørsmål
6. Ser resultater og feirer vinneren

### Brukerreise 2: Quiz-lager
1. Åpner "Spørsmålsbank"
2. Importerer egne spørsmål fra JSON
3. Kategoriserer og kvalitetssikrer spørsmålene
4. Lagrer et quizoppsett med egne spørsmål
5. Spiller quizen med venner

### Brukerreise 3: Administratoren
1. Konfigurerer systeminnstillinger
2. Administrerer spillerprofiler
3. Oppdaterer spørsmålsbanken
4. Konfigurerer fysiske kontrollere
5. Overvåker spillestatistikk

---

## 5. Ikke-funksjonelle krav

| Krav | Beskrivelse | Prioritet |
|------|-------------|-----------|
| Offline | Skal fungere uten internett | P0 |
| TV-vennlig | Lesbar på 3-5 meters avstand | P0 |
| Tastaturnavigasjon | Alt kan styres med tastatur | P0 |
| Responstid | < 100ms fra input til respons | P1 |
| Kontrast | WCAG AAA på alle viktige elementer | P0 |
| Ytelse | 60fps på alle animasjoner | P1 |
| Skalerbarhet | Støtte for 4-8 spillere i MVP | P0 |

---

## 6. Teknologi-stack (MVP)

| Lag | Teknologi | Begrunnelse |
|-----|-----------|-------------|
| Frontend | React 18 + TypeScript | Komponentbasert, typesikker |
| Byggverktøy | Vite | Rask bygging, moderne |
| Styling | Tailwind CSS + CSS-variabler | Fleksibelt, design tokens |
| Animasjoner | Framer Motion | React-native animasjoner |
| Ikoner | Lucide React | Konsistente SVG-ikoner |
| Testing | Vitest + Playwright | Enhetstester + E2E |

---

## 7. Avgrensninger (Out of scope for MVP)

- Backend/API-server (allespill er lokalt)
- Database (mock-data i MVP, localStorage senere)
- Fysiske kontrollere (fasade-planlagt, implementeres i Fase 3)
- Lyd/lyseffekter
- Nettverks-multiplayer
- Kontoer og innlogging
- AI-funksjoner
- Mobil-app

---

## 8. Åpne beslutninger

| Beslutning | Alternativer | Status |
|------------|--------------|--------|
| Backend (senere) | FastAPI, Node.js, eller ingen | Ikke bestemt |
| Database | SQLite, IndexedDB, localStorage | Ikke bestemt |
| Fysisk konsoll-design | Separate kontrollere vs innebygde | Ikke bestemt |
| Kontrollertype | Buzzer, A/B/C/D, eller hybrid | Ikke bestemt |
| Antall støttede spillere | 4, 6, eller 8 i ferdig produkt | Ikke bestemt |
