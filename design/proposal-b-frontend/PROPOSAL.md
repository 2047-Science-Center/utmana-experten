# Designförslag B — "Marquee-skärm"

Centralskärmens look för stationen **Utmana experten**. Rent designförslag — rör aldrig
`src/`. Allt ligger i `design/proposal-b-frontend/` (`index.html` = fristående showcase
med alla states i 16:9, ingen build, inga beroenden utom Google Fonts).

Greppet: en **retro-futuristisk varieté-scen** — en 60/70-tals rymdålders-TV-studio.
Petrolen, björken, den brända orangen och rymd-motivet (ringad planet + 4-uddiga stjärnor)
drar åt ett *rundat, planetärt* formspråk snarare än en stram, minimal look. Det är här
förslaget avsiktligt skiljer sig från en Emil Kowalski-variant: där den är tyst och
precis, är denna **teatralisk, varm och scennära**.

## Layout-system

- **Marquee-proscenium runt varje skärm.** En trä-ram (björk-gradient) med en kant av
  varma lampor (fyra lamp-remsor av radial-gradient-prickar + lamp-glow). Lamporna
  "jagar" långsamt runt kanten — studio-signalen att något är på gång.
- **Äkta 16:9 per state.** Varje skärm är `aspect-ratio:16/9` och satt som
  `container-type:inline-size`, så **all typografi skalar i `cqw`** mot ramens bredd —
  proportionerna håller identiskt oavsett fönsterstorlek (viktigt för en fast NUC-kiosk).
- **Fast grundrutt per spel-state:** frågan överst/centralt, **spelets namn i ett hörn**
  (HUD vänster) och **stegetiketten i motsatt hörn** (HUD höger), hästskon i mitten.
- **Hästsko-vizen är en SVG** (`viewBox 0 0 1000 640`) som ritas av en liten renderare i
  `<script>` — *en* funktion, många states (röster, aktiv plats, dim, pratbubbla, facit).
  U:et öppnar uppåt mot scenen/TV:n; platserna ligger per beställningen: vänster arm
  uppifrån 1→2, botten 3→4, höger arm nedifrån-upp 5→6. TV:n ("PÅ SCEN") sitter längst
  fram så alla sex ser den. Knapparna visas aldrig — en textrad påminner att de sitter på
  borden.

## Typval

- **Unbounded** (Google Fonts) — display: titlar, frågan, stora siffror, röstorden.
  Vald för sina *cirkulära, geometriska* former som rimmar med den ringade planeten och de
  runda lamporna; ger broadcast-tyngd utan att bli en hög-kontrast-serif (den serifen är
  den vanligaste AI-tell:en på creme/orange-paletter och undviks medvetet).
- **Hanken Grotesk** (Google Fonts) — brödtext **och det stora live-transkriptet**. Varm,
  humanistisk grotesk som är läsbar på långt håll och i långa stycken, där Unbounded vore
  för tung.
- Laddas via `<link>` till `fonts.googleapis.com` högst upp i `index.html` (preconnect +
  en stylesheet-rad).

## Motion-beslut

Respekterar `prefers-reduced-motion` fullt ut (en `reduce`-query nollar alla animationer;
alla "tända" states är ändå statiska i markup, så skärmarna ser rätt ut utan rörelse).

- **Ambient:** marquee-lampornas långsamma jakt (motsatt riktning på motstående sidor) +
  planeten som andas/snurrar. Det är den *enda* genomgående rörelsen — inga
  fade-slide-up på varje sektion.
- **Händelse-beats (en per moment):** röst-bloom när en plats tänds, mörkläggningen när
  mikrofonen tar över, pratbubblans nedfällning, och ljus-svepet över reveal.

## Signatur-mekaniken

1. **Hästskon tänds (vote):** varje plats får sin röstfärg som ring + en tänd tredjedel i
   3-segment-indikatorn (ordning **NEJ · KANSKE · JA**, speglar arkadknapparna och
   LED-tredjedelarna). Skärm och strip visar exakt samma sak.
2. **Transkript-övertagandet (speak_round):** den aktiva platsen får en spotlight-kon och
   en pulsande gloria; resten av hästskon dimmas till ~0.34 och en mörk scrim lägger sig
   bakom texten. Det mikrofonen hör växer till ett stort live-transkript (Hanken Grotesk,
   ~4 cqw) med blinkande markör, "live"-prick och nedräkning + "KLAR ▸".
3. **Pratbubblan (post-tur):** när turen är klar renderas transkriptet som en creme
   pratbubbla med svans in mot platsen (SVG-rect + `foreignObject` för radbrytande text),
   dockad bredvid rätt plats. Allas motiveringar byggs upp runt bordet.

Övriga states följer samma system: **facit** slår upp rätt svar stort och tänder samma
tredjedel på *alla* platser; **expertens dom** är en latensmask (snurrande planet +
skannande sken); **återkoppling** är studions namnskyltar (platsfärg-flik, namn, eget
svar, AI-text); **reveal** ställer FÖRE mot EFTER med ett stort delta.

## Mappning till `src/stations/utmana-experten/theme/`

Allt är redan uttryckt som CSS-variabler på `:root` i `index.html` och mappar rakt till
tokens i `theme/gameshow.css` (som i dag har `--vote-ja/-nej/-kanske`, `--studio-*`):

| Förslagets token | Värde | Tema-token (förslag) |
|---|---|---|
| `--petrol` / `--panel` | `#0c333c` / `#0a2930` | `--studio-stage`, skärmbakgrund |
| `--birch` / `--birch-lt` | `#8a5a2a` / `#c89b5e` | `--wood`, ram/hästsko |
| `--orange` | `#d4682e` | `--color-accent` |
| `--creme` / `--creme-dim` | `#f2e7cf` / `#c98a4a` | `--color-ink-strong` / `--color-ink` |
| `--lamp-glow` / `--lamp-core` | `#ffe8bd` / `#fff3d6` | `--studio-spot`, `--studio-rim` |
| `--ja` / `--kanske` / `--nej` | `#36b34a` / `#f2c021` / `#e23b2e` | `--vote-ja` / `--vote-kanske` / `--vote-nej` |
| `--f-disp` / `--f-text` | Unbounded / Hanken Grotesk | `--font-retro` / brödfont |

I appen blir hästsko-renderaren en `SeatStrip.vue`/`Horseshoe.vue`-komponent som läser
`store.seats`, `store.votes`, `store.turns[]` och aktiv plats; marquee-ramen, HUD:en och
de tre signatur-animationerna blir tunna vyer ovanpå kitet. Inga färger hårdkodas —
Josef finslipar i `theme/gameshow.css`.
