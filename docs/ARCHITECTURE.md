# QuizKrets – Systemarkitektur

## 1. Overordnet arkitektur

QuizKrets følger en **modulær frontend-first arkitektur** med tydelig separasjon av ansvar.

### Arkitekturprinsipper

1. **Spillmotor (state machine) er uavhengig av UI** – samme motor kan kjøre ulike grensesnitt
2. **Kontrollerabstraksjon** – fysisk input oversettes til generiske hendelser
3. **Modulær quizbygger** – spørsmål er ikke bundet til spesifikke quizer
4. **Offline-first** – ingen ekstern avhengighet i kjernefunksjonalitet

### Foreløpig arkitektur (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                    React + TypeScript                        │
│                      (Frontend)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 🎮 UI-kompo-│  │ ⚙️  State   │  │ 🔄 Spill-   │      │
│  │   nenter    │  │   hooks     │  │   motor     │      │
│  │             │  │             │  │             │      │
│  │ MainMenu    │  │useGameEngine│  │ GameConfig  │      │
│  │ QuizBuilder │  │useTimer     │  │ Question    │      │
│  │ Lobby       │  │useKeyboard  │  │ Player      │      │
│  │ GamePlay    │  │             │  │ Score calc  │      │
│  │ Results     │  │             │  │             │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                 │             │
│           └─────────────────┼─────────────────┘             │
│                             ▼                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Mock-data / localStorage               │      │
│  │  (spørsmål, spillere, oppsett, resultater)      │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  🎮 Fysiske knapper │
                    │  (fremtidig fase)   │
                    │  → Tastatur-emul.   │
                    └─────────────────────┘
```

---

## 2. Modulinndeling

### Pakkestruktur (MVP)

```
quizkrets/
├── src/
│   ├── components/          # Gjenbrukbare UI-komponenter
│   │   ├── Layout.tsx       # App-layout wrapper
│   │   ├── Button.tsx       # Knappekomponenter
│   │   ├── Card.tsx         # Kort-komponenter
│   │   ├── Timer.tsx        # Tidsur-komponent
│   │   └── ...
│   │
│   ├── pages/               # Skjermer/views
│   │   ├── MainMenu.tsx     # Hovedmeny
│   │   ├── QuizBuilder.tsx  # Quizbygger
│   │   ├── Lobby.tsx        # Spillerlobby
│   │   ├── GamePlay.tsx     # Spillvisning
│   │   ├── Results.tsx      # Resultatskjerm
│   │   ├── QuestionBank.tsx # Spørsmålsbank
│   │   └── Settings.tsx     # Innstillinger (planlagt)
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameEngine.ts # Sentral spilltilstand
│   │   ├── useTimer.ts      # Tidsur-hook
│   │   ├── useKeyboardNav.ts # Tastaturnavigasjon
│   │   └── ...
│   │
│   ├── data/                # Data og mock-data
│   │   ├── mockData.ts      # Spørsmål, kategorier, presets
│   │   └── localStorage.ts  # Persistens (senere)
│   │
│   ├── types/               # TypeScript-typer
│   │   └── index.ts         # Alle typer
│   │
│   ├── utils/               # Hjelpefunksjoner
│   │   ├── scoring.ts       # Poengberegning
│   │   ├── validation.ts    # Input-validering
│   │   └── shuffle.ts       # Tilfeldig stokking
│   │
│   ├── styles/              # Styling
│   │   ├── index.css        # Tailwind + custom CSS
│   │   └── animations.css   # Animasjoner
│   │
│   └── App.tsx              # Hovedkomponent med routing
│
├── public/                  # Statiske filer
├── tests/                   # Tester
├── docs/                    # Dokumentasjon
└── package.json
```

---

## 3. Datamodell

### Spørsmål (Question)

```typescript
interface Question {
  id: string;                    // Unik ID
  text: string;                  // Spørsmålstekst
  type: 'multiple_choice' | 'buzzer' | 'true_false';
  difficulty: 'lett' | 'middels' | 'vanskelig';
  categories: string[];          // Kategori-IDer
  tags: string[];               // Søkbare tags
  choices: {                    // Svaralternativer
    id: string;
    text: string;
  }[];
  correctChoiceIds: string[];   // Riktige svar (støtter fler)
  explanation?: string;         // Forklaring (vises etter svar)
  source?: {                    // Kildeinfo
    name: string;
    url: string | null;
  };
  status: 'draft' | 'approved' | 'rejected';
  language: string;             // 'no', 'en', etc.
}
```

### Spiller (Player)

```typescript
interface Player {
  id: number;                   // Unik spiller-ID
  name: string;                 // Visningsnavn
  color: string;                // HEX-farge
  score: number;                // Nåværende poeng
  isReady: boolean;             // Lobby-status
  teamId?: number;              // Referanse til lag
}
```

### Spillkonfigurasjon (GameConfig)

```typescript
interface GameConfig {
  selectedCategories: string[];          // Valgte temaer
  selectedDifficulties: string[];        // Valgte vanskelighetsgrader
  questionCount: number;                 // Antall spørsmål
  gameMode: 'classic' | 'buzzer' | 'team';
  timePerQuestion: number;               // Sekunder
  players: Player[];                     // Spiller-liste
}
```

### Spilltilstand (GameState)

```typescript
interface GameState {
  screen: Screen;              // Nåværende skjerm
  players: Player[];
  currentRound: number;
  currentQuestion: number;
  questions: Question[];
  scores: Record<number, number>;
  answers: AnswerRecord[];
  isPaused: boolean;
  timeRemaining: number;
  gameMode: GameMode;
}
```

### Quizoppsett (QuizPreset)

```typescript
interface QuizPreset {
  id: string;
  name: string;
  categories: string[];
  difficulties: Difficulty[];
  questionCount: number;
  categoryWeights: Record<string, number>;
  rounds: GameRound[];
}
```

---

## 4. Spillmotor (State Machine)

### Spilltilstander

```
                          ┌─────────────► PAUSED
                          │                (pause)
                          │                   │
                          │              ┌────┴────┐
                          │              │ RESUME  │
                          │              └────┬────┘
                          │                   ▼
┌─────────┐   ┌───────┐   │   ┌──────────┐  ┌─────────────┐
│  MENY   │──►│ LOBBY │───┴──►│ QUESTION │─►│  ANSWERING  │
└─────────┘   └───────┘       │_VISIBLE   │  │             │
                              └─────┬─────┘  └──────┬──────┘
                                    │               │
                                    │         ┌─────┴──────┐
                                    │         │ TIMEOUT    │
                                    │         └─────┬──────┘
                                    │               │
                                    │         ┌─────┴──────┐
                                    │         │   REVEAL   │
                                    │         │  (riktig   │
                                    │         │   svar)    │
                                    │         └─────┬──────┘
                                    │               │
                                    ▼               ▼
                              ┌──────────┐    ┌──────────┐
                              │ ROUND_END│    │ QUESTION │
                              │          │    │  NEXT    │
                              └────┬─────┘    └────┬─────┘
                                   │               │
                          ┌────────▼───────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  GAME_END    │
                   │  (resultater)│
                   └──────────────┘
```

### Hendelser (Events)

| Hendelse | Kilde | Beskrivelse |
|----------|-------|-------------|
| `GAME_START` | UI | Start spillet fra lobby |
| `PLAYER_READY` | UI / Kontroller | Spiller markerer seg klar |
| `QUESTION_SHOWN` | Timer | Spørsmål vises, buzzer aktiveres |
| `PLAYER_BUZZ` | Kontroller / Tastatur | Spiller trykker på knapp |
| `ANSWER_CHOICE` | UI / Kontroller | Spiller velger svar A/B/C/D |
| `TIME_EXPIRED` | Timer | Tidsgrensen nådd |
| `HOST_ACCEPT` | UI / Kontroller | Spillleder godkjenner svar |
| `HOST_REJECT` | UI / Kontroller | Spillleder avviser svar |
| `NEXT_QUESTION` | UI | Gå til neste spørsmål |
| `PAUSE_GAME` | UI / Kontroller | Sett spill på pause |
| `RESUME_GAME` | UI / Kontroller | Fortsett spill |
| `GAME_QUIT` | UI | Avslutt spill |

---

## 5. Kontrollerabstraksjon

### Konsept

Spillmotoren skal ikke vite om fysisk maskinvare. All input normaliseres til generiske hendelser.

```
Fysisk enhet                 Adapter                    Spillmotor
┌──────────┐                ┌──────────┐              ┌──────────┐
│ Tastatur │──key press───►│          │──► PLAYER  │──► Regler  │
│ (key A)  │                │ Input    │    BUZZ    │    / Poeng │
└──────────┘                │ Normalizer               │            │
                            │          │              └──────────┘
┌──────────┐                │          │
│ Pico 2   │──serial msg──►│          │
│ btn #1   │                └──────────┘
└──────────┘

┌──────────┐
│ USB      │──HID event──►
│ Gamepad  │
└──────────┘
```

### Input-hendelser (standardisert format)

```typescript
interface InputEvent {
  type: 'PLAYER_BUZZ' | 'ANSWER_CHOICE' | 'PLAYER_READY' 
       | 'NEXT_QUESTION' | 'PAUSE_GAME' | 'CONFIRM_ANSWER';
  playerId: number;
  payload?: {
    choiceId?: string;
    timestamp?: number;
  };
}
```

### Adapter-grensesnitt (fremtidig)

```typescript
interface InputAdapter {
  connect(): Promise<void>;
  disconnect(): void;
  onEvent(callback: (event: InputEvent) => void): void;
  getDeviceInfo(): DeviceInfo;
}

// Implementasjoner:
// - KeyboardAdapter (nåværende)
// - PicoSerialAdapter (fase 3)
// - GamepadAdapter (fase 4)
// - WebSocketAdapter (fase 5)
```

---

## 6. Spillmodusarkitektur

### Modus-grensesnitt

```typescript
interface GameModeConfig {
  id: string;
  name: string;
  description: string;
  supportedQuestionTypes: QuestionType[];
  requiredInputCapabilities: InputCapability[];
  rules: GameRules;
  scoring: ScoringConfig;
}

interface GameRules {
  allowsMultipleAnswers: boolean;
  hasTimeLimit: boolean;
  allowsRetries: boolean;
  revealsCorrectAnswer: boolean;
  teamMode: boolean;
}

interface ScoringConfig {
  pointsPerCorrect: number;
  pointsPerWrong: number;
  bonusForSpeed?: boolean;
  speedBonusMax?: number;
  speedBonusWindow?: number; // sekunder
}
```

### Modus-prioritering (MVP → Fremtid)

| Fase | Modus | Beskrivelse |
|------|-------|-------------|
| MVP | **Klassisk** | Alle svarer, poeng for riktig |
| MVP | **Buzzer** | Første til å trykke får svare |
| Fase 2 | **Lag** | Lagkonkurranse med felles poeng |
| Fase 3 | **Speedrun** | Flest riktige på tid |
| Fase 3 | **Jeopardy** | Kategori × poengverdi-brett |
| Fase 4 | **Kombinasjon** | Blandede runder i samme quiz |

---

## 7. Bygge- og deploy-rutine

### Lokal utvikling

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver
npm run dev

# Åpne http://localhost:3000
```

### Bygg for produksjon

```bash
# Bygg
npm run build

# Output: dist/ (statiske filer)
# Kan serves med:
# - Python: python -m http.server 8080
# - Node: npx serve dist
# - Nginx: cp -r dist/* /var/www/html/
```

---

## 8. Fremtidig arkitektur (post-MVP)

### Utvidet arkitektur med backend

```
┌─────────────────────────────────────────────────────────────────────┐
│                          React + TypeScript                         │
│                            (Frontend)                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP / WebSocket
                    ┌───────────▼───────────┐
                    │   FastAPI (Python)     │
                    │   REST API             │
                    └───────────┬───────────┘
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐      ┌────────────────┐     ┌─────────────────┐
│  Spillmotor   │      │  Quizbygger     │     │   Kontroller    │
│  (Python)     │      │  (spørringer)   │     │   Adapter       │
└──────────────┘      └────────┬───────┘     └─────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     SQLite          │
                    │  Spørsmålsbank      │
                    └─────────────────────┘
```

### Når backend trengs

Backend introduseres først når:
1. Spørsmålsbanken blir for stor for frontend-minne
2. Flere enheter skal dele samme quiz (nettverk)
3. Statistikk og historikk krever persistens
4. AI-assistert spørsmålsgenerering implementeres
5. Import/eksport av store datasett

---

## 9. Teststrategi

### Enhetstester (Vitest)
- Poengberegning
- Spørsmålsfiltrering
- Tilstandsoverganger
- Input-normalisering

### Integrasjonstester (Vitest)
- Quizbygger → Spillmotor
- Spillmotor → UI-oppdateringer
- Timer → Spilltilstand

### E2E-tester (Playwright)
- Komplett spillflyt
- Tastaturnavigasjon
- TV-simulering (stor skjerm)
- Responsivt design

### Visuelle tester (Playwright screenshots)
- Alle skjermer ved 1920×1080
- Alle skjermer ved 1280×720
- Kontrast og lesbarhet
