# QuizKrets – Brukerreiser og Navigasjon

*Oppdatert: 25. oktober 2026 – gjenspeiler faktiske skjermer og tekster.*

## 1. Oversikt over alle skjermer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NAVIGASJONSFLYT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐                                                      │
│   │ HOVEDMENY        │◄──────────────────────────────────────────┐         │
│   │  Primært:        │                                                 │         │
│   │   Start spill    │                                                 │         │
│   │   Bygg quiz      │                                                 │         │
│   │   Spørsmålsbank  │                                                 │         │
│   │  Sekundært:      │                                                 │         │
│   │   Lagrede quizer │                                                 │         │
│   │   Poengtavle     │                                                 │         │
│   │   Hent fra nettet│                                                 │         │
│   │   Spørsmålsideer │                                                 │         │
│   └──┬──────┬─────┬───┘                                                 │         │
│      │      │     │                                                     │         │
│      ▼      │     ▼                                                     │         │
│  ┌──────────┐│  ┌──────────────┐   ┌──────────────┐                    │         │
│  │SPILL-    ││  │SPØRSMÅLSBANK │   │HENT FRA      │                    │         │
│  │OPPSETT   ││  │- søk/filtre  │   │NETTET        │                    │         │
│  │(Tilfeldig││  │- CRUD        │   │(OpenTDB +    │                    │         │
│  │ quiz +   ││  │- import      │   │ The Trivia   │                    │         │
│  │ quizkort)││  └──────────────┘   │ API)         │                    │         │
│  └────┬─────┘│                     └──────────────┘                    │         │
│       │      ▼                                                          │         │
│       │  ┌──────────┐                                                    │         │
│       └─►│LOBBY     │                                                    │         │
│          └────┬─────┘                                                    │         │
│               │ "Start spillet!"                                         │         │
│               ▼                                                          │         │
│        ┌──────────────┐    mellomrom    ┌────────────┐                  │         │
│        │SPILLVISNING  │◄────────────────│ Neste     │                  │         │
│        │answering/    │───────────────► │ spørsmål  │                  │         │
│        │buzzing/      │                 └────────────┘                  │         │
│        │revealed      │                                                  │         │
│        └──────┬───────┘                                                  │         │
│               │ siste spørsmål ferdig                                    │         │
│               ▼                                                          │         │
│        ┌──────────────┐  "Spill igjen" → LOBBY   "Hovedmeny" ────────────┘         │
│        │  RESULTATER  │                                                          │
│        │  + statistikk│                                                          │
│        │  + gjennomg. │                                                          │
│        └──────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Alle flyter kan nå med maks 2 klikk fra hovedmenyen, og alt kan gjøres med
tastatur.**

---

## 2. Detaljerte brukerflyter

### Flyt 1: Starte et spill (happy path)

**Skjerm 1: Hovedmeny**
- Stor "QuizKrets"-logo med glød, tre primærkort (Start spill, Bygg quiz,
  Spørsmålsbank) og fire sekundærknapper (Lagrede quizer, Poengtavle,
  Hent fra nettet, Spørsmålsideer)
- **Aksjon:** Klikker "Start spill"

**Skjerm 2: Spilloppsett (GameSetup)**
- **Tilfeldig quiz-kort:** vanskelighetsgrad (Lett/Middels/Vanskelig) og
  antall spørsmål (slider), viser hvor mange ubrukte spørsmål som finnes
- **Quizkort** (presets/lagrede quizer) med tema, vanskelighet og antall
- **Modus-velger:** Klassisk / Buzzer / Team
- **Antall spillere:** +/– knapper (1–8)
- **Aksjon:** Klikker "Start tilfeldig quiz"

**Skjerm 3: Spillerlobby**
- Spillerbokser med farge, navn (redigerbart) og fargebytte
- "X spillere" i toppen
- **Aksjon:** Klikker "Start spillet!"

**Skjerm 4: Spillvisning (per spørsmål)**
- Progresjon ("Spørsmål X av Y"), nedtelling, spiller-chips med poeng
- **Klassisk:** aktiv spiller svarer (rotasjon); tast 1–4 eller klikk A–D
- **Buzzer:** buzz-fase ("Buzz når du kan!") – tast 1–8; første spiller
  svarer; de andre får ubesvart
- **Team:** som klassisk, poeng samles per lag i resultatene
- Etter svar (eller timeout):
  - Riktig svar grønt, valgt feil rødt
  - Forklaring vises om spørsmålet har en
  - "Neste spørsmål"-knapp (mellomromstast fungerer også); siste spørsmål
    viser "Se resultater"
- **Aksjon:** Svarer og går videre

**Skjerm 5: Resultater**
- Vinner-fremheving ("Spiller X vinner!")
- Full statistikk per spiller: riktige/feil/ubesvart, treffprosent,
  gjennomsnittlig svartid, poeng og total spilletid
- **"Gjennomgå spørsmålene"** – alle spørsmål med fasit og hva hver spiller
  svarte (god diskusjonsfunksjon for TV-kvelden)
- Knapper: "Spill igjen" (→ lobby med samme quiz), "Hovedmeny"
- Runden lagres automatisk i Poengtavlen med faktiske data

---

### Flyt 1b: Når valgene ikke kan oppfylles (ingen fallback)

Skjer i Quizbygger/Spilloppsett når ønskede kriterier (tema +
vanskelighet + antall) har for få spørsmål:

1. Dialogen **"Ikke nok spørsmål"** viser hvor mange som finnes og hvor
   mange som mangler
2. Brukeren får konkrete valg:
   - **"Reduser antallet til N spørsmål"** – starter med det som finnes
   - **"Hent flere spørsmål fra nettet"** – åpner API-henting
   - **"Tillat gjenbruk av spørsmål"** (vises bare hvis det hjelper)
   - **"Avbryt"** – tilbake for å endre valgene selv
3. Quizen starter **aldri** med andre kategorier/vanskelighetsgrader enn
   brukeren valgte

---

### Flyt 2: Bygge quiz (QuizBuilder)

1. **"Bygg quiz"** fra hovedmenyen
2. Fire steg på én skjerm:
   - **1. Temaer** – hovedkategorier med underkategorier (utvid med
     "Underkategorier"-knappen); antall tilgjengelige vises per chip
   - **2. Vanskelighet og antall** – lett/middels/vanskelig + slider
   - **3. Spillinnstillinger** – modus, tid per spørsmål, spillere
   - **4. Oppsummering** – alt samlet, med tilgjengelighetsboks
3. **"Start quiz"** (→ lobby) eller **"Lagre quiz"** (→ vises som quizkort
   i Spilloppsett og under "Lagrede quizer")

---

### Flyt 3: Administrere spørsmålsbanken

**Skjerm 1: Spørsmålsbank**
- Søkefelt, kategorifiltre, totalt antall
- Spørsmålskort med kategoritagger, vanskelighetsgrad, fasit (grønt),
  kildehenvisning for API-spørsmål, og "til-gjennomgang"-merking for
  spørsmål med ukjent opprinnelseskategori
- **Aksjoner per spørsmål:** "Rediger" (dialog med validering,
  duplikatkontroll) og "Slett" (bekreftelsesdialog)

**Opprette: "Nytt spørsmål"**
- Tekst, type (flervalg/sant-usann), vanskelighet, kategorier,
  svaralternativer (riktig markeres; tomme alternativer på slutten
  trimmes automatisk), forklaring
- Duplikat tekst avvises med forklaring ("finnes allerede")

**Import: "Importer spørsmål"**
- JSON eller CSV; full validering med **feilrapport per spørsmål** – inge
  ting lagres hvis filen har feil, og hvert avvik er beskrevet

---

### Flyt 4: Hente spørsmål fra nettet

- Velg kilde: **Open Trivia DB** eller **The Trivia API**
- Filtrer på kategori og vanskelighet; antall begrenses av leverandøren
  (OpenTDB: 1 kall/5 s; Trivia API: maks 50 per kall)
- Forhåndsvisning med oversettelse til våre kategorier; ukjente
  leverandørkategorier merkes "til-gjennomgang"
- Kildehenvisning vises (lisenskrav for The Trivia API, CC BY-NC 4.0)

---

### Flyt 5: Tastaturnavigasjon

| Taste | Funksjon |
|---|---|
| **1–4** | Svar A–D (aktiv spiller) |
| **1–8** | Buzzi (buzzer-modus, spillernummer) |
| **Mellomrom** | Neste spørsmål (når fasit er vist) |
| **P** | Pause |
| **Tab / piltaster** | Navigere knapper og meny |
| **Enter** | Aktiver fokusert knapp |
| **Escape** | Lukk dialog |

Alle taster går gjennom KeyboardDriver → input-hub → samme hendelser som en
fremtidig fysisk kontroller vil sende.

---

## 3. Tilstandsmaskin for spillflyt

```
                    ┌─────────────┐
                    │   MENY      │
                    └──────┬──────┘
                           │ "Start spill" / "Bygg quiz"
                           ▼
                    ┌──────────────┐  for få spørsmål  ┌─────────────┐
                    │  OPPSETT /   │──────────────────►│ UTTREKK-    │
                    │  BYGGER      │◄──────────────────│ DIALOG      │
                    └──────┬───────┘  reduser/avbryt   └─────────────┘
                           │ "Start (tilfeldig) quiz"
                           ▼
                    ┌─────────────┐
                    │   LOBBY     │
                    └──────┬──────┘
                           │ "Start spillet!"
                           ▼
              ┌─────────────────────────────┐
              │  SPILLVISNING               │
              │  classic: answering→revealed│
              │  buzzer:  buzzing→answering │
              │           →revealed         │
              └──────┬──────────────────────┘
                     │ siste spørsmål avslørt
                     ▼
              ┌──────────────┐  "Spill igjen" ─► LOBBY
              │  RESULTATER  │
              │  + statistikk│
              │  + gjennomg. │──"Hovedmeny"──► MENY
              └──────────────┘
```

Timeren er timestamp-basert; timeout registrerer ubesvart for alle gjenværende
spillere og avslører fasit. Duplikatsvar er umulig (beskyttet i spillmotoren).

---

## 4. Designprinsipper for navigasjon

1. **Tydelig tilbakemelding:** Brukeren skal alltid vite hvor de er
2. **Konsistente mønstre:** Samme navigasjon på tvers av skjermer
3. **Minimale klikk:** Maks 2 klikk fra meny til spill
4. **Tastaturstøtte:** Alt kan gjøres med tastatur
5. **Store klikkområder:** Minimum 44×44px, helst større for TV
6. **Ingen døde knapper:** Hver knapp gjør noe reelt
7. **Ærlige feilmeldinger:** For få spørsmål → dialog med valg, aldri stille
   fallback
8. **Åpen barrierefrihet:** WCAG AAA-kontrast, ARIA-labels, fokusindikatorer,
   respekterer `prefers-reduced-motion`
