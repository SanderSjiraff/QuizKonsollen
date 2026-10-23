# QuizKrets – Designsystem & Visuell Identitet

## Sammendrag

Dette dokumentet definerer designsystemet for QuizKrets, inkludert tre designretninger som ble vurdert, den anbefalte retningen, og alle design tokens som brukes i prototypen og videre implementasjon.

---

## 1. Tre Designretninger Vurdert

### Retning A: «Arcade Neon» – Retro Pixel-Art

**Overordnet stil og stemning:**
En tydelig retro-arkadeestetikk med pixel art, neonfarger og 8-bit/16-bit inspirasjon. Minner om klassiske arkadespill og retro konsoller.

**Fargepalett:**
- Bakgrunn: `#0F172A` (mørk navy)
- Primær: `#DC2626` (neon rød)
- Sekundær: `#2563EB` (neon blå)
- Aksept/CTA: `#22C55E` (neon grønn)
- Kort/overflater: `#192134`
- Tekst: `#FFFFFF`

**Typografi:**
- Overskrifter: **Press Start 2P** (pixel/retro)
- Brødtekst: **VT323** (monospace, retro)

**Navigasjonsstruktur:**
- Sidebar eller toppmeny med pixelerte ikoner
- Tydelige, store knapper med «pixel-border» effekt

**Spørsmål og svaralternativer:**
- Spørsmålstekst i Press Start 2P, stor størrelse
- Svaralternativer som fargede blokker med tydelige kanter
- Pixel-animasjoner ved riktig/feil svar

**Animasjoner og feedback:**
- Blinkende tekst, marquee-ruller
- Sprite-animasjoner
- Hurtige, instant overganger

**TV-funksjonalitet:**
- God kontrast på mørk bakgrunn
- Store, tydelige blokkbokstaver
- Lett lesbart på avstand

**Fordeler:**
- Unik, minneverdig estetikk
- Passer godt til spill
- Skiller seg tydelig fra konkurrenter

**Ulemper:**
- Pixel-font kan være vanskelig å lese i lange tekster
- Risiko for at det føles for «niche» / barnslig
- Mindre egnet for administrasjons-/oppsettsmodus
- Kan oppleves som dateret for noen brukere

**Teknisk kompleksitet:** Middels (krever custom font-loading, potensielt pixel-art assets)

---

### Retning B: «Modern Bold» – Vibrant & Block-based

**Overordnet stil og stemning:**
En moderne, energisk og leken estetikk med sterke farger, geometriske former og høy kontrast. Ligner på moderne partyspill og mobilspill.

**Fargepalett:**
- Bakgrunn: `#EFF6FF` (lys blå/lavender)
- Primær: `#2563EB` (elektrisk blå)
- Sekundær: `#7C3AED` (lilla)
- Aksept/CTA: `#F59E0B` (gull/amber)
- Kort/overflater: `#FFFFFF`
- Tekst: `#0F172A` (mørk)

**Typografi:**
- Overskrifter: **Russo One** (gaming, bold)
- Brødtekst: **Chakra Petch** (techy, moderne)

**Navigasjonsstruktur:**
- Store, fargerike kort
- Tydelig hierarki med store avstander
- Horizontal scroll-snap på mobil, grid på desktop

**Spørsmål og svaralternativer:**
- Rene, moderne kort med subtile skygger
- Fargekodede svaralternativer
- Smooth transitions og hover-effekter

**Animasjoner og feedback:**
- Store, dristige fargeoverganger
- Scroll-snap seksjoner
- Animasjoner med 200-300ms varighet

**TV-funksjonalitet:**
- Høy kontrast fungerer godt
- Moderne og polert utseende
- Kan bli for lyst i mørke rom

**Fordeler:**
- Moderne og polert
- God balanse mellom lekent og profesjonelt
- God lesbarhet med rene fonter

**Ulemper:**
- Kan føles generisk (ligner på mange moderne apper)
- Lys bakgrunn er ikke ideelt for TV-opplevelse
- Mindre særpreget identitet

**Teknisk kompleksitet:** Lav (standard CSS, lett implementerbar)

---

### Retning C: «TV Show» – Vibrant Entertainment

**Overordnet stil og stemning:**
En TV-show-inspirert, underholdningsfokusert estetikk med varme, energiske farger. Ligner på Jeopardy, moderne TV-quizprogrammer og underholdningsshow.

**Fargepalett:**
- Bakgrunn: `#0F172A` (mørk – adaptiv for TV)
- Primær: `#F59E0B` (varm amber/gull)
- Sekundær: `#DC2626` (energisk rød)
- Aksept/CTA: `#22C55E` (grønn succes)
- Kort/overflater: `#1E293B`
- Tekst: `#F8FAFC` (nesten hvit)

**Typografi:**
- Overskrifter: **Righteous** (entertainment, bold)
- Brødtekst: **Poppins** (clean, moderne, god lesbarhet)

**Navigasjonsstruktur:**
- Stor, tydelig navigasjon med varme farger
- Sentrerte layouts for TV-visning
- Minimal chrome, fokus på innhold

**Spørsmål og svaralternativer:**
- Store, tydelige kort med varm fargekoding
- Spørsmålstekst i stor størrelse, sentrert
- Animerte overganger mellom spørsmål

**Animasjoner og feedback:**
- Smooth overganger (200-300ms)
- Stor type (32px+) for TV
- Fargepuls ved riktig svar

**TV-funksjonalitet:**
- Mørk bakgrunn ideell for TV
- Høy kontrast og store skriftstørrelser
- Tydelig visuell hierarki selv på avstand

**Fordeler:**
- Optimert for TV-visning
- Varm, sosial stemning
- God balanse mellom profesjonell og underholdende
- Føles som et «ekte» show

**Ulemper:**
- Krever mørk modus som standard
- Litt mer komplekse fargekombinasjoner
- Må passes på at det ikke blir for «glatt»

**Teknisk kompleksitet:** Lav-Middels (standard CSS, mørk modus som default)

---

## 2. Anbefalt Designretning: «TV Show» (Retning C)

### Begrunnelse

Etter grundig vurdering av alle tre retninger, **anbefales Retning C: TV Show** som hoveddesign for QuizKrets. Her er begrunnelsen:

1. **TV-optimalisering:** Prosjektets primære bruksarena er TV/skjerm på avstand. En mørk bakgrunn med høykontrastfarger er optimalt for denne konteksten.

2. **Sosial stemning:** Den varme amber/gull-fargen (#F59E0B) gir en innbydende, festlig stemning som passer til partyspill og sosiale sammenkomster.

3. **Lesbarhet:** Righteous + Poppins kombinasjonen gir både personlighet og lesbarhet. Poppins er spesielt god på skjermer og i store størrelser.

4. **Balansert identitet:** Designet er tydelig underholdende og spillfokusert, men unngår å bli for barnslig (Arcade) eller generisk (Modern).

5. **Vedlikeholdbarhet:** Mørk modus med varme accenter er enkel å vedlikeholde og utvide. Fargepaletten er konsistent og fleksibel.

6. **Fremtidig fleksibilitet:** Dette designgrunnlaget kan enkelt tilpasses ulike spillmoduser og fysiske kontrollere uten å endre den visuelle kjernen.

7. **Kontrast og tilgjengelighet:** WCAG AAA-kontrast på alle viktige tekstelementer. God lesbarhet for personer med nedsatt syn.

### Sentrale egenskaper ved anbefalingen

- **Dark-first:** Alltid mørk modus som standard. Lys modus kan vurderes senere, men er ikke en prioritet.
- **Warm accents:** Amber/gull (#F59E0B) er den dominerende aksentfargen, med rød (#DC2626) og grønn (#22C55E) som støttefarger.
- **TV-first typography:** Minimum 24px for lesbarhet på TV. Spørsmålstekst minst 48px.
- **Fullskjerm fokus:** Designet tar utgangspunkt i 16:9 fullskjermopplevelse.

---

## 3. Design Tokens

### Farger (anbefalt retning)

| Token | Verdi | Bruksområde |
|-------|-------|-------------|
| `--color-bg-primary` | `#0F172A` | Hovedbakgrunn (mørk navy) |
| `--color-bg-secondary` | `#1E293B` | Sekundær bakgrunn, kort, paneler |
| `--color-bg-elevated` | `#293548` | Hevede elementer, dropdowns |
| `--color-text-primary` | `#F8FAFC` | Primær tekst (nesten hvit) |
| `--color-text-secondary` | `#94A3B8` | Sekundær tekst, labels |
| `--color-text-muted` | `#64748B` | Muted tekst, placeholders |
| `--color-primary` | `#F59E0B` | Primær aksent (amber/gull) |
| `--color-primary-hover` | `#FBBF24` | Hover på primær |
| `--color-secondary` | `#DC2626` | Sekundær aksent (rød) |
| `--color-secondary-hover` | `#EF4444` | Hover på sekundær |
| `--color-success` | `#22C55E` | Suksess, riktig svar |
| `--color-error` | `#DC2626` | Feil, galt svar |
| `--color-warning` | `#F59E0B` | Advarsel |
| `--color-info` | `#2563EB` | Info |
| `--color-border` | `#334155` | Grenser, dividers |
| `--color-border-focus` | `#F59E0B` | Fokus-grenser |
| `--color-overlay` | `rgba(15, 23, 42, 0.8)` | Modal overlays |

### Spillerfarger (for bruk i lobby og spill)

| Spiller | Farge | Bruksområde |
|---------|-------|-------------|
| Spiller 1 | `#3B82F6` (blå) | Profil, poeng, buzzer |
| Spiller 2 | `#EF4444` (rød) | Profil, poeng, buzzer |
| Spiller 3 | `#22C55E` (grønn) | Profil, poeng, buzzer |
| Spiller 4 | `#F59E0B` (amber) | Profil, poeng, buzzer |
| Spiller 5 | `#A855F7` (lilla) | Profil, poeng, buzzer |
| Spiller 6 | `#EC4899` (rosa) | Profil, poeng, buzzer |
| Spiller 7 | `#06B6D4` (cyan) | Profil, poeng, buzzer |
| Spiller 8 | `#F97316` (oransje) | Profil, poeng, buzzer |

### Typografi

| Token | Skrift | Størrelse | Vekt | Linjehøyde | Bruksområde |
|-------|--------|-----------|------|------------|-------------|
| `--font-display` | Righteous | 48-64px (desktop), 32-48px (TV) | 400 | 1.1 | Hovedtittel, splash |
| `--font-heading-1` | Righteous | 36-48px | 400 | 1.2 | Seksjonstitler |
| `--font-heading-2` | Righteous | 28-36px | 400 | 1.2 | Undertitler |
| `--font-heading-3` | Poppins | 24px | 700 | 1.3 | Korttitler |
| `--font-body` | Poppins | 18px (desktop), 24px (TV) | 400 | 1.6 | Brødtekst |
| `--font-body-large` | Poppins | 24px | 400 | 1.5 | Viktig brødtekst |
| `--font-label` | Poppins | 14px | 600 | 1.4 | Labels, tags |
| `--font-button` | Poppins | 18px | 600 | 1.4 | Knapper |
| `--font-question` | Poppins | 48px (TV), 32px (desktop) | 700 | 1.3 | Spørsmålstekst |
| `--font-answer` | Poppins | 28px (TV), 20px (desktop) | 500 | 1.4 | Svaralternativer |
| `--font-score` | Righteous | 64px (TV), 48px (desktop) | 400 | 1.0 | Poengtall |

### Avstandssystem

| Token | Verdi | Bruksområde |
|-------|-------|-------------|
| `--space-xs` | 4px | Minimal padding |
| `--space-sm` | 8px | Tett spacing |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Romslig padding |
| `--space-xl` | 32px | Seksjon-padding |
| `--space-2xl` | 48px | Store seksjoner |
| `--space-3xl` | 64px | Hovedseksjoner |
| `--space-4xl` | 96px | Splash/padding |

### Border-radius

| Token | Verdi | Bruksområde |
|-------|-------|-------------|
| `--radius-sm` | 8px | Små elementer |
| `--radius-md` | 16px | Standard kort |
| `--radius-lg` | 24px | Store paneler |
| `--radius-full` | 9999px | Pills, avatarer |

### Skygger

| Token | Verdi | Bruksområde |
|-------|-------|-------------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtile skygger |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | Standard kort |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | Hevede elementer |
| `--shadow-glow-amber` | `0 0 20px rgba(245,158,11,0.3)` | Glow på primær |
| `--shadow-glow-success` | `0 0 20px rgba(34,197,94,0.3)` | Glow på suksess |
| `--shadow-glow-error` | `0 0 20px rgba(220,38,38,0.3)` | Glow på feil |

### Overganger og animasjoner

| Token | Verdi | Bruksområde |
|-------|-------|-------------|
| `--transition-fast` | `150ms ease` | Subtile endringer |
| `--transition-base` | `300ms ease` | Standard overganger |
| `--transition-slow` | `500ms ease` | Store overganger |
| `--transition-bounce` | `600ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful animations |
| `--animation-pulse` | `pulse 2s infinite` | Pulsing elements |

---

## 4. Komponentbibliotek

### Knapper

**Primærknapp:**
- Bakgrunn: `--color-primary` (`#F59E0B`)
- Tekst: `--color-on-primary` (`#0F172A`)
- Border-radius: `--radius-md` (16px)
- Padding: 16px 32px
- Font: `--font-button`
- Hover: Lysnere bakgrunn (`#FBBF24`), skygge `--shadow-glow-amber`
- Active: Mørkere bakgrunn (`#D97706`), translateY(2px)
- Disabled: Opacity 0.5, cursor not-allowed

**Sekundærknapp:**
- Bakgrunn: transparent
- Border: 2px solid `--color-border`
- Tekst: `--color-text-primary`
- Hover: Border `--color-primary`, tekst `--color-primary`

**Spillerknapp (buzzer):**
- Stor, firkantet/rund knapp
- Fyller hensiktsmessig plass
- Glow-effekt ved aktiv
- Scale-down ved trykk

### Kort

**Standard-kort:**
- Bakgrunn: `--color-bg-secondary`
- Border-radius: `--radius-lg`
- Padding: `--space-lg` (24px)
- Border: 1px solid `--color-border`
- Hover: Border `--color-primary` (subtil)

**Quiz-kort:**
- Større padding for TV
- Tydeligere border
- Fargeindikasjon på kategori

**Resultat-kort:**
- Vertikal layout
- Stort tall + label
- Spillerfarge som aksent

### Input-felt

- Bakgrunn: `--color-bg-elevated`
- Border: 1px solid `--color-border`
- Border-radius: `--radius-md`
- Padding: 12px 16px
- Focus: Border `--color-border-focus`, skygge `--shadow-glow-amber`
- Font: `--font-body`

### Modal/Dialog

- Overlay: `--color-overlay`
- Innhold: `--color-bg-secondary`
- Border-radius: `--radius-lg`
- Padding: `--space-xl`
- Max-width: 800px (desktop), 100% - 32px (mobil)

### Navigasjon

**Toppmeny (admin-modus):**
- Bakgrunn: `--color-bg-secondary`
- Høyde: 64px
- Elementer: Poppins 16px, hover: `--color-primary`
- Aktiv: Understrek i `--color-primary`

**TV-navigasjon (spillmodus):**
- Minimal UI
- Stor, sentrert navigasjon
- Tastaturnavigasjon med piltaster + Enter
- Tydelig fokus-markering (gul border)

### Statusindikatorer

**Poengindikator:**
- Stort tall (Righteous, 64px)
- Farge: spillerens farge
- Label under i Poppins

**Tidsur:**
- Stor sirkel/progress-bar
- Farge endres: grønn → gul → rød
- Puls ved < 5 sekunder

**Tilbakemelding:**
- Riktig: Grønn bakgrunn, checkmark-ikon, sparkler
- Feil: Rød bakgrunn, X-ikon, shake-animasjon

---

## 5. Interaksjonsmønstre

### Hover-tilstander
- Alle klikkbare elementer: cursor pointer
- Knapper: brightness(1.1) + skygge
- Kort: border-farge endres
- Links: Understrek vises

### Fokus-tilstander
- Tydelig gul/orange outline (3px solid `#F59E0B`)
- Outline-offset: 2px
- Ikke fjern outlines!

### Aktiv-tilstander
- Scale(0.98) på knapper
- Mørkere bakgrunn

### Deaktivert-tilstander
- Opacity: 0.4
- Cursor: not-allowed
- Ingen hover-effekt

### Redusert bevegelse
- Alle animasjoner: none eller instant
- Ingen pulsering
- Ingen parallax
- Overganger: 0ms

---

## 6. Responsivt design

### Breakpoints

| Navn | Bredde | Primær bruk |
|------|--------|-------------|
| `sm` | 640px | Små mobiler |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | TV (720p), desktop stor |
| `2xl` | 1920px | TV (1080p), full HD |
| `tv` | 1280px+ | Spillmodus aktiveres |

### TV-spesifikke regler

- All tekst minimum 24px
- Knapper minimum 120px høyde
- Klikkområder minimum 80×80px
- Generøs spacing (min 32px)
- Høy kontrast (ikke grå på grå)
- Tydelige fokusmarkeringer
- Ingen hover-only interaksjoner

---

## 7. Tilgjengelighet (WCAG 2.1)

### Kontrastkrav
- Normal tekst: minimum 4.5:1
- Stor tekst: minimum 3:1
- UI-komponenter: minimum 3:1
- Alle foreslåtte fargekombinasjoner oppfyller AA, de fleste AAA

### Tastaturnavigasjon
- Alt kan navigeres med Tab/Shift+Tab
- Tydelig fokusindikator
- Ingen tastaturfeller
- Logisk tab-rekkefølge

### Skjermleserstøtte
- Semantisk HTML
- Aria-labels på ikonknapper
- Live regions for poengendringer
- Alt-tekst på dekorative bilder (tom alt)

### Fargeuavhengighet
- Aldri bruk farge alene for å formidle informasjon
- Ikon + farge for status
- Mønstre/tekst + farge for grafer

---

## Beslutninger og åpne spørsmål

### Bestemt
- ✅ Mørk modus som standard
- ✅ «TV Show»-retning valgt
- ✅ Righteous + Poppins typografi
- ✅ Spillerfarger definert (8 spillere)

### Åpent
- ⬜ Lys modus – vurderes etter MVP
- ⬜ Lyd-design – ikke i MVP
- ⬜ Animasjonsnivå – justeres basert på brukertesting
- ⬜ Fysisk kontroller-feedback-farger – avhengig av LED-valg
- ⬜ Språkstøtte UI – Norsk først, engelsk senere
