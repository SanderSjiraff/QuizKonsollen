# QuizKrets – Systemarkitektur

*Oppdatert: 25. oktober 2026 – gjenspeiler nå faktisk implementert kode.*

## 1. Overordnet arkitektur

QuizKrets følger en **modulær frontend-arkitektur** med streng separasjon mellom
ren logikk og UI:

1. **Ren logikk i `src/core/`** – testbar uten React, nettleser eller DOM
2. **Ett felles spørsmålslag (`src/data/questionStore.ts`)** – alle kilder møtes her
3. **Generisk inputgrensesnitt (`src/core/inputEvents.ts`)** – tastatur i dag, fysiske kontrollere senere
4. **Streng uttrekk uten fallback** – valgte kriterier ignoreres aldri

```
┌────────────────────────────────────────────────────────────────────┐
│                            React UI                                │
│   App.tsx (skjerm-wiring)  +  pages/  +  components/               │
└──────────────┬─────────────────────────────────┬───────────────────┘
               │ useGameEngine / useTimer         │ KeyboardDriver
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│  src/core/  (ren logikk, 0 React-avhengigheter)                    │
│  gameSession · questionSelector · scoring · categories             │
│  inputEvents (hub) · questionValidation                            │
└──────────────┬─────────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────────┐
│  src/data/                                                         │
│  questionStore (bank + CRUD + migrering)                           │
│  adapters/ (OpenTDB, The Trivia API)                               │
│  quizHistory · mockData (frøbank ~50 norske spørsmål)               │
└──────────────┬─────────────────────────────────────────────────────┘
               │
               ▼
        localStorage (begrunnelse i questionStore.ts)
```

---

## 2. Modulinndeling (faktisk struktur)

```
quizkrets/
├── src/
│   ├── core/                  # Ren logikk – testes uten React
│   │   ├── categories.ts      # Hierarkisk kategorimodell + expandSelection
│   │   ├── scoring.ts         # ScoreConfig (poeng) adskilt fra statistikk
│   │   ├── questionSelector.ts# Streng uttrekk, Fisher–Yates, gjenbruks-støtte
│   │   ├── gameSession.ts     # Spillsesjon: svar, poeng, fullføring, stats
│   │   ├── inputEvents.ts     # InputEvent-hub: PLAYER_BUZZ/ANSWER/READY,
│   │   │                      #   NEXT_QUESTION, PAUSE_GAME
│   │   ├── questionValidation.ts # Sentral validering av Question-objekter
│   │   └── __tests__/         # 55 enhetstester
│   │
│   ├── data/
│   │   ├── questionStore.ts   # Felles spørsmålslag: bank, CRUD, søk, filtre,
│   │   │                      #   duplikatkontroll, stabil ID, migrering
│   │   ├── adapters/          # Leverandør-adaptere (felles grensesnitt)
│   │   │   ├── types.ts       # QuestionSourceAdapter-grensesnitt
│   │   │   ├── openTdbAdapter.ts   # otdb-<FNV-1a>-IDer
│   │   │   └── triviaApiAdapter.ts # tapi-<API-id>, The Trivia API v2
│   │   ├── quizHistory.ts     # Persistens av spilte runder
│   │   ├── mockData.ts        # Frøspørsmål, PLAYER_COLORS, SAMPLE_PRESETS
│   │   └── __tests__/         # 22 enhetstester
│   │
│   ├── hooks/
│   │   ├── useGameEngine.ts   # GameConfig, startGame({configUpdates}),
│   │   │                      #   SelectionError-håndtering
│   │   └── useTimer.ts        # Timestamp-basert nedtelling
│   │
│   ├── components/
│   │   └── SelectionErrorDialog.tsx  # Valgdialog ved for få spørsmål
│   │
│   ├── pages/                 # Skjermer (App.tsx styrer navigering)
│   │   ├── MainMenu.tsx, GameSetup.tsx, QuizBuilder.tsx, Lobby.tsx
│   │   ├── GamePlay.tsx, Results.tsx, Scoreboard.tsx
│   │   ├── QuestionBank.tsx, ImportQuestions.tsx, FetchFromAPI.tsx
│   │   └── QuestionIdeas.tsx
│   │
│   └── types/index.ts          # Question, GameConfig, AnswerRecord,
│                               # PlayerStats, SelectionError, m.fl.
│
├── tests/                      # Playwright E2E
│   ├── quizkrets.spec.ts       # 14 flyttester (baseURL fra config)
│   └── screenshots.spec.ts     # 10 skjermbilder (TV + mobil)
│
└── playwright.config.ts        # TEST_PORT / TEST_BASE_URL, strictPort
```

---

## 3. Datamodell

### Spørsmål (Question)

```typescript
interface Question {
  id: string;                     // Stabil ID – aldri kun Date.now()
  text: string;
  type: 'multiple_choice' | 'true_false';
  difficulty: 'lett' | 'middels' | 'vanskelig';
  categories: string[];          // Kategori-IDer, f.eks. ['sport', 'vintersport']
  choices: { id: string; text: string }[];
  correctChoiceIds: string[];
  explanation?: string;
  sourceRef?: {                  // Kildehenvisning (lisenskrav)
    name: string;
    url: string | null;
    license?: string;
  };
  needsReview?: boolean;         // Ukjent kategori fra import → flagges
  imported?: boolean;
}

### Stabile IDer
- Frøbank:        manuelt (q1, q2, ...)
- Open Trivia DB: `otdb-<FNV-1a hash>` over normalisert spørsmålstekst
- The Trivia API: `tapi-<API-ens id>`
- Manuelle/import: `q-<UUID>` – duplikatsjekk på normalisert tekst + innholdshash
```

### Spillkonfigurasjon (GameConfig)

```typescript
interface GameConfig {
  selectedCategories: string[];   // Valgte temaer (hoved +/eller under)
  selectedDifficulties: Difficulty[];
  questionCount: number;          // Ønsket antall – aldri overskrevet stille
  gameMode: 'classic' | 'buzzer' | 'team';
  timePerQuestion: number;       // Sekunder – fra quizconfig, ikke hardkodet
  allowReuse: boolean;            // Tillat gjenbruk av brukte spørsmål
  speedBonus: boolean;            // Valgfri bonus som avtar lineært mot 0
  players: Player[];
}
```

### Svar (AnswerRecord) og statistikk (PlayerStats)

```typescript
interface AnswerRecord {
  questionId: string;
  playerId: number;
  choiceId: string | null;        // null = ubesvart
  isCorrect: boolean;
  timeTakenMs: number;
  timedOut: boolean;              // true = tiden løp ut
  timestamp: number;
}

interface PlayerStats {
  playerId: number;
  points: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracyPct: number;            // treffprosent (ubesvart teller mot)
  avgTimeMs: number;              // bare besvarte teller
}
```

**Duplikatbeskyttelse:** `gameSession.registerAnswer` nekter å registrere to
svar fra samme spiller på samme spørsmål – uansett hvor hendelsen kommer fra
(dobbeltklikk, tast + kontroller, race conditions).

### Uttrekksfeil (SelectionError)

```typescript
interface SelectionError {
  requested: number;
  available: number;          // Ubrukte spørsmål som passer valgene
  missing: number;
  availableWithReuse: number; // Inkl. bruke spørsmål
}
```

Motoren returnerer **aldri** færre spørsmål enn bedt om i stillhet. UI viser
`SelectionErrorDialog` med konkrete valg: reduser antall, hent flere fra
nettet, tillat gjenbruk (der aktuelt), eller avbryt.

---

## 4. Kategorisystem (hierarkisk)

- Flate, stabile IDer i kebab-case med valgfri `parentId`
- Étt spørsmål kan ha flere kategorier (hoved + underkategorier)
- `expandSelection(ids)`: valg av hovedkategori matcher alle underkategorier
- Valg av underkategori viser den som sin naturlige del av forelderen
- Adaptere bruker en **sentral migreringsmap** (leverandørkategori → vår ID)
- Ukjent leverandørkategori → `til-gjennomgang` + `needsReview: true` – aldri
  vilkårlig plassering. Ukjente *tags* hos The Trivia API droppes.

9 hovedkategorier: generell-kunnskap, historie, vitenskap, teknologi,
underholdning, sport, geografi, samfunn-og-kultur, natur-og-dyr.

---

## 5. Dataflyt

```
 Kilder                          questionStore                Spill
┌──────────────┐                ┌──────────────┐   ┌───────────────────┐
│ mockData     │──seed────────► │              │   │ QuizBuilder/Setup │──┐
│ (frøbank)    │                │  spørsmåls-  │   └───────────────────┘  │
├──────────────┤                │    bank      │◄──├ tilgjengelighet     │
│ OpenTDB      │──adapter─────► │  (localStorage)│                       ▼
│ Trivia API   │                │  CRUD/søk    │   questionSelector (streng,
├──────────────┤                │  duplikat-   │   Fisher–Yates, excludeIds)
│ JSON/CSV-    │──validering──► │  kontroll    │                       │
│ import       │  per spørsmål  └──────────────┘                       ▼
└──────────────┘                            gameSession (svar, poeng,
                                             stats, historikk)
```

1. **Init:** `initQuestionBank` migrerer legacy-nøkler én gang (nøkkel
   `quizkrets_question_bank_migrated_v1` gjør den idempotent – viktig for
   testisolering) og seer frøbanken.
2. **Utvalg:** `questionSelector.select` filtrerer på kategorier + vanskelighet,
   ekskluderer brukte IDer (`quizkrets_used_question_ids`), stokker med
   Fisher–Yates og trekker n. For få treff → `SelectionError`, aldri fallback.
3. **Spill:** `useGameEngine.startGame({ configUpdates })` anvender
   config-endringer **før** uttrekket (fiks for stale-closure der gammel
   config ble brukt).
4. **Statistikk:** hver `AnswerRecord` fødes til `gameSession`; ved quizens slutt
   produseres `PlayerStats` (riktig/feil/ubesvart/treff%/svartid) som Results
   viser, inkludert gjennomgang av hvert spørsmål med fasit.
5. **Historikk:** ferdig spilt runde lagres via `quizHistory` med faktiske data
   (navn, spillere, poeng, spørsmålsantall, varighet) – Poengtavlen leser herfra.

### localStorage-nøkler

| Nøkkel | Innhold |
|---|---|
| `quizkrets_question_bank_v1` | Hele spørsmålsbanken |
| `quizkrets_question_bank_migrated_v1` | Migreringsflagg (idempotent init) |
| `quizkrets_used_question_ids` | Brukte spørsmål (gjenbruksbeslutning) |
| `quizkrets_history` | Spilte runder med resultater |
| `quizkrets_saved_quizzes` | Lagrede quizoppsett |

Legacy-nøkler `quizkrets_otdb_cache` og `quizkrets_imported_questions`
migreres og fjernes ved init. **Begrunnelse for localStorage** (dokumentert i
questionStore.ts): banken er < 2000 spørsmål ≈ 1–2 MB, synkront API gir enkel
kode og tester; SQLite vurderes i Raspberry Pi-fasen, IndexedDB ble valgt bort
(asynkron kompleksitet uten gevinst).

---

## 6. Spillmoduser (én skjerm – alle faser)

| Modus | Flyt |
|---|---|
| **Klassisk** | Hot-seat: alle spillere svarer per spørsmål ( aktiv spiller roterer ), fasit vises når alle har svart eller tiden utløper |
| **Buzzer** (>1 spiller) | Buzz-fase: tast 1–8 buzz; første spiller låser svaret og svarer A–D; de andre får ubesvart |
| **Team** | Auto-inndeling i 2 lag; poeng aggregeres i Results |

### Faser i GamePlay
`answering` → `revealed` → (neste) ... og `buzzing` → `answering` → `revealed`
i buzzer-modus. Timer er timestamp-basert (immune mot suspenderingsskjevhet),
og `timeoutFiredRef` beskytter mot doble timeout-hendelser.

### Poeng (ScoreConfig) vs. statistikk
- `ScoreConfig`: pointsPerCorrect, valgfri speed-bonus (lineær mot 0)
- Statistikk lages uavhengig av poengsettings – treff% påvirkes aldri av bonus

---

## 7. Input-abstraksjon (klarfremtidig elektronikk)

Alle inputkilder normaliseres til **samme hendelser**:

```typescript
type InputEvent =
  | { type: 'PLAYER_BUZZ';    playerId: number }
  | { type: 'PLAYER_ANSWER'; playerId: number; choiceId: string }
  | { type: 'PLAYER_READY';  playerId: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PAUSE_GAME' };

// KeyboardDriver (i dag): tast 1–4 = svar A–D, tast 1–8 = buzz,
// mellomrom = neste, P = pause. En fremtidig PicoSerialAdapter sender
// identiske hendelser – GamePlay og spillmotor endres ikke.
```

---

## 8. Leverandør-adaptere

| | Open Trivia DB | The Trivia API |
|---|---|---|
| Endpoint | `api.opentdb.com` | `the-trivia-api.com/v2/questions` |
| Rate limit | 1 kall/5 s per IP (klienten venter 5500 ms) | 20 kall/5 s, maks 50 spørsmål/kall |
| IDer | `otdb-<FNV-1a>` over normalisert tekst | `tapi-<API-id>` |
| Sant/usann | Støttes | Støttes ikke – adapter avviser med norsk feilmelding |
| Lisens | Fri bruk | **CC BY-NC 4.0** – ikke-kommersiell; kildehenvisning vises i UI og lagres i `sourceRef` |

Begge implementerer `QuestionSourceAdapter`-grensesnittet; nye kilder legges
til uten berøring av spilllogikk.

---

## 9. Teststrategi og resultater (per 25.10.2026)

| Testlag | Verktøy | Omfang | Resultat |
|---|---|---|---|
| Enhetstester (ren logikk) | Vitest | 7 filer, 77 tester: kategorier, scoring, uttrekk, sesjon, validering, questionStore, adaptere | ✅ 77/77 |
| E2E flyttester | Playwright | 14 tester: full spillflyt, gjennomgang, spill igjen, historikk, tastatur (1–4 + mellomrom), buzzer, uttrekksdialog, QuestionBank CRUD, duplikatkontroll | ✅ 14/14 |
| Visuelle skjermbilder | Playwright | 10 skjermer: hovedmeny, quizbygger, oppsett, bank, spill (2), resultater, TV 1920×1080/1280×720, mobil 390×844 | ✅ 10/10 |
| Produksjonsbygg | `tsc && vite build` | Typesjekk + Vite | ✅ 0 feil |

**Playwright-konfigurasjon:** port og baseURL styres med miljøvariabler
(`TEST_PORT`, `TEST_BASE_URL`) – ingen hardkodede URL-er i tester; dev-server
startes med `--strictPort` slik at en kollisjon feiler tydelig i stedet for å
gjenbruke feil server (`reuseExistingServer` lokalt).

Kjøring:
```bash
npm test          # vitest run (enhetstester)
npm run test:watch
npm run test:e2e  # playwright ( setter evt. TEST_PORT )
npm run build     # tsc && vite build
```

---

## 10. Fremtidig arkitektur (post-MVP)

Uendret fra tidligere plan: FastAPI/SQLite vurderes når banken blir stor,
flere enheter skal dele quiz, eller statistikk krever dypere persistens.
Input-huben i `src/core/inputEvents.ts` er allerede klar for
`PicoSerialAdapter` (fase 5) uten endringer i spillmotoren.
