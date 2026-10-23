# QuizKrets – Brukerreiser og Navigasjon

## 1. Oversikt over alle skjermer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NAVIGASJONSFLYT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐                                                          │
│   │ HOVEDMENY    │◄────────────────────────────────────────────────┐       │
│   │  - Start     │                                                 │       │
│   │  - Bygg      │                                                 │       │
│   │  - Bank      │                                                 │       │
│   │  - Innst.    │                                                 │       │
│   └──────┬───────┘                                                 │       │
│          │                                                         │       │
│     ┌────┴────┬────────────┬─────────────────────┐                 │       │
│     ▼         ▼            ▼                     ▼                 │       │
│ ┌────────┐ ┌────────┐ ┌────────────┐      ┌──────────┐            │       │
│ │Quiz-  │ │Spill-  │ │Lagrede     │      │Innstill. │            │       │
│ │bygger │ │oppsett │ │quizer      │      │          │            │       │
│ └───┬────┘ └────┬───┘ └────────────┘      └──────────┘            │       │
│     │           │                                                  │       │
│     ▼           ▼                                                  │       │
│ ┌────────┐ ┌────────┐                                              │       │
│ │ LOBBY  │ │ LOBBY  │                                              │       │
│ │(Bygg)  │ │(Oppset)│                                              │       │
│ └───┬────┘ └───┬────┘                                              │       │
│     │          │                                                     │       │
│     └────┬─────┘                                                     │       │
│          ▼                                                          │       │
│   ┌──────────────┐                                                  │       │
│   │  SPILLVISNING │                                                  │       │
│   │  - Spørsmål   │                                                  │       │
│   │  - Svar       │                                                  │       │
│   │  - Timer      │                                                  │       │
│   │  - Poeng      │                                                  │       │
│   └──────┬───────┘                                                  │       │
│          │                                                           │       │
│          ▼                                                           │       │
│   ┌──────────────┐                                                   │       │
│   │  RESULTATER  │───────────────────────────────────────────────────┘       │
│   │  - Rangering │                                                          │
│   │  - Podium    │                                                          │
│   │  - Nytt spill│                                                          │
│   └──────────────┘                                                          │
│                                                                             │
│   ┌──────────────┐                                                          │
│   │SPØRSMÅLSBANK │◄─────────────────────────────────────────────────────┐   │
│   │  - Søk       │                                                      │   │
│   │  - Filtrer   │                                                      │   │
│   │  - Rediger   │                                                      │   │
│   └──────────────┘                                                      │   │
│                                                                         │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detaljerte brukerflyter

### Flyt 1: Starte et standardspill (happy path)

**Skjerm 1: Hovedmeny**
- Bruker ser stor "QuizKrets"-logo med glødende gull-tekst
- 5 store kort: Start spill, Bygg quiz, Spørsmålsbank, Lagrede quizer, Innstillinger
- **Aksjon:** Klikker "Start spill"

**Skjerm 2: Quizbygger**
- Seksjoner: Forhåndsinnstillinger, Temaer, Vanskelighetsgrader, Antall, Modus, Tid
- Bruker velger: Historie + Sport + Teknologi, Lett + Middels, 15 spørsmål, Klassisk, 20s
- **Aksjon:** Klikker "Bekreft og fortsett"

**Skjerm 3: Lobby**
- 4 spiller-bokser med fargekodede sirkler
- Hver spiller kan:
  - Bytte farge (klikk på fargesirkel)
  - Endre navn (tekstfelt)
  - Markere seg som klar (knapp)
- Spillleder ser status for alle (ikke klar / klar)
- **Aksjon:** Alle markerer seg som klar, spillleder klikker "Start spillet!"

**Skjerm 4: Spillvisning (gjentas for hvert spørsmål)**
- Progresjonsbar øverst
- Tidsur (nedtelling)
- Spørsmålstekst i stor font (52px+)
- 4 svaralternativer som store kort med bokstaver (A, B, C, D)
- Når brukeren velger:
  - Valgt svar markeres
  - Alle deaktiveres
  - Riktig svar fremheves i grønt
  - Feil fremheves i rødt
  - Timer stopper
  - Poeng oppdateres
  - "Neste spørsmål"-knapp vises
- **Aksjon:** Velger svar, klikker "Neste"

**Skjerm 5: Resultatskjerm**
- Stor tittel "Resultater" med pokal-ikon
- Vinner med glødende fargekodet sirkel og poeng
- Rangering med horisontale søyler (progress bars)
- Knapper: "Spill igjen", "Hovedmeny"
- **Aksjon:** Velger "Spill igjen" eller "Hovedmeny"

---

### Flyt 2: Administrere spørsmålsbanken

**Skjerm 1: Hovedmeny**
- **Aksjon:** Klikker "Spørsmålsbank"

**Skjerm 2: Spørsmålsbank**
- Søkefelt øverst
- Filter-knapper for kategorier
- Liste over alle spørsmål med:
  - Kategoritagger
  - Vanskelighetsgrad-badge
  - Spørsmålstekst
  - Svaralternativer (riktig markert i grønt)
  - Rediger/slett-knapper
- **Aksjon:** Bruker kan søke, filtrere, redigere, slette

---

### Flyt 3: Konfigurere innstillinger

**Skjerm 1: Hovedmeny**
- **Aksjon:** Klikker "Innstillinger"

**Skjerm 2: Innstillinger (planlagt)**
- Lyd: av/på
- Animasjoner: av/på
- Språk: Norsk / English
- Spillere: standard antall
- Tastatur-mapping for kontrollere
- **Aksjon:** Endrer innstillinger, klikker "Lagre"

---

### Flyt 4: Bruke tastaturnavigasjon

- **Alt + Tab:** Naviger mellom elementer
- **Piltaster:** Naviger i grid/rad
- **Enter/Space:** Velg / Klikk
- **Escape:** Gå tilbake / Avbryt
- **1-4:** Raske svar i spillmodus

---

## 3. Tilstandsmaskin for spillflyt

```
                    ┌─────────────┐
                    │   MENY      │
                    │ (idle)      │
                    └──────┬──────┘
                           │ "Start spill"
                           ▼
                    ┌─────────────┐
                    │  QUIZ-BY    │
                    │  GGER       │
                    │ (config)    │
                    └──────┬──────┘
                           │ "Bekreft"
                           ▼
                    ┌─────────────┐
                    │   LOBBY     │
                    │ (lobby)     │
                    └──────┬──────┘
                           │ "Alle klare, start"
                           ▼
                    ┌─────────────┐     ┌───────────┐
                    │   SPILL     │◄────│ "Neste    │
                    │ (playing)   │     │ spørsmål" │
                    └──────┬──────┘     └───────────┘
                           │ Alle spørsmål besvart
                           ▼
                    ┌─────────────┐      ┌─────────┐
                    │  RESULTATER │─────►│  MENY   │
                    │ (results)   │      │ (tilb.) │
                    └──────┬──────┘      └─────────┘
                           │ "Spill igjen"
                           ▼
                    ┌─────────────┐
                    │   LOBBY     │
                    │ (ny lobby)  │
                    └─────────────┘
```

---

## 4. Designprinsipper for navigasjon

1. **Tydelig tilbakemelding:** Brukeren skal alltid vite hvor de er
2. **Konsistente mønstre:** Samme navigasjon på tvers av skjermer
3. **Minimale klikk:** Maks 3 klikk fra meny til spill
4. **Tastaturstøtte:** Alt kan gjøres med tastatur
5. **Store klikkområder:** Minimum 44×44px, helst større for TV
6. **Åpen barrierefrihet:** WCAG AAA-kontrast, ARIA-labels, fokusindikatorer
