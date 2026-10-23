Quiz Universe – Programvare og quizplattform
Prosjektstatus: Plan og teknisk veikart (versjon 1.0, 23. oktober 2026)
Relatert dokument: 02_QUIZ_ELEKTRONIKK.md
Hovedidé: Én fleksibel, offline-kapabel quizplattform med spørsmålsbank, kombinerbare temaer, vanskelighetsgrader og spillmoduser. Den samme programvaren skal kunne brukes på PC og på en egen fysisk spillkonsoll.

1. Visjon og mål
Quiz Universe skal være et sosialt quizspill som gjør det mulig å lage både tradisjonelle og helt egne quizopplegg. Spilleren skal kunne blande alle temaer, undertemaer, vanskelighetsgrader, spørsmålstyper og kompatible spillregler i én kamp, uten å måtte lage hver kombinasjon manuelt.
Programvaren skal fungere med vanlig tastatur under utvikling, og senere med egenbygde, fysiske spillerkontrollere – uten mobiltelefoner. Arkitekturen skal ikke forutsette ett bestemt fysisk konsolldesign.
Overordnede mål
1. En stor, gjenbrukbar og søkbar spørsmålsbank.
2. Fleksibel quizbygger: kombiner emner, nivåer, lengde, poeng og runder.
3. Flere spillmoduser, med mulighet til å sette ulike moduser sammen i én kamp.
4. Lokal flerspiller for venner (først fire spillere, senere flere og lag).
5. Full offline-funksjonalitet når spørsmålene er importert.
6. Støtte for tastatur, USB-baserte kontrollere og senere andre inndataenheter.
7. Enkel drift på en PC først, mulig overgang til Raspberry Pi med HDMI-skjerm senere.
8. Et kodeprosjekt som er lett å teste, videreutvikle og bruke som læringsprosjekt.
Avgrensning
- Ikke bestemt: Endelig fysisk konsoll, antall knapper per spiller eller om alle kontrollere skal være kablede.
- Ikke i første versjon: Kontoer, nettsamfunn, mobilapp, skyavhengighet eller avanserte AI-funksjoner.
- Prioritet: Få et morsomt, stabilt lokalt spill til å fungere før store mengder innhold og spesialeffekter bygges.
2. Hva brukeren skal kunne gjøre
Quizoppsett
- Velge ett, flere eller alle temaer (f.eks. historie, sport, teknologi, film, musikk, geografi, naturvitenskap).
- Filtrere på undertemaer, språk, kilde og spørsmålstype.
- Velge én, flere eller alle vanskelighetsgrader (lett, middels, vanskelig; eventuelt ekspert senere).
- Velge antall spørsmål, antall runder og svarfrist.
- Sette vektfordeling (f.eks. 50 % naturvitenskap, 30 % historie, 20 % film), eventuelt la systemet fordele jevnt.
- Velge antall spillere, lag eller individuell konkurranse.
- Kombinere kampregler: poeng ved riktig svar, minuspoeng, bonus for raskt svar, tidsbegrensning og finalerunde.
- Lagre et oppsett som forhåndsinnstilling og starte igjen senere.
- Velge tilfeldige spørsmål med kontroll mot gjentakelser.
Eksempel: 20 spørsmål, Norge + gaming + fysikk, lett og vanskelig, først 10 flervalgsspørsmål, deretter fem «raskest på knappen», avsluttet med fem vanskelige finale-spørsmål. Dette opprettes i quizbyggeren, ikke som en separat hardkodet quiz.
Under kampen
- Spørsmål og eventuelle svaralternativer vises på felles skjerm.
- Poengoversikt, aktiv spiller/lag, runde og tidsur er lett synlig.
- Både låst førstemann-til-knappen og samtidige individuelle svar skal kunne støttes gjennom ulike moduser når nødvendig kontrollerutstyr finnes.
- En spillleder kan godkjenne/avvise muntlige svar i buzzermoduser, og hoppe videre.
- Lyd- og lysrespons er valgfritt; spillet skal fungere uten lysmodul eller lyd.
- Resultatvisning etter kampen.
Etter kampen
- Se sluttresultat og eventuelt enkel statistikk.
- Mulighet til å spille samme oppsett med nye spørsmål.
- Senere: historikk, personlig statistikk, prestasjoner og flere profiler.
3. Arkitektur: hold innhold, regler og kontrollere adskilt
                   ┌─────────────────────────────┐
                   │ Brukergrensesnitt (React)   │
                   │ TV-/PC-visning + oppsett    │
                   └──────────────┬──────────────┘
                                  │ HTTP / lokal WebSocket
                   ┌──────────────▼──────────────┐
                   │ Backend (FastAPI/Python)    │
                   │ Spillsesjoner og API        │
                   └──────────────┬──────────────┘
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
      ┌──────────────┐   ┌────────────────┐   ┌─────────────────┐
      │ Spillmotor   │   │ Quizbygger     │   │ Kontrollerlag   │
      │ regler/poeng │   │ utvalg/runder  │   │ tastatur/USB/...│
      └──────────────┘   └───────┬────────┘   └─────────────────┘
                                 │
                         ┌───────▼────────┐
                         │ SQLite-database│
                         │ spørsmål/maler │
                         └────────────────┘
Arkitekturprinsipp: Spillmotoren skal motta abstrakte handlinger, som PLAYER_BUZZ, ANSWER_CHOICE, HOST_ACCEPT, NEXT_QUESTION. Den skal ikke ha kunnskap om GPIO-pin, COM-port eller fysisk knapp. Elektronikkdelen oversetter maskinvarehendelser til disse handlingene.
Anbefalt startteknologi (kan endres)
Lag	Teknologi	Hvorfor
Grensesnitt	React + TypeScript	Godt egnet til fullskjerm, animasjoner og ulike visninger
Backend/API	Python + FastAPI	Passer til læring i Python og tydelige API-er
Spillmotor	Ren Python, uten avhengighet av UI	Enkel å enhetsteste
Lokal database	SQLite	Offline, ingen serverdrift, backup i én fil
ORM/migrasjoner	SQLModel eller SQLAlchemy + Alembic	Struktur og schemaendringer over tid
Kommunikasjon til UI	HTTP først; WebSocket for direkte oppdateringer	Sanntidsvisning av poeng, buzzer og tidsur
Fysisk kontroller	USB-seriell adapterprosess, f.eks. pyserial	Leser Pico 2-hendelser fra maskinvarelaget
Tester	pytest og frontendtester	Fang opp feil ved endringer


Forenkling i MVP: React kan først bruke en enkel lokal API-server. Bygg bare én kjørbar spillmotor og ett UI; unngå mikroservicer eller nettsky.
4. Datamodell for spørsmål
Spørsmål skal ikke tilhøre nøyaktig én quiz. De skal være gjenbrukbare data som filtreres og trekkes inn i ulike kamper. Tenk på dette som en tag-basert innholdsbank.
Eksempel på spørsmålsformat
{
  "id": "q_0001042",
  "language": "no",
  "text": "Hva er hovedstaden i Australia?",
  "question_type": "multiple_choice",
  "difficulty": "middels",
  "categories": ["geografi", "oseania"],
  "tags": ["australia", "hovedsteder"],
  "choices": [
    {"id": "a", "text": "Sydney"},
    {"id": "b", "text": "Melbourne"},
    {"id": "c", "text": "Canberra"},
    {"id": "d", "text": "Perth"}
  ],
  "correct_choice_ids": ["c"],
  "explanation": "Canberra er Australias hovedstad.",
  "source": {"name": "Manuelt kvalitetssikret eksempel", "url": null},
  "status": "approved",
  "version": 1
}
Anbefalte entiteter/tabeller
- questions: id, tekst, type, vanskelighetsgrad, språk, forklaring, status, kildereferanse, versjon.
- choices: svaralternativer med stabile ID-er og korrekte svar, koblet til spørsmål.
- categories: hierarki for kategorier og undertemaer.
- question_categories / question_tags: mange-til-mange-forhold.
- quiz_presets: lagrede filtre, vektfordelinger og kampregler.
- game_sessions: tidspunkt, tilstand, oppsett og tilfeldig seed.
- game_rounds: modus og regler per runde.
- game_players / teams: deltakere og lag i sesjonen.
- answers / score_events: registrerte svar, poenghendelser og årsak.
- sources / imports: hvor spørsmålene kom fra, vilkår og importhistorikk.
Viktig: Bruk stabile ID-er for svar, ikke stol på at «riktig svar ligger på indeks 2» dersom svaralternativene stokkes. Visningsrekkefølgen kan stokkes uten at fasiten endres.
Kvalitetssikring av spørsmål
- Status: draft, needs_review, approved, rejected.
- Obligatorisk validasjon: tekst finnes, korrekt svar er gyldig, ingen doble svaralternativer, støttet språk/type.
- Marker mulige dubletter (tekstnormalisering + eventuelt semantisk sjekk senere).
- Unngå spørsmål med uklare fasiter eller fakta som endrer seg raskt uten en referansedato.
- Lagre kilde, lisens og importdato når det er kjent.
- La automatisk genererte spørsmål gå gjennom kvalitetssikring før de tas inn i standardbanken.
5. Quizbygger og miksing
Utvalgsalgoritme
1. Les brukerens filtre: kategorier, tagger, vanskelighetsgrader, språk, type, kilde.
2. Hent kvalifiserte, godkjente spørsmål fra databasen.
3. Beregn ønsket fordeling per kategori/nivå/runde (eventuelt vekter).
4. Trekk uten duplikater innen samme kamp; bruk seed så uttrekk kan gjenskapes.
5. Valider at nok spørsmål er tilgjengelige og at fysisk kontroller støtter nødvendig svarmetode.
6. Ved for få spørsmål: vis en tydelig advarsel og foreslå bredere filtre. Ikke endre brukerens valg i det skjulte.
7. Lås den genererte spørsmålslisten ved kampstart slik at rundene er deterministiske.
Håndtering av overlapping
Et spørsmål kan tilhøre flere temaer. Hvis en spiller velger både teknologi og vitenskap, skal spørsmålet ikke trekkes dobbelt. Bruk spørsmål-ID for deduplisering. Ved vektet fordeling må overlappende spørsmål tildeles én «fordelingsbøtte» for denne kampen, uten å ødelegge spørsmålstaggene i databasen.
Spilloppsett som data
{
  "name": "Fredagsquiz",
  "language": "no",
  "players": 4,
  "category_weights": {"vitenskap": 0.5, "historie": 0.3, "gaming": 0.2},
  "difficulties": ["lett", "middels", "vanskelig"],
  "rounds": [
    {"mode": "multiple_choice", "question_count": 10, "time_limit_s": 20},
    {"mode": "buzzer", "question_count": 5, "time_limit_s": 15},
    {"mode": "buzzer", "question_count": 5, "time_limit_s": 10, "correct_points": 200}
  ]
}
Dette er et forslag til dataformat, ikke et ferdig API. Formatet kan endres når implementasjonen testes.
6. Spillmoduser og kombinerbarhet
Bygg én kamp med en liste av runder. Hver runde bruker en spillmodus og et sett med poeng-/tidsregler. Ikke gjør alt til vilkårlige plugin-kombinasjoner fra første dag – noen regler vil kollidere, og systemet må kunne avvise ugyldige oppsett.
Modus	Konsept	Inputbehov	Prioritet
Flervalg	A/B/C/D på skjerm	Tastatur eller fire valgknapper	MVP
Raskest på knappen	Første trykk får svare muntlig	Én buzzer per spiller + spilllederkontroll	MVP
Speedrun	Flest riktige innen tid	Valgknapper eller spillleder	Fase 2
Lagkamp	Felles poeng og runder	Samme som valgt rundemodus	Fase 2
Jeopardy-inspirert	Kategori × poengverdi	Navigasjon og buzzer	Fase 3
Kaosmodus	Rundevariasjon og spesialregler	Varierer	Fase 3
Bilde-/lydquiz	Medieinnhold	Skjerm/høyttalere	Fase 3


Forslag til grensesnitt for en spillmodus
En modus må kunne beskrive:
- id, navn og støttede question_types.
- required_input_capabilities, f.eks. buzz, choose_4, host_approve.
- Hvordan runden starter, mottar hendelser og avsluttes.
- Hvordan poeng og feil håndteres.
- Når neste spørsmål/runde kan begynne.
- Hva UI skal vise (f.eks. fire valg, buzzermarkør eller kategoribrett).
Capability-sjekk: Hvis en kontrollerversjon bare har buzzer, skal ikke en A/B/C/D-runde kreve fire fysiske knapper. Spillet kan tilby et kompatibelt alternativ, men skal ikke påstå at maskinvaren støtter noe den ikke har.
7. Spillmotor: tilstandsmaskin
Anbefalt startmodell:
LOBBY → PREPARED → QUESTION_VISIBLE → ANSWERING → REVEAL
                                   ↘ TIMEOUT ↗          ↓
                                        ROUND_END ← NEXT
                                             ↓
                                          GAME_END
Nøyaktige tilstander bør strammes inn under implementasjonen. Spesielt i buzzermodus:
1. Spørsmålet vises.
2. Systemet armerer buzzere når spørsmålet er klart (unngå tidlige trykk).
3. Første gyldige buzzerhendelse låser retten til å svare.
4. Spillleder markerer riktig eller feil.
5. Regler avgjør poeng og om andre kan forsøke.
6. Spørsmålet avsluttes, og låsen nullstilles før neste spørsmål.
Alle poengendringer bør opprettes som hendelser (score_events) slik at totalsummen kan beregnes og feil spores.
Standardiserte kontrollhandlinger
{"type":"PLAYER_BUZZ","player_id":2,"timestamp_ms":123456}
{"type":"ANSWER_CHOICE","player_id":1,"choice_id":"c"}
{"type":"HOST_ACCEPT"}
{"type":"HOST_REJECT"}
{"type":"NEXT_QUESTION"}
{"type":"PAUSE_GAME"}
timestamp_ms må tolkes i riktig klokke-/enhetsdomene; en tid fra Pico og en tid fra PC kan ikke sammenlignes uten synkronisering. Bruk Picoens hendelsesrekkefølge for buzzere koblet til samme Pico. Se elektronikkdokumentet.
8. UI/UX og skjermer
Første versjon bør ha:
1. Hovedmeny: Ny kamp, lagrede oppsett, spørsmålsbank, innstillinger.
2. Quizbygger: Temaer, vanskelighetsgrader, antall spørsmål, runder og regler.
3. Lobby: Antall spillere, navn/farger og test av tilkoblede knapper.
4. Spillskjerm: Spørsmål stort på skjermen, tid og poeng synlig, klare svaralternativer.
5. Spilllederkontroll: Godkjenn/avvis, pause og neste spørsmål med tastatur eller dedikerte knapper.
6. Resultatskjerm: Poeng, vinner, spill igjen.
7. Innholdsverktøy: Legg til, importer, rediger og godkjenn spørsmål.
UI-et må tåle TV-avstand (stor skrift, høy kontrast, få små kontroller), 16:9-format og fullskjerm. Tastaturbetjening skal fungere selv om mus mangler.
Grensesnittkontrakt til maskinvare
Fysisk knapp / tastatur
        ↓
Input adapter (normalisering + enhetsidentitet)
        ↓
Standardisert kommando
        ↓
Spillmotor (validerer tilstand og regler)
        ↓
Oppdatert spilltilstand
        ↓
UI + eventuelle lyd-/lys-effekter
Spillmotoren er autoritativ: selv om kontrolleren sender en gyldig knapphendelse, skal den ikke gi poeng når kampen er pauset eller spørsmålet er avsluttet.
9. Innhold: hvor spørsmål kan komme fra
- Egne spørsmål: Manuell redigerer eller import av egne JSON/CSV-filer.
- Åpne trivia-kilder: Vurder Open Trivia Database og The Trivia API; sjekk alltid oppdaterte vilkår, kreditering, lisens og bruksgrenser før import og redistribusjon.
- AI-assistert utkast: AI kan foreslå spørsmål, svaralternativer, nivå og forklaring, men må verifiseres mot pålitelige kilder før publisering.
- Kuraterte temapakker: F.eks. norsk geografi, NTNU, gaming eller naturvitenskap.
Offline-regel: Import og synkronisering kan kreve nett, men en påbegynt lokal kamp skal ikke trenge eksterne tjenester. Lagre også eventuelle bilder og lyd lokalt med lovlig brukstillatelse.
10. Foreslått repo-struktur
quiz-universe/
├── README.md
├── docs/
│   ├── 01_QUIZ_PROGRAMVARE.md
│   └── 02_QUIZ_ELEKTRONIKK.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── domain/          # spillmotor, regler, spørsmål
│   │   ├── services/        # quizbygger, import, scoring
│   │   ├── storage/         # SQLite og migrasjoner
│   │   └── input_adapters/  # tastatur/USB adapterlogikk
│   └── tests/
├── frontend/
│   ├── src/
│   └── tests/
├── hardware/
│   ├── pico_firmware/
│   ├── wiring/
│   └── enclosure/
├── question_packs/
│   └── examples/
└── scripts/
Bruk én monorepo til å begynne med. Det gjør integrasjonen mellom programvare og kontrollerfirmware enklere. Git branches eller Git worktrees kan tas i bruk senere hvis flere Codex-agenter skal arbeide parallelt på isolerte deler.
11. Utviklingsfaser og leveranser
Fase 0 – Avklar minimal MVP
- [ ] Bestem første spillformat (anbefalt: buzzerduell eller flervalg som tastaturprototype).
- [ ] Definer 4 spillere, ett skjermbilde, enkel poengberegning og 20–30 testspørsmål.
- [ ] Definer kommandoer mellom kontrollerlag og spillmotor.
- [ ] Dokumenter hvordan et spill startes lokalt på Windows.
Ferdig når: En annen person kan forstå og demonstrere en hel kampflyt med et enkelt grensesnitt.
Fase 1 – Kjørbar programvare-MVP på PC
- [ ] SQLite med spørsmål, alternativer og kategorier.
- [ ] Python-spillmotor med tilstandsmaskin og poeng.
- [ ] UI med meny, lobby, spørsmål og resultater.
- [ ] Tastaturstyring som simulerer spillere/kontrollere.
- [ ] Minst én komplett spillmodus.
- [ ] Tester for poeng, ugyldige hendelser, tidsutløp og kampavslutning.
Ferdig når: Fire personer kan spille en hel kamp på samme PC uten elektronikk og uten internett.
Fase 2 – Miksing og spørsmålsverktøy
- [ ] Velge flere kategorier og vanskelighetsgrader.
- [ ] Quizbygger med antall spørsmål, runder og vekter.
- [ ] Sjekk for dubletter og utilstrekkelig spørsmålstilfang.
- [ ] JSON/CSV-import med validering og kildefelt.
- [ ] Lagre og laste quizoppsett.
- [ ] Legg til en andre spillmodus og kombiner to rundetyper i samme kamp.
Ferdig når: Bruker kan sette sammen en ny blandet quiz uten å redigere kode.
Fase 3 – Integrasjon med ekte kontrollere
- [ ] USB-seriell kontrolleradapter med reconnect og feilhåndtering.
- [ ] Lobby som viser tilkoblede spillere og test av knapper.
- [ ] Spillmotor reagerer på fysiske input-hendelser.
- [ ] Spilllederkommandoer fungerer uten mobil.
- [ ] Test rasende raske og nesten samtidige trykk.
Ferdig når: En hel kamp spilles via fysisk maskinvare, med tastatur som fallback.
Fase 4 – Standalone og utvidelser
- [ ] Kjør på Raspberry Pi med automatisk start og kiosk/fullskjerm.
- [ ] Lokal backup/restore av database og oppsett.
- [ ] Lyd, animasjoner og flere spillmoduser.
- [ ] Statistikk og historikk.
- [ ] Optional støtte for flere kontrollere og trådløs tilkobling.
12. Teststrategi og ikke-funksjonelle krav
Kritiske tester
- [ ] Ingen duplikatspørsmål i en kamp uten at oppsettet tillater det.
- [ ] Et svar som kommer etter fristen, gir ikke poeng.
- [ ] Samme fysiske trykk behandles ikke to ganger.
- [ ] Trykk før buzzer er armert blir ignorert.
- [ ] Poeng og vinner beregnes korrekt i alle moduser.
- [ ] UI og spillmotor kommer tilbake i korrekt tilstand etter pause.
- [ ] USB-kontroller kan trekkes ut og kobles til uten at data korrumperes.
- [ ] Spørsmålsimport avviser ugyldig format og viser nyttig feilmelding.
- [ ] Spill som bruker bare lokale spørsmål fungerer med Wi-Fi slått av.
- [ ] Manglende maskinvarefunksjon rapporteres før kampstart.
Kvalitetskriterier
- Lokal spillflyt skal ikke være avhengig av abonnement eller eksterne API-er.
- Vær tydelig med spørsmålslisens og bruksvilkår.
- Sikre at feil i en lys-/lydmodul ikke stopper spillet.
- Bruk versjonskontroll, automatiske tester og små, separate commits.
13. Åpne avgjørelser (ikke lås for tidlig)
Tema	Foreløpig retning	Må avgjøres senere
Fysisk oppsett	TV + modulær hovedenhet	Eksakt kabinett/skjerm
Kontroller	Separate kontrollere, støtte for innebygde	Buzzer / A-B-C-D / kombinasjon
Antall spillere	4 i MVP	6–8 eller flere
Hovedmaskin	PC under utvikling	Raspberry Pi i ferdig konsoll
Nettverk	Offline først	Valgfri synkronisering/online senere
Lyd og lys	Grensesnitt klart for effekter	Antall LED-er og lydmaskinvare
AI-spørsmål	Manuell vurdering før godkjenning	Automatisk assistanse senere

Inplementasjoner til senere er en dagens qviz hvor man får en qviz per dag og kan samenligne sog mot andre og ha et leaderboard for det. Til senere også ha timer på det slik at det skal være vanskligere å jukse også legge til et system som sjekker om noen har koblet ai til det ved å sjekke riktig svar hastighet osv. 


14. Første konkrete oppgave til Codex CLI
Opprett en minimal monorepo for Quiz Universe med Python/FastAPI-backend, React/TypeScript-frontend og SQLite. Implementer først en ren Python-spillmotor med en enkel tilstandsmaskin, fire spillere, lokal spørsmålsbank, flervalg via tastatur, poengberegning og en komplett kampflyt fra lobby til resultatskjerm. Hold fysisk maskinvare utenfor spillmotoren; definer et grensesnitt for framtidige PLAYER_BUZZ og ANSWER_CHOICE-hendelser. Skriv tester og en README med eksakte lokale oppstartskommandoer. Les docs/01_QUIZ_PROGRAMVARE.md og docs/02_QUIZ_ELEKTRONIKK.md og implementer bare fase 1 – ikke bygg sky, kontoer eller avanserte funksjoner ennå.

Prosjektprinsipp: Én spørsmålsbank + én spillmotor + utskiftbare spillmoduser + utskiftbare kontrollere = flest mulige quizkombinasjoner uten å bygge samme system om igjen.
