# Ljudidentitet — Utmana experten

> **Status: FÖRSLAG.** Inget ljud är genererat utifrån detta dokument. Ingen kod i
> `src/` är rörd. Detta är planen Josef godkänner *innan* vi genererar något.
> Dokumentet bygger vidare på de 12 ad-hoc-cues i `AUDIO.md` och **supersedar**
> dem där det behövs för att få en sammanhållen identitet (se §6 för vad som
> ändras/behålls).

Mål: en **sammanhållen** ljudvärld, inte en lös samling SFX. Game-show-inspirerad,
varm och rolig — retro-futuristisk varieté: **vintage-brass, analog synth och
orgel**. Varm studio, aldrig kall sci-fi, aldrig barnslig. Allt hänger på ETT
igenkännbart ledmotiv som varieras genom hela upplevelsen.

Grundat i:
- **Temat/paletten** (`theme/gameshow.css`): "Marquee-skärm" — djup petrol + björkträ
  + bränd orange + creme + varma marquee-lampor + rymd/planet-motiv. Typografi
  Unbounded (display) + Hanken Grotesk. Ljudet ska låta som den skärmen ser ut.
- **Ljudmodellen** (speglar Eco Loco mellans `design/AUDIO.md`): narrativa
  stingers + ambienser, och **en central högtalare / hjärna** som spelar cues.
  Här är hjärnan `tools/hjarna-stubb.py` som prenumererar på `utmanaexperten/ljud
  <id>` och spelar `assets/audio/<id>`. Precis som Eco Locos tonala trappa (ett
  signaturljud per nivå) bygger vi en liten familj som alltid klingar som *samma*
  studio.
- **Steg-motorn** (`store/utmanaStore.ts` + `configs/formats/*.json`): 7 format =
  olika `steps[]` av samma typer `present / vote / speak_round / assess / facit /
  feedback / clip / reveal`, plus ramscenerna `attract` och `checkin`.

---

## 1. Centralt ledmotiv — "Utmana-temat"

**Känslan.** Ett kort, godmodigt varieté-tema med en glimt i ögat. Tänk vinjetten
till en 60/70-tals rymdålders-frågesport som spelats in i en varm trästudio: en
stolt men lekfull brass-fras som svarar an mot en rundad analog-synth, med en
orgel som lägger en varm matta under. Inte pampigt-pompöst, inte pajas — *varmt
inbjudande med glimten kvar*.

**Melodin (motivet).** En **5-tons signaturfras** i dur, med ett karakteristiskt
litet uppåthopp på slutet (en "frågande" lyft — passar en station som ställer en
fråga). Frasen är så kort att den kan citeras på under en sekund. Allt annat i
ljudvärlden är varianter eller ekon av just den frasen. Måttlig tempo (~100–112
bpm), så den känns pigg men inte stressig.

**Instrumentering (signatur-klangen som binder ihop allt):**
- **Vintage-brass** (ventilbrass/muted trumpet-känsla) — bär melodin i fanfar- och
  reveal-lägen. Den "stolta" rösten.
- **Analog synth** (mjuk, rundad, lätt chorus — Juno/Prophet-aktigt) — bär melodin
  i attract och i korta stingers. Den "varma/moderna" rösten.
- **Orgel** (Hammond-varm, lätt lesliesnurr) — matta och harmonisk grund, ger
  varieté-värmen och binder brass+synth.
- **Rymd-färg**: en diskret shimmer/stjärnglitter-topp (björk-ljus, inte iskall) —
  motsvarar marquee-lamporna och planet-motivet visuellt.
- Lätt analogt band-/rumsvärme (tape wobble, mjuk studioreverb) på allt, så
  ingenting låter rent digitalt.

**Hur temat varieras och återkommer** (detta är limmet — en melodi, många skepnader):

| Läge | Var | Hur temat framträder |
|---|---|---|
| **Fullt tema (loop)** | `attract` | Hela frasen, lågmäld och rund på analog synth + orgel + mjukt publiksorl. Inbjudande, går att höra i timmar utan att trötta. |
| **Vinjett-hit (kort)** | start / första `present` | Frasens 2–3 första toner som en pigg "nu kör vi!"-stöt i brass. |
| **Stinger (micro)** | stegbyten / övergångar | 1–2 toner ur frasen som ett litet nick — örat känner igen temat utan att det tar plats. |
| **Spänd/sänkt** | `nedrakning`, `tanker` | Temats harmonik men *utan* melodin — bara bädden (orgel/synth) som håller, lätt mollfärgad, så spänning byggs mot en upplösning. |
| **Trumf/fanfar (full)** | `reveal` (tänkte om) | Hela frasen i full brass-fanfar, durglad, med klockor/shimmer — temats "segervariant". |
| **Mild upplösning** | `reveal` (stod fast), `facit` | Samma fras men mjukt avrundad på orgel + mellow synth — vänligt reflekterande, inte en förlust. |

Så: samma 5 toner möter gästen i vänteläget, nickar vid varje stegbyte, och
briserar i full brass vid finalen. Det är så stationen får ett *eget ljud*.

---

## 2. Fullständig cue-lista — varje moment

Konventioner: **längd** ungefärlig; **loop** = ja/nej; **relation** = hur cuen
hänger ihop med ledmotivet. Alla filer: `assets/audio/<cue-id>.mp3`
(44.1 kHz, stereo). ✎ = ny eller omarbetad jämfört med `AUDIO.md`.

### Ram / attract / incheckning

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `attract-loop` | Vänteläge, scen `attract` (store `init()`/`reset()` sätter scenen) | 16 s | **ja** | Varm, inbjudande, mysigt publiksorl i en rymdålders-trästudio | **Fullt tema**, lågmält på synth+orgel. Sömlös. |
| `start-vinjett` ✎ | Gästen trycker för att börja → KÖR / första steget laddar | 2.2 s | nej | Pigg "nu drar vi igång"-energi, publiken vaknar till | **Vinjett-hit**: temats första 2–3 toner i brass. Avlöser attract-loopen. |
| `checkin-in` ✎ | Incheckningsvyn visas (`CheckinScreen`, "Vilka spelar?") | 1.4 s | nej | Vänlig "slå er ner"-chime, välkomnande | Mjuk synth-arpeggio byggd på temats toner. |
| `namn-klar` ✎ | Ett namn skrivs in / bekräftas per plats (valfritt, diskret) | 0.4 s | nej | Litet varmt kvitto | Samma blip-familj som `rost` (se nedan). Hålls MYCKET kort — spelas upp till 6 ggr. |

### Fråga & omröstning (`present`, `vote`)

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `fraga` | Frågan visas — steg `present` | 1.6 s | nej | Varm "här kommer frågan"-stöt, nyfiken | Vinjett-hit, kortare än start-vinjetten. Brass-stöt + liten synthsweep upp (= temats "frågande" lyft). |
| `rost` | Röst registreras — varje `castVote` (spelas ofta) | 0.4 s | nej | Satisfierande, rund knapp-kvitto | Neutral **blip-familj**: en enda ton ur temat, ingen melodi. Diskret med flit. |
| `vote-stang` | Alla har röstat / omröstning stänger | 1.3 s | nej | Varm "då var alla med"-bekräftelse, mjukt nedåt | Två-tons synth-avrundning, temats avslut-intervall. |

### Tänk-turen (`speak_round`)

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `din-tur` | Spotlight flyttas till en plats ( turen börjar / byts) | 1.5 s | nej | Teatral spotlight-whoosh + stigande shimmer, inbjudande | Övergångs-whoosh (se §3) med en liten synth-lyft ur temat på toppen. |
| `nedrakning-badd` ✎ | **Loopande** spänningsbädd medan tänk-timern räknar ned (hela turen eller sista ~8 s) | 4–6 s | **ja** | Låg, varm puls — håller spänning utan stress | **Sänkt tema**: bara harmonin (orgel/synth-puls), ingen melodi. Korsfadas in/ut mjukt. |
| `nedrakning-tick` ✎ | Sista 3–5 sekunderna av en tur (on-screen-klockan) | 0.3 s/tick | nej (upprepas) | Varm analog klock-tick, lätt urgens | Neutral perkussiv puls, samma puls-tempo som bädden. |
| `klar` | Turen klar / pratbubblan dockar | 0.6 s | nej | Mjuk rundad pop, "landat" | Rund synth-bubbla, samma blip-familj, en halvton högre än `rost` (= "klart!"). |

> **Två nivåer på nedräkningen:** `nedrakning-badd` (loop, bygger spänning hela
> tiden) + `nedrakning-tick` (markerar de allra sista sekunderna). Enklaste
> pilotvarianten: bara `nedrakning-tick`. Rikare drift: lägg bädden under.

### AI-bedömning (`assess`)

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `tanker-badd` ✎ | **Loopande** latensmask medan `/assess` körs (`assessing = true`) | 3–5 s | **ja** | Varm "experten grubblar"-bädd, bubblande rymdålders-dator, stigande shimmer | Sänkt tema + mjuk mekanisk nyfikenhet. Loopar tills svaret kommer (okänd längd). |
| `tanker-klar` ✎ | Bedömningen klar, precis innan facit/feedback visas | 0.8 s | nej | Litet "aha, nu vet jag"-pling | Uppåt-intervall ur temat — överlämnar till facit. |

> `tanker` i `AUDIO.md` var en one-shot (2.6 s). Eftersom AI-latensen är **okänd**
> blir en loop (`tanker-badd`) + en avslutning (`tanker-klar`) mycket snällare mot
> örat än en one-shot som tar slut mitt i väntan. Supersedar `tanker`.

### Facit, feedback, verklighet (`facit`, `feedback`, `clip`)

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `facit` | Rätt svar avslöjas — steg `facit` | 2.0 s | nej | Varm "svaret är…"-reveal, lätt dramatik men vänlig | **Mild upplösning**: temats fras avrundad på brass+orgel-flourish. |
| `feedback-in` ✎ | Feedback-plattorna tonar in — steg `feedback` | 1.2 s | nej | Lugn, reflekterande "här är vad experten såg" | Mjuk orgelmatta, temats harmonik utan melodi. Får gärna ligga under medan text läses. |
| `clip-in` ✎ | Verklighetsklippet introduceras — steg `clip` ("Kan det här få er att tänka om?") | 1.4 s | nej | Nyfiken "titta här"-övergång, dämpad så klippets eget ljud får plats | Övergångs-whoosh + en diskret synth-ton. Tystnar när klippet spelar. |

### Finalen (`reveal`) — före→efter

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `reveal-riser` ✎ | **Precis före** delta-siffran slår upp i `reveal` | 1.8 s | nej | Stigande spänning → släpp, "trumvirvel"-känsla | Riser (se §3) som löser upp sig i temats grundton. Bädd för fanfar/avrundning. |
| `fanfar` | Final-reveal **när gruppen tänkte om** (`delta.andrade > 0`) | 2.6 s | nej | Triumfartad, varm, glad game-show-fanfar | **Trumf/full fanfar** — hela temat i brass + klockor + shimmer. |
| `ingen-andring` | Final-reveal **när gruppen stod fast** (delta = 0) | 2.6 s | nej | Mjukare, vänligt reflekterande "ni stod för er sak" | **Mild upplösning** — temat på orgel + mellow synth. Lika varmt, inte en förlust. |
| `applad` | Direkt efter fanfar/ingen-andring, och vid `finish()` | 2.6 s | nej | Varm, entusiastisk men mysig studiopublik-applåd | Tematiskt neutral, men samma rums-/bandvärme. Lägger sig ovanpå fanfar-svansen. |

> **Två reveal-varianter är kärnan i stationen** (attityd-delta = effekten). De
> MÅSTE låta olika men lika mycket värda: `fanfar` = glad trumf, `ingen-andring`
> = varm respekt. Samma tema, två sinnesstämningar.

### Övergångar mellan steg (genomgående)

| cue-id | när | längd | loop | stämning | relation till temat |
|---|---|---|---|---|---|
| `steg-stinger` ✎ | Vid varje stegbyte (`enterStep`) som inte redan har en egen cue | 0.6 s | nej | Litet varmt "nästa!"-nick | **Micro-stinger**: 1–2 toner ur temat. Håller temat närvarande utan att dominera. |
| `whoosh` ✎ | Generisk scenövergång (återanvänds av `din-tur`, `clip-in` m.fl. vid behov) | 0.5 s | nej | Mjuk teatral svep, björk-varm | Färg, inte melodi — en snabb filtrerad synthsweep. |

---

## 3. Risers, övergångar, stingers, ambienser — var de behövs

Speglar Eco Locos uppdelning (signaturljud + grund-SFX + stingar + ambienser),
översatt till den här stationens dramaturgi:

- **Ambienser (loopar, korsfadas mjukt ~1–2 s):**
  - `attract-loop` — varm studioambiens i vänteläget (det enda gästen hör länge → mest omsorg här).
  - `nedrakning-badd` — spänningsbädd under tänk-nedräkningen.
  - `tanker-badd` — grubbel-bädd under AI-latensen.
  - (Valfritt framtida: en mycket låg "studio-rumston" som kan ligga under alla
    aktiva steg för att binda tystnaderna — flaggas som *kan vänta*.)
- **Risers:** `reveal-riser` före delta-avslöjandet är den viktigaste — den skapar
  "trumvirvel"-förväntan som gör att fanfar/ingen-andring landar. En mildare
  mikro-riser finns redan inbakad i `fraga` (synthsweep upp).
- **Övergångar / whooshes:** `whoosh` (generisk) + de tematiserade `din-tur`,
  `clip-in`. Används vid scenbyten så klippningen känns regisserad, inte hackig.
- **Stingers:** `start-vinjett`, `fraga`, `steg-stinger`, `vote-stang`,
  `tanker-klar` — korta tematiska nick som håller ledmotivet närvarande hela vägen.
- **Blip-familjen (micro-feedback):** `rost`, `namn-klar`, `klar` — samma
  klangfärg, olika tonhöjd. Måste vara korta och diskreta eftersom de spelas ofta.

Princip (från Eco Locos tonala trappa): **släkt klang, varierad tonhöjd/roll** gör
att örat alltid vet vilken station det lyssnar på.

---

## 4. Inkoppling i sömmen

**Modellen (som Eco Loco):** appen känner bara *semantik* och sänder
`utmanaexperten/ljud <id>` via rig-adaptern (`cue((r) => r.ljud('<id>'))`).
**Central-högtalaren = hjärnan** (`tools/hjarna-stubb.py`, i drift Blocks-dirigenten)
prenumererar på topicen och spelar `assets/audio/<id>` som one-shot. Filnamn =
cue-id → inga kodändringar i hjärnan för nya one-shots.

**Det appen sänder idag (enda ljud-anropet):**
`utmanaStore.ts` rad **157**, i `case 'reveal':` →
`cue((r) => r.ljud('fanfar'))` (plus `audio.play('win')` lokalt). Det är därför
final-filen måste heta exakt `fanfar.mp3`.

**Föreslagna NYA `rig.ljud('<id>')`-anrop och VAR i flödet** (detta är bara en
karta — INGEN kod ändras i detta arbete; alla rader avser `utmanaStore.ts` i dess
nuvarande skick):

| cue-id | steg / plats i koden | not |
|---|---|---|
| `start-vinjett` | `start()` (rad ~123) eller `enterStep()` första gången | avlöser attract-loopen |
| `fraga` | `enterStep()`, nytt `case 'present':` (vid rad ~160, `default`-grenen) | frågan visas |
| `rost` | `castVote()`, bredvid `cue((r) => r.rost(plats, val))` (rad **199**) | kort → ofta ok |
| `vote-stang` | `castVote()`, i `allSeatsVoted`-grenen (rad **201–205**) innan `stepComplete()` — i BÅDA lägen | ej bara `self` |
| `din-tur` | `beginSpeakRound()` rad **216** + `endTurn()` rad **232**, bredvid `cue((r) => r.aktivPlats(...))` | spotlight-byte |
| `klar` | `endTurn()` rad **228**, bredvid `audio.play('blip')` | pratbubblan dockar |
| `tanker-badd` (loop) | `runAssess()` rad **244**, direkt efter `assessing.value = true` | se loop-noten nedan |
| `tanker-klar` | `runAssess()` `finally`-grenen (rad ~272) innan `stepComplete()` | stänger grubbel-loopen |
| `facit` | `enterStep()` `case 'facit':`, efter `facitRatt.value = ratt` (rad **152–153**) | reveal av rätt svar |
| `feedback-in` | `enterStep()`, nytt `case 'feedback':` | plattor tonar in |
| `clip-in` | `enterStep()`, nytt `case 'clip':` | klipp introduceras |
| `reveal-riser` | `enterStep()` `case 'reveal':` (rad **156**) — spela FÖRE fanfaren (kort delay) | bygger förväntan |
| `fanfar` / `ingen-andring` | `case 'reveal':` rad **157** — gör villkorlig: `delta.value.andrade > 0` → `ljud('fanfar')`, annars `ljud('ingen-andring')` | ersätt det ovillkorliga `fanfar` |
| `applad` | `case 'reveal':` efter fanfar/ingen-andring, ELLER i `finish()` (rad **181**) | avrundning |
| `steg-stinger` | `enterStep()` generellt, för stegtyper utan egen cue | håller temat närvarande |

**Nedräkningen bor inte i storen.** On-screen-klockan ligger i
`components/steps/SpeakRoundStep.vue` (`secondsLeft`, rad ~36; `finalize()` vid
`ms <= 0`, rad ~65). Där triggas:
- `nedrakning-tick` när `secondsLeft` passerar de sista ~3–5 sekunderna.
- `nedrakning-badd` (loop) startas när turen börjar och stoppas vid `finalize()`.
Dessa spelas lämpligen lokalt *och/eller* via en `rig.ljud`-cue — Josef väljer;
poängen här är var i komponenten de hör hemma.

**Loopande cues (`attract-loop`, `nedrakning-badd`, `tanker-badd`):** hjärnans
`play()` är en one-shot. Som i Eco Loco-mönstret behöver loop hanteras av
central-högtalaren: antingen (a) hjärnan startar/stoppar en looping-spelare på
särskilda topics (t.ex. `.../ljud attract-loop:start` / `:stop`), eller (b) appens
egen `AudioEngine` loopar lokalt. `attract-loop` är redan gjord sömlös (16 s) för
(a). `init()` sätter scenen `attract` (rad **101**) → naturlig startpunkt;
`start()`/`reset()` naturliga stopp-punkter. **Detta är den enda inkopplingen som
kräver mer än ett filnamn — flaggas tydligt.**

---

## 5. Genererings-plan — vilket verktyg för vad

Två kategorier. Blanda dem INTE i samma verktyg.

### A. SFX — ElevenLabs text-to-SFX (skill `sound-effects`)

Lämpar sig för allt som är *textur/effekt* snarare än melodi. Riktning + längd per
cue:

| cue-id | ansats för text-to-SFX | längd |
|---|---|---|
| `attract-loop` | "warm 60s space-age TV studio ambience, soft analog synth pad, faint vintage organ hum, cozy distant audience murmur, seamless loop" | 16 s, loop |
| `rost` / `namn-klar` | "very short soft rounded vintage synth blip, satisfying button confirm, warm" | 0.4 s |
| `klar` | "short soft rounded synth bubble pop, gentle, warm" | 0.6 s |
| `vote-stang` | "short warm two-note descending synth confirmation chime" | 1.3 s |
| `din-tur` / `whoosh` | "warm theatrical spotlight whoosh with a rising synth shimmer, inviting" | 0.5–1.5 s |
| `nedrakning-tick` | "soft warm analog clock tick, single, gentle urgency" | 0.3 s |
| `nedrakning-badd` | "low warm pulsing suspense bed loop, analog synth and organ, no melody, tense but not stressful" | 4–6 s, loop |
| `tanker-badd` | "warm thinking bed loop, bubbling retro-futuristic computer, rising synth shimmer, no melody" | 3–5 s, loop |
| `tanker-klar` | "tiny warm 'aha' synth pling, upward" | 0.8 s |
| `clip-in` / `feedback-in` | "soft warm transition, gentle organ pad swell, reflective" | 1.2–1.4 s |
| `reveal-riser` | "warm rising suspense riser, analog synth sweep building to a release, drumroll feel, no melody" | 1.8 s |
| `applad` | "short warm enthusiastic studio audience applause, cozy, not huge" | 2.6 s |

> Risers, bäddar, blips, tick, whoosh, applåd och ambienser är text-to-SFX:s
> styrka — ingen igenkännbar melodi krävs.

### B. MUSIK / melodi — kräver ett MUSIK-verktyg, INTE text-to-SFX

**⚠️ Viktig flagga:** Allt som bär **ledmotivets melodi** kan text-to-SFX inte
göra pålitligt — det genererar ljud/texturer, inte en komponerad, igenkännbar
fras i en bestämd tonart/tempo. Dessa måste till ett **musik-verktyg** (t.ex.
ElevenLabs Music, Suno/Udio, eller en komponerad/samplad loop i en DAW):

- `start-vinjett` (vinjett-hit)
- `fraga` (tematisk stöt) — *gränsfall; kan lösas som SFX, men låter mer
  sammanhållet om den härleds ur temat*
- `facit` (mild tematisk flourish)
- `fanfar` (full brass-tema, trumf)
- `ingen-andring` (mild tematisk upplösning)
- `steg-stinger` (micro-nick ur temat)
- `checkin-in` (synth-arpeggio på temats toner)

**Starkt rekommenderat arbetssätt för maximal sammanhållning:** komponera/generera
**ETT** mastertema (15–30 s, full brass+synth+orgel+shimmer) i musik-verktyget.
**Klipp sedan alla musikaliska cues ur den samma inspelningen** (vinjett =
inledningen, fanfar = klimaxet, stinger = ett nick, ingen-andring = den mjuka
utklingningen, attract = en nedmixad loop). Då är det *garanterat* samma melodi i
alla skepnader — det är precis det som gör en ljudidentitet sammanhållen snarare
än en samling. SFX-cuerna i (A) läggs runt som färg.

**Nästa steg efter godkännande:** (1) ta fram/komponera mastertemat i musik-verktyg,
(2) derivera de 7 musikaliska cuerna, (3) generera SFX-familjen i ElevenLabs,
(4) lägg filerna i `assets/audio/<id>.mp3`, (5) koppla in `rig.ljud`-anropen enligt
§4. Inget av detta görs nu.

---

## 6. Vad detta ändrar mot `AUDIO.md`

- **Behålls oförändrat (filnamn):** `attract-loop`, `fraga`, `rost`, `vote-stang`,
  `din-tur`, `klar`, `facit`, `fanfar`, `ingen-andring`, `applad`. (`fanfar` MÅSTE
  heta så — appen sänder den redan.)
- **Supersedas:** `tanker` (one-shot) → `tanker-badd` (loop) + `tanker-klar`.
  `nedrakning` (one-shot) → `nedrakning-badd` (loop) + `nedrakning-tick`.
- **Nya cues:** `start-vinjett`, `checkin-in`, `namn-klar`, `feedback-in`,
  `clip-in`, `reveal-riser`, `steg-stinger`, `whoosh`.
- **Största tillägget konceptuellt:** det delade **ledmotivet** och
  master­tema-arbetssättet (§1, §5B) — det är det som gör de 12 lösa ljuden till
  en identitet.

---

## Sammanfattning

Stationen får **ett ledmotiv** — en kort, varm vintage-brass/synth/orgel-fras i
rymdålders-varieté-anda — som möter gästen i attract, nickar vid varje stegbyte
och briserar i full fanfar vid finalen. Runt det ligger en släkt familj av
SFX: blip-kvitton, teatrala whooshes, två loopande spänningsbäddar (nedräkning +
AI-grubbel), en riser före delta-avslöjandet, och två likvärdiga reveal-varianter
(glad trumf vs varm respekt) som speglar stationens hjärta: attityd före→efter.
Central-högtalaren (hjärnan) spelar allt via `utmanaexperten/ljud <id>`, precis som
Eco Loco-mönstret. Melodibärande cues görs i ett musik-verktyg och klipps ur **ett
gemensamt mastertema** för garanterad sammanhållning; resten görs i ElevenLabs
text-to-SFX. Inget ljud genereras förrän Josef godkänt planen.

**Filen ligger i:** `/Users/josefsjonneby/Kontext/Mjukvara/utmana-experten/design/ljud/LJUDIDENTITET.md`
