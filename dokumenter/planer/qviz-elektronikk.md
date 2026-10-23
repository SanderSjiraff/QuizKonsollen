Quiz Universe – Elektronikk, kontrollere og fysisk spillkonsoll
Prosjektstatus: Plan og læringsveikart (versjon 1.0, 23. oktober 2026)
Relatert dokument: 01_QUIZ_PROGRAMVARE.md
Utgangspunkt: En blanding av (B) TV/skjerm med separate spillerkontrollere og (C) et modulært system som også kan støtte knapper innebygd i hovedenheten. Endelig formfaktor og knappeoppsett er ikke bestemt.

1. Mål og designprinsipper
Bygg en fysisk quizkonsoll som kan tas frem og spilles med venner uten at noen må bruke mobilen sin. Prosjektet skal også fungere som et praktisk læringsprosjekt innen elektronikk, mikrokontrollere, signalbehandling, programmering, kommunikasjon og mekanisk konstruksjon.
Designprinsipper:
1. Modulært: Samme quizprogram skal fungere med separate kontrollere, knapper i hovedkabinettet og tastatur.
2. Begynn enkelt: Første prototype bruker PC som hovedmaskin, én Pico 2 og 1–4 kablede knapper.
3. Kan bygges ut: Flere knapper, LED-lys, lyd, dedikert display og senere trådløse kontrollere.
4. Lavspenning og sikkerhet: Bruk ferdige, godkjente strømforsyninger. Ikke arbeid med nettspenning på egenkonstruerte kretskort.
5. Rettferdig spill: Første gyldige knappetrykk skal registreres på en forutsigbar måte, ikke basert på tilfeldige UI-forsinkelser.
6. Offline: Hovedmaskin, skjerm og kontrollere skal fungere uten Wi-Fi eller internett.
2. Systemoversikt
                     ┌────────────────────────────┐
                     │ TV / monitor               │
                     │ spørsmål, tid, poeng       │
                     └─────────────▲──────────────┘
                                   │ HDMI
                     ┌─────────────┴──────────────┐
                     │ PC under utvikling         │
                     │ Raspberry Pi senere        │
                     │ Quiz Universe-programmet   │
                     └─────────────▲──────────────┘
                                   │ USB (seriell)
                     ┌─────────────┴──────────────┐
                     │ Kontrollerhub              │
                     │ Raspberry Pi Pico 2        │
                     │ knapper, logikk, LED       │
                     └───┬─────┬─────┬─────┬──────┘
                         │     │     │     │
                    Spiller Spiller Spiller Spiller
                       1      2      3      4
                    (fysiske knapper; kan være
                     separate eller innebygde)
Senere alternativ: Flere lokale mikrokontrollere (f.eks. én per trådløs kontroller) og en mottaker. Dette skal ikke endre quizprogrammets spillmotor, bare inndata-adapteren.
3. Maskinvarevalg og hva hver del gjør
A. Hovedmaskin: PC først, Raspberry Pi senere
- Start: Eksisterende Windows-/Linux-PC med skjerm eller HDMI-TV.
- Stand-alone senere: Raspberry Pi 5 eller tilsvarende liten datamaskin.
- Oppgave: Kjøre brukergrensesnittet, spørsmålsdatabase, poengsystem, lyd og kontrollertilkobling.
- Hvorfor ikke bare Pico? Pico 2 er en mikrokontroller som er god til I/O, men ikke egnet som fullverdig datamaskin for et omfattende quizgrensesnitt på HDMI-skjerm.
Når Raspberry Pi brukes som hovedmaskin, må du ha riktig strømforsyning, lagringsmedium, nødvendig kjøling og stabil automatisk oppstart.
B. Mikrokontroller: Raspberry Pi Pico 2
- Leser brytere via GPIO.
- Gjør avsprettfiltrering (debouncing).
- Håndterer buzzervindu og registrerer første gyldige trykk.
- Sender meldinger via USB-seriell til PC/Raspberry Pi.
- Kan sende styresignaler til LED-drivere og andre effekter.
- Kan programmeres i MicroPython (lett å lære) eller C/C++ for spesielle krav.
Pico 2 har 3,3 V GPIO-logikk; ikke sett 5 V direkte på GPIO-inngangene. Planlegg pinnebruk før du kobler mange knapper, lamper og betjeningsknapper.
C. Spillerkontrollere – tre muligheter
Variant	Oppsett	Fordeler	Ulemper
Buzzer	Én stor knapp per spiller	Enkel, morsom, passer «førstemann»	Kan ikke velge A/B/C/D direkte
Svarpanel	Fire knapper (A/B/C/D) per spiller	Alle svarer selv	Flere ledninger og pinner
Hybrid	Stor buzzer + A/B/C/D	Støtter de fleste spillmoduser	Mer elektronikk og større kabinett


Åpen beslutning: Ikke kjøp 20 knapper før prototypen er testet. Begynn med én knapp og skaler til fire spillere; vurder deretter om A/B/C/D skal legges til.
D. Lys og lyd
- Lys i knappene kan indikere aktiv spiller, riktig/feil svar eller buzzervinner.
- Lyd kan i første omgang spilles fra hovedmaskinen/TV-en; en separat buzzer/summer er ikke nødvendig i MVP.
- Lysknapper kan ha LED-er med annen driftsspenning eller høyere strøm enn GPIO tåler. Bruk riktig strømbegrensning og drivertransistor/MOSFET etter komponentens spesifikasjon.
4. Foreløpig komponentliste (BOM)
Komponent	Prototype (PC)	Senere konsoll	Merknad
Raspberry Pi Pico 2	1	1 eller flere	Sentralt inputkort
USB-datakabel	1	1	Ikke ladekabel uten data
Koblingsbrett (breadboard)	1	Valgfritt	For testing, ikke permanent montering
Dupont-ledninger	Sett	Erstatt med faste kabler	Prototyping
Trykknapper	1 → 4	4–20+	Antall avhenger av kontrollervalg
LED + seriemotstand	Valgfritt	Flere	Eller ferdige lysknapper med korrekt driver
Kabinett	Ikke nødvendig	1 + evt. spillerbokser	3D-print/tre/laser-cut
Kontakter og kabler	Valgfritt	Etter design	Merkes og får strekkavlastning
Raspberry Pi 5 + strøm + lagring	Ikke nødvendig	1	Kun dersom PC skal erstattes
HDMI-skjerm/TV	Eksisterende	Eksisterende/ny	Felles visning
Eventuell I/O-utvider, f.eks. MCP23017	Nei	Ved behov	Hvis mange innganger/LED-er


Grove budsjettanslag (ikke verifiserte butikkpriser):
- PC + Pico 2 + enkle kablede knapper: ca. 250–700 kr for ny elektronikk og smådeler.
- Selvstendig konsoll med Raspberry Pi, eksisterende TV og ferdigere kabinett: ca. 1 700–3 000 kr.
- Mer avansert kabinett, ekstra kontrollere, flere lys og eventuelt ny skjerm: ca. 2 500–4 500+ kr.
Dette er planleggingsanslag, ikke pristilbud. Sammenlign norske butikker og sjekk lagerstatus før innkjøp.
5. Første krets – én knapp
Prinsippskjema
Raspberry Pi Pico 2

GPIO2 ───────┐
             │
          [ NO-knapp ]   (normalt åpen)
             │
GND ─────────┘

Programmer GPIO2 med intern pull-up.
Funksjon:
- Når knappen ikke er trykket inn: GPIO2 = 1 (høy, ca. 3,3 V).
- Når knappen trykkes: pinnen kobles mot GND → GPIO2 = 0.
- Hovedprogrammet skal reagere på overgangen fra 1 til 0 (ikke telle kontinuerlig mens knappen holdes inne).
- Felles GND er nødvendig i denne enkle, kablede kretsen.
Enkel testkode for Pico 2 (MicroPython):
from machine import Pin
import time

button = Pin(2, Pin.IN, Pin.PULL_UP)
last = button.value()

while True:
    current = button.value()
    if last == 1 and current == 0:
        print('PLAYER_1_BUZZ')
    last = current
    time.sleep_ms(10)
Merk: Dette er kun en enkel læringstest. Den håndterer ikke robust avsprett, lange kabler, flere knapper, buzzervinduer eller rettferdig prioritetsbehandling. Det legges til i senere firmware.
Hva du lærer i denne øvelsen
- Spenning, logiske nivåer og felles jord.
- Digitale innganger og interne pull-up-motstander.
- Polling kontra interrupt.
- Avsprett og kantdeteksjon.
- Seriell kommunikasjon fra mikrokontroller til PC.
6. Fra én til fire spillere
Eksempel på foreløpig pinnefordeling
Funksjon	GPIO	Merknad
Spiller 1 buzzer	GP2	Intern pull-up
Spiller 2 buzzer	GP3	Intern pull-up
Spiller 3 buzzer	GP4	Intern pull-up
Spiller 4 buzzer	GP5	Intern pull-up
Spillleder: riktig	GP6	Valgfritt
Spillleder: feil	GP7	Valgfritt
Spillleder: neste	GP8	Valgfritt


Dette er forslag, ikke fastlagt PCB-pinout. Når kortet skal bygges permanent, lag et dokumentert skjema med pinner, kontakter og ledningsfarger.
Hva om vi senere bruker både buzzer og A/B/C/D?
Fire spillere × fem knapper = 20 digitale knappeinnganger, før spilllederknapper og andre funksjoner. Pico 2 har nok GPIO til en mulig enkel løsning, men det etterlater lite rom for ekstra signaler og lys. Det kan bli mer ryddig å bruke en I/O-utvider over I²C (f.eks. MCP23017), knappematrise med egnet diodeoppsett, eller egne mikrokontrollere per kontroller.
Ikke bruk en vanlig knappematrise ukritisk dersom mange spillere kan holde flere knapper nede samtidig: uten passende dioder kan du få ghosting. Velg løsning etter antall knapper, reaksjonstid og kabelopplegg.
7. Buzzersystem og rettferdighet
Spillet må ha et definert buzzervindu
1. PC sender ARM til Pico, etter at spørsmålet er klart.
2. Pico nullstiller registrerte trykk og går i armert modus.
3. Første gyldige knappetrykk registreres og låser buzzeren.
4. Pico sender BUZZ, spiller-ID og hendelsesrekkefølge til PC.
5. PC viser hvem som har svart først.
6. Etter spilllederens avgjørelse sendes RESET eller ny ARM etter spillreglene.
Ved feil svar kan systemet enten:
- Avslutte spørsmålet.
- Åpne for andre spillere, men sperre spilleren som allerede svarte.
- Trekke poeng og åpne et nytt buzzervindu.
Hvilke regler som gjelder styres av programvarens spillmodus, ikke av fysisk kobling.
Samtidige trykk
- La én Pico avgjøre rekkefølgen mellom knapper tilkoblet den samme enheten.
- Bruk debouncing som unngår at én fysisk handling teller flere ganger.
- Med ren sekvensiell polling kan nær-samtidige hendelser prioriteres av skannerekkefølgen. For bedre rettferdighet: registrer endringer med interrupt/tidsstempel eller en gjennomtenkt skannemodell, og definer tie-policy for trykk innen måleoppløsningen.
- Ikke sammenlign rå tidsstempler fra forskjellige mikrokontrollere uten kloksynkronisering. Det er særlig relevant hvis du går over til trådløst.
- Mål faktisk forsinkelse og variasjon før du lover millisekundrettferdighet.
En praktisk start er kablet, sentralisert hub. Den er enklest å teste og gir færre variable enn flere trådløse kontrollere.
8. Meldinger mellom Pico og spillprogrammet
Definer et lite, dokumentert serial-protokollformat. Det kan være JSON på én linje per melding (enkelt under utvikling), med linjeskift \n som skilletegn.
Eksempelmeldinger
Pico → hovedmaskin:
{"v":1,"type":"BUZZ","player":2,"seq":14,"ticks_ms":582310}
{"v":1,"type":"BUTTON","player":3,"button":"C","seq":15}
Hovedmaskin → Pico:
{"v":1,"type":"ARM","round_id":"r_12","question_id":"q_48"}
{"v":1,"type":"RESET"}
Protokollregler
- v: protokollversjon for kompatibilitet.
- seq: løpenummer for å oppdage duplikater og tapte meldinger.
- ticks_ms: Pico-lokal tid; må ikke tolkes som samme klokke som PC.
- player: fast logisk spiller-ID uavhengig av fysisk GPIO.
- Kun gyldige hendelser behandles ut fra nåværende spilltilstand.
- Ved ny USB-tilkobling: identifiser kontrolleren, nullstill eventuell gammel buzzertilstand og synkroniser fra hovedmaskinen.
- ARM bør bekreftes med ACK/status før spillet annonserer at svarvinduet er åpent.
- Logg feilmeldinger og håndter manglende tilkobling tydelig i UI.
Meldingsformatet er et designutkast. Implementer først en enkel versjon og dokumenter den før neste maskinvarevariant kobles til.
9. Kablede og trådløse kontrollere
Først: separate kablede spillerbokser
Fordeler:
- Billig, enkelt og stabilt.
- Ingen batterier, pairing eller radiolatens.
- Lett å feilsøke med multimeter.
Praktiske hensyn:
- Velg kontakttype først når antall signaler er kjent.
- Bruk tydelige pinout-tabeller og polaritetsmerking.
- Gi kabler strekkavlastning og unngå løse koblingsbrett i endelig spillboks.
- Lange ledninger kan gi støy og ESD-utfordringer. Vurder ekstern pull-up, filtrering og beskyttelse ved behov etter testing.
- Hvis du bruker 8P8C/RJ45-kontakter til spesialsignaler, merk tydelig at de ikke er Ethernet; bedre er en egnet, nøkkelkodet kontakt som ikke kan forveksles.
Senere: trådløst
Mulige veier er ESP32-baserte kontrollere og lokal radio (f.eks. ESP-NOW eller Wi-Fi), med en mottaker/gateway. Dette gir friere plassering, men introduserer:
- Batteri, lading og strømsparing.
- Paring og håndtering av bortfall.
- Latens, radiostøy og rettferdighetsproblemer.
- Flere tidssynkroniseringsspørsmål for «raskest på knappen».
Anbefaling: Vent med trådløst til kablet MVP er spillbar. Bygg allerede nå hendelsesadapteren i programvaren slik at nye transportmetoder kan legges til senere.
10. Strøm, LED-er og sikkerhet
- Bruk produsentgodkjent strømforsyning for hovedmaskinen.
- Ikke dra store LED-strømmer direkte fra Pico GPIO.
- Dimensjoner LED-motstand fra forsyningsspenning, LED-ens fremspenning og ønsket strøm: R ≈ (V_supply − V_f) / I, og kontroller LED-/GPIO-/drivergrenser.
- For LED-er som trenger mer strøm eller annen spenning, bruk transistor/MOSFET-driver og egnet forsyning. Sørg for riktig referansejord ved ikke-isolerte styresignaler.
- USB og elektronikk bør ha ordentlig kabling, isolasjon og mekanisk beskyttelse; unngå kortslutninger på løse ledninger.
- Ikke koble reléer, 230 V-nettspenning eller ubeskyttede strømforsyninger direkte til læringsprototypen.
- Slå av strømmen før du bygger om kablingen; verifiser forbindelser med multimeter.
11. Læringsløype med praktiske delprosjekter
Øvelse 1 – Les en knapp
- [ ] Koble én NO-knapp mellom GPIO og GND.
- [ ] Aktiver intern pull-up i MicroPython.
- [ ] Skriv ut «pressed» kun én gang per trykk.
- [ ] Forklar hvorfor inngangen ellers kan «flyte».
Bestått når: Ett trykk gir én registrering.
Øvelse 2 – LED som tilbakemelding
- [ ] Koble LED og passende motstand (eller bruk en innebygd LED når støttet).
- [ ] Tenn LED når knappen registreres.
- [ ] Mål relevant spenning/strøm og forklar Ohms lov.
Bestått når: LED reagerer stabilt uten å overbelaste GPIO.
Øvelse 3 – Fire knapper og buzzervinner
- [ ] Koble fire separate knapper.
- [ ] Implementer armert/låst tilstand.
- [ ] Send spiller-ID for første gyldige trykk.
- [ ] Test mange raske trykk og to nesten samtidige trykk.
Bestått når: Bare én buzzervinner velges per åpent vindu etter dokumentert regel.
Øvelse 4 – USB-kontakt med PC
- [ ] Send strukturerte meldinger fra Pico til PC.
- [ ] Lag Python-testprogram som viser hendelsene.
- [ ] Legg til enkel serial reconnect og protokollversjon.
Bestått når: PC registrerer spiller 1–4 og kan sende RESET/ARM tilbake.
Øvelse 5 – Integrasjon med quizprogrammet
- [ ] Oversett fysiske trykk til PLAYER_BUZZ i programvaren.
- [ ] Vis buzzervinner på TV/PC.
- [ ] Lag spilllederhandlinger for riktig, feil og neste spørsmål.
- [ ] Kontroller at knapper ikke virker i pause/utenom aktivt vindu.
Bestått når: Fire venner kan gjennomføre en hel runde med fysiske knapper.
Øvelse 6 – Robust kontroller og kabinett
- [ ] Monter knapper i en enkel boks eller flere små bokser.
- [ ] Velg faste, merkede kabler og kontakter.
- [ ] Test gjentatte inn-/utkoblinger og mekanisk belastning.
- [ ] Legg eventuelt til lys for aktiv spiller.
Bestått når: Kontrollerne tåler vanlig bruk uten løse kontakter.
Øvelse 7 – Selvstendig hovedenhet
- [ ] Kjør quizprogrammet på Raspberry Pi.
- [ ] Koble til HDMI-skjerm og Pico via USB.
- [ ] Sett opp fullskjerm og automatisk oppstart.
- [ ] Test restart, strømutfall og full offline-drift.
Bestått når: Du kan slå på konsollen og starte en quiz uten mobil eller utviklings-PC.
12. Verktøy og måleinstrumenter
Anbefalt for læring og feilsøking:
- Multimeter for kontinuitet, spenning og motstand.
- Breadboard, Dupont-ledninger og motstandssortiment.
- En enkel loddebolt og krympestrømpe når prototypefasen er ferdig (med nødvendig sikkerhet/ventilasjon).
- USB-kabel med data.
- PC med VS Code, Python og MicroPython-verktøy (f.eks. Thonny).
- Eventuelt logikkanalysator senere for puls-/tidsanalyse.
Ved feil: test først knappens kontinuitet, så GPIO-nivå, så firmwarelogg, så seriell melding og til slutt quizprogrammets hendelseshåndtering.
13. Sjekkliste før du bygger permanent
- [ ] Kontrollerne fungerer på PC med USB.
- [ ] Endelig valg av buzzer, A/B/C/D eller hybrid er prøvd fysisk.
- [ ] Pinneplan og strømforbruk er gjennomgått.
- [ ] Alle GPIO-nivåer, LED-motstander og drivere er korrekte.
- [ ] Buzzervindu, feiltrykk og nesten-samtidige trykk er testet.
- [ ] Kabler og plugger har dokumentert pinout, merking og strekkavlastning.
- [ ] USB-frakobling gir forståelig feilmelding i programmet.
- [ ] Spillet kan betjenes helt uten mobil.
- [ ] Hovedmaskinen starter stabilt uten tastatur/mus, hvis målet er en selvstendig konsoll.
14. Åpne beslutninger og mulige utvidelser
Valg	Nåværende anbefaling	Avgjøres etter
Kontrollertype	Én buzzer først	Test av spillmoduser
Separate vs. innebygde knapper	Bevar støtte for begge	Mekanisk prototype
Kablet vs. trådløst	Kablet først	Stabil MVP og latensmålinger
Antall spillere	4	Erfaring med første spillkvelder
Knappelys/feedback	Valgfritt	Grunnkrets fungerer
Hovedmaskin	Eksisterende PC	Klar programvare og budsjett
Eget PCB	Ikke ennå	Frosset skjema og vellykket prototype
Batteridrift	Ikke ennå	Eventuelt trådløs fase


15. Første konkrete oppgave for elektronikkdelen
1. Skaff Pico 2, én NO-knapp, breadboard og en USB-datakabel.
2. Koble knappen mellom GP2 og GND; bruk Pin.PULL_UP.
3. Skriv MicroPython som registrerer nedtrykk én gang og skriver ut en hendelse.
4. Test knappen med både normale og raske trykk.
5. Lag et lite Python-program på PC som leser seriell port og skriver mottatte hendelser.
6. Dokumenter skjema, bilder av oppsett, målinger og feilsøking i hardware/wiring/.
7. Først når dette virker: gjenta for fire spillere og implementer en låst buzzerrunde.
Oppgave til Codex CLI (når første krets virker)
Les docs/02_QUIZ_ELEKTRONIKK.md og docs/01_QUIZ_PROGRAMVARE.md. Lag en minimal hardware/pico_firmware/-implementasjon for Raspberry Pi Pico 2 i MicroPython med fire aktive-lave knapper, intern pull-up, enkel avsprettfiltrering, buzzervindu (ARM/RESET), serial meldingsformat med protokollversjon og løpenummer, samt dokumentasjon for pinnefordeling og testing. Lag også en enkel Python-tester for seriell kommunikasjon på PC. Ikke bygg LED, trådløst, PCB eller fast kabinett i denne fasen. Koden må kunne testes uten at resten av quizspillet er ferdig.

Prosjektprinsipp: Få ett knappetrykk til å fungere, så fire spillere, så hele spillet, og først deretter bygg den konsollen du ønsker å beholde.