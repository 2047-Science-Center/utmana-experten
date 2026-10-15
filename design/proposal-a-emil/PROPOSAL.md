# Designförslag A — "Marquee"

Rent designförslag för den centrala game-show-skärmen i **Utmana experten** (2047 Science
Center). Ingen källkod i `src/` är rörd. Allt ligger i `design/proposal-a-emil/`:
`index.html` (fristående, scrollbar showcase med alla nyckel-states) + denna fil.

Ramen är **Emil Kowalski / design engineering**: motion med ett syfte, egna easing-kurvor,
origin-aware transforms, bara `transform`/`opacity`, och full respekt för
`prefers-reduced-motion`.

---

## Greppet i en mening

En **varm studio i rymden** — petrol & björkträ, en marquee-ram av glödande lampor, och en
**hästsko av platser** som är skärmens hjärta: den lyser i röstfärg, highlightar den som
tänker högt, och samlar varje avslutad motivering som en **pratbubbla** dockad vid rätt plats.

---

## Layout-system

- **Varje skärm = en 16:9-scen** (`aspect-ratio: 16/9`) med en **marquee-ram** (fyra
  lamp-remsor, `radial-gradient` som upprepas, varm glöd via `drop-shadow`). Inuti ramen
  ligger `.stage` — själva scenytan — med rymd-motivet (ringad planet + 4-uddiga
  orange stjärnor) som ett lager längst bak (`z-index: 0`).
- **Tre zoner, konsekvent genom alla states:** `topbar` överst (frågan till vänster,
  **spelnamnet i hörnet** till höger), `viz` i mitten (hästskon), och en valfri fot
  (röst-tally / delta-staplar). Frågan och spelnamnet ligger alltid på samma plats så
  publiken hittar dem direkt oavsett steg.
- **Hästsko-vizen är en plan-vy** byggd i SVG: ett U-format bord (björkträ-gradient, två
  lager för djup), **TV:n längst fram i öppningen** (nedtill), och platserna 1–6 utplacerade
  exakt enligt möbeln:
  - **Vänster arm uppifrån:** plats 1, 2
  - **Botten (U:ets stängda krök, överst i bild):** plats 3, 4
  - **Höger arm nerifrån-upp:** plats 5, 6

  Varje plats är en nod med nummer (Fraunces), etikett och en **röst-ring** som är neutral i
  vila och lyser i sin röstfärg när platsen röstat — skärmens ring speglar exakt den fysiska
  LED-tredjedelen och arkadknappen. Hästskon renderas av en liten `horseshoe(opts)`-funktion,
  samma geometri återanvänds i alla states (present / vote / speak / post).

---

## Typografi

- **Display — `Fraunces`** (variabel soft-serif, opsz 9–144). Vald för frågan, spelnamnet,
  platssiffrorna, transkriptet och facit. Den är varm, redaktionell och har precis den
  retro-studiokänsla som petrol/creme/orange-paletten vill ha — utan att bli pastisch.
- **UI — `Inter`** för eyebrows, etiketter, feedback-kort och tally: hög läsbarhet på håll,
  neutral motvikt till Fraunces personlighet.
- **Laddas** via Google Fonts i `<head>` (`<link>` till `fonts.googleapis.com`), enda externa
  beroendet. Allt annat är inline.

Pairingen är medvetet smal (en display + en UI) för **kohesion** — hela scenen ska kännas som
ett system, inte en samling fonter.

---

## Motion, easing & timing (Emil-ramen)

Egna kurvor (de inbyggda CSS-easingarna är för veka):

```css
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1);   /* in/ut — snabb start, responsiv */
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1);  /* rörelse på skärm */
--ease-drawer:  cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-drawer — för pratbubble-docken */
```

Beslut:

- **Röst-ignite (vote):** varje ring tänds från `scale(0.82) + opacity:0` → `scale(1.12)` →
  `scale(1)` på **420 ms `--ease-out`**, med **stagger** (60–540 ms) så hästskon "fylls" som
  en riktig game-show-tavla i stället för att allt tänds på en gång. Aldrig från `scale(0)` —
  inget i verkligheten dyker upp ur ingenting.
- **Transkript-övertagandet (speak):** mörkande slöjan tonar in på **280 ms `--ease-out`**,
  och transkriptet byggs **ord för ord** (55 ms stagger per ord, ren `opacity`) så det
  läses som att det registreras live i mikrofonen. Den aktiva platsen får en lugn
  **puls-glow** (`--ease-in-out`, 1,8 s loop) bakom slöjan.
- **Pratbubble-docken (post):** textblocket animeras **ner** (`translateY(-26px) scale(0.92)`
  → vila) på **460 ms `--ease-drawer`** med `transform-origin` satt mot platsen
  (`left/right/center`) — bubblan växer alltså ur sin plats, inte ur mitten. Andra bubblan
  dockar 140 ms efter den första (stagger).
- **Reveal:** staplarna fylls med `width`-transition **900 ms `--ease-out`**, efter-stapeln
  280 ms efter före-stapeln, så glappet (före→efter) "öppnar sig" dramatiskt.
- **Marquee-lamporna** chasar linjärt (900 ms loop), fram på toppen/vänster, omvänt på
  botten/höger — levande studio-ram.
- **Attract-CTA:n** andas (subtil `scale`-puls) för att dra in en grupp.

Alla UI-övergångar hålls i **Emils spann** (knapptryck 100–160 ms, popover 150–250 ms,
reveal får vara längre eftersom det är sällan-sett och dramatiskt).

**`prefers-reduced-motion`:** all rörelse ligger bakom `@media (prefers-reduced-motion:
no-preference)`. Default-läget är alltid **slutläget** — tända ringar, synlig slöja, dockade
bubblor, fyllda staplar. Reducerad rörelse ger alltså en komplett, läsbar skärm utan en enda
transform — comprehension bevaras, rörelsen försvinner.

---

## De tre signaturerna — hur de funkar

1. **VOTE — rösten tänder hästskon.** Platsernas ringar lyser i de **låsta röstfärgerna**
   (NEJ `#e23b2e` · KANSKE `#f2c021` · JA `#36b34a`), tänds med stagger, och en tally längst
   ner summerar. Skärmen och den fysiska LED-tredjedelen visar exakt samma sak samtidigt.

2. **SPEAK — live-transkriptet tar över.** En radiell mörk slöja lägger sig över hästskon så
   texten blir läsbar; den aktiva platsen highlightas (stor chip + puls-glow på platsen); det
   som sägs skrivs **stort** i Fraunces, ord för ord, med "Mik på"-indikator. Rummet dämpas,
   ordet står i centrum.

3. **POST-TUR — svaret dockar som pratbubbla.** När turen är klar animeras textblocket ner
   och **fastnar bredvid rätt plats** i hästskon, färgprickad med personens röst. Flera varv
   = flera bubblor runt bordet → en levande karta över vad gruppen faktiskt tyckte, som sedan
   assess/facit/feedback bygger vidare på.

---

## Mapping till `src/stations/utmana-experten/theme/`

Förslaget är gjort för att **direkt kunna bli tokens** i `theme/gameshow.css` (det befintliga
spelar ut på kitets CRT-tema). Marquee-paletten ersätter det nuvarande gröna CRT-temat med en
varm variant; röstfärgerna behåller samma roll men byter till de låsta hex-värdena:

| Token i detta förslag | Föreslagen CSS-variabel i `theme/` | Nuvarande motsvarighet |
| --- | --- | --- |
| `--bg` `#0c333c` / `--panel` `#0a2930` | `--studio-stage`, scen-bakgrund | `--studio-stage: #0a1b12` |
| `--wood` / `--wood-light` | `--seat-wood`, `--seat-wood-lit` (nya) | — |
| `--orange` `#d4682e` | `--studio-accent` | `--studio-spot: #ffe08a` |
| `--lamp-glow` / `--lamp-core` | `--marquee-lamp`, `--marquee-core` (nya) | — |
| `--vote-nej` `#e23b2e` | `--vote-nej` | `#ff4d3d` |
| `--vote-kanske` `#f2c021` | `--vote-kanske` | `#ffcc33` |
| `--vote-ja` `#36b34a` | `--vote-ja` | `#2fd46b` |
| `--ease-out / --ease-in-out / --ease-drawer` | nya motion-tokens i `theme/` | — |
| `--seat-active-glow` (puls) | `--seat-active-glow` | finns redan |

Komponent-mappning: hästsko-vizen motsvarar en omarbetad `SeatStrip.vue` (från horisontell rad
till U-plan-vy), pratbubblorna blir ett nytt `SeatBubble`-element knutet till `turns[]`, och
transkript-övertagandet är en overlay i `speak_round`-steget som läser samma Web Speech-ström.
Inga nya motor-begrepp behövs — bara nya vyer och tokens ovanpå den befintliga steg-motorn.
