# Ljudsättning — Utmana experten

Ljud-cues för game-show-stationen, framtagna med ElevenLabs text-to-SFX.
Vibe: retro-futuristisk 60/70-tals rymdålders-TV-studio — varm, teatral,
game-show. Petrol + björkträ + bränd orange + creme + varma marquee-lampor.
Varm studio, inte kall sci-fi, inte barnslig. Korta distinkta one-shots + en loop.

Alla filer ligger i `assets/audio/<cue-id>.mp3` (44.1 kHz, 128 kbps stereo).
Hjärnan (`tools/hjarna-stubb.py`) spelar `assets/audio/<id>.<ext>` när appen
sänder `utmanaexperten/ljud <id>` (eller via `gm/musik <id>`).

## Cue-tabell

| cue-id | filnamn | när det spelas (steg/scen) | prompt-beskrivning (kort) | längd | loop |
|---|---|---|---|---|---|
| `attract-loop` | attract-loop.mp3 | Vänteläge / attract — scen `attract`, innan start | Varm 60-tals rymdålders-studioambiens, mjuk analog synthpad, vintage-orgelsus, mysigt publiksorl | 14.0 s | **ja** |
| `fraga` | fraga.mp3 | Frågan dyker upp — steg `present` | Kort varm "nu kör vi"-sting, ljus vintage-brass-stöt + snabb stigande synthsweep | 1.6 s | nej |
| `rost` | rost.mp3 | Röst registrerad — vid varje `castVote` (spelas ofta → diskret/kort) | Mycket kort mjuk rundad vintage-synthblip, satisfierande knapp-kvitto | 0.5 s | nej |
| `vote-stang` | vote-stang.mp3 | Alla har röstat / omröstning stänger | Kort varm chime, mjukt nedåtgående vintage-synth-bekräftelse | 1.4 s | nej |
| `din-tur` | din-tur.mp3 | Tänk-turen börjar, spotlight på en plats | Varm teatral spotlight-whoosh + stigande synth-shimmer, inbjudande | 1.6 s | nej |
| `nedrakning` | nedrakning.mp3 | Nedräkning sista sekunderna (timer) | Subtil varm analog klock-tick, mjuk rytmisk nedräkning, lätt urgens | 2.2 s | nej |
| `klar` | klar.mp3 | Turen klar / pratbubblan dockar | Mjuk rundad pop, vintage-synth-bubbla som dockar | 0.7 s | nej |
| `tanker` | tanker.mp3 | Experten tänker (latensmask under `assess`) | Varm tänk-bädd, stigande synth-shimmer + bubblande grubbel, rymdålders-dator | 2.6 s | nej |
| `facit` | facit.mp3 | Facit / rätt svar avslöjas — steg `facit` | Varm reveal-sting, vintage-brass + synthflourish, "svaret är…" | 2.0 s | nej |
| `fanfar` | fanfar.mp3 | **Final-reveal, gruppen tänkte om** — steg `reveal` (appen sänder redan detta) | Triumfartad varm game-show-fanfar, vintage-brass + klockor, glad | 2.6 s | nej |
| `ingen-andring` | ingen-andring.mp3 | Final-reveal, ingen ändrade sig | Mjukare varm avrundning, vintage-orgel + mellow synth, vänligt reflekterande | 2.6 s | nej |
| `applad` | applad.mp3 | Applåder (efter reveal / vid finish) | Kort varm studiopublik-applåd, entusiastisk men mysig | 2.6 s | nej |

## Så kopplas det in

**Sömmen:** appen känner bara semantik och sänder `utmanaexperten/ljud <id>`
(se `src/station-kit/adapters/rig/Rig.ts` → `rig.ljud(id)`). Hjärnan
(`tools/hjarna-stubb.py`) prenumererar på `utmanaexperten/ljud` och spelar
`assets/audio/<id>.mp3` som one-shot (`afplay`/`mpg123`/`ffplay`). Filnamn =
cue-id, så inga kod­ändringar i hjärnan behövs för de nya ljuden.

**Redan inkopplat idag:** `src/stations/utmana-experten/store/utmanaStore.ts`
rad **145** i `reveal`-caset sänder `cue((r) => r.ljud('fanfar'))`. Det är enda
`rig.ljud`-anropet i appen just nu — därför var kravet att final-filen heter
exakt `fanfar.mp3`. ✔

**Förslag på fler `rig.ljud('<id>')`-anrop** (ändra INTE koden själv — detta är
bara var de kan läggas, alla i `utmanaStore.ts`):

| cue-id | föreslagen plats i utmanaStore.ts | not |
|---|---|---|
| `fraga` | `enterStep()`, nytt `case 'present':` i switchen (~rad 127) | spelas när frågan/steget visas |
| `rost` | `castVote()`, direkt efter `cue((r) => r.rost(plats, val))` (rad **187**) | kort → stör inte att den spelas ofta |
| `vote-stang` | `castVote()`, i `allSeatsVoted`-grenen (~rad **189**) innan `stepComplete()` | sänd i båda lägen, inte bara `self` |
| `din-tur` | `beginSpeakRound()` rad **203** + `endTurn()` rad **220**, bredvid `cue((r) => r.aktivPlats(...))` | spotlight-byte till ny plats |
| `klar` | `endTurn()` rad **216**, bredvid `audio.play('blip')` | pratbubblan dockar |
| `tanker` | `runAssess()` rad **231**, direkt efter `assessing.value = true` | maskar AI-latensen |
| `facit` | `enterStep()` `case 'facit':` efter `facitRatt.value = ratt` (~rad **141**) | reveal av rätt svar |
| `ingen-andring` | `enterStep()` `case 'reveal':` rad **144–147** — gör villkorlig: `delta ≠ 0` → `ljud('fanfar')`, annars `ljud('ingen-andring')` | ersätt det ovillkorliga `fanfar` |
| `applad` | `case 'reveal':` efter fanfar/ingen-andring, ELLER `finish()` rad **174** | kort applåd som avrundning |

**`nedrakning`** styrs inte från storen utan av on-screen-klockan i
tänk-tur-komponenten (storen sänder bara `r.timer(plats, sekunder)`). Lägg
anropet där klockan passerar de sista sekunderna (t.ex. vid ~5 s kvar), inte i
`utmanaStore.ts`.

**`attract-loop` (loop!):** hjärnans `play()` är en one-shot utan loop, så en ren
`ljud attract-loop` skulle spelas en gång. Rekommendation: låt hjärnan starta
loopen i `apply_scen()` `attract`-grenen (`tools/hjarna-stubb.py`) med en
looping-spelare, eller loopa den i appens egen `AudioEngine`. Filen är gjord
sömlös (14 s) för just detta. `init()` i storen sätter redan scenen på rad **99**
(`cue((r) => r.scen('attract'))`) — det är den naturliga triggerpunkten.
