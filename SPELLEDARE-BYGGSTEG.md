# Spelledarfunktionen — bygg-checklista (Utmana experten)

Speglad från Eco Loco mellans `SPELLEDARE-BYGGSTEG.md`. Här gäller **Utmana
expertens** egen söm: topic-roten är `utmanaexperten` och all dirigering går via
`utmanaexperten/gm/<kommando>`. Appen äger ingen pixel — den publicerar lager-1-
cues (scen/aktiv_plats/röst/facit/timer/ljud) som **hjärnan** (`tools/hjarna-stubb.py`
nu → Blocks sen) översätter till LED. Spelledarpanelen publicerar `gm/*`; **pilot
(on-screen SpelledarePanel) och drift (Blocks-dirigent) delar väg** — samma topics.

Ett system, två lägen:
- **self** = alla steg rullar automatiskt (presentationssteg efter dwell, interaktiva
  steg när input är klar). Obemannad drift.
- **gm** = varje steg gatas; spelledaren stegar med `gm/nasta` hela tiden. Motorn
  pausar mellan steg och väntar (appen visar "Väntar på spelledaren …").

---

## 1. Panelknapparna → `utmanaexperten/gm/<cmd>` (det Blocks-spoten publicerar)

Alla knappar publicerar **icke-retained** på `gm/`. Appen (`store.onGm`) tolkar:

| Panelknapp | Topic | Payload | Effekt i appen |
|---|---|---|---|
| FORMAT (7 st) | `gm/format` | format-id (t.ex. `tyck-till-facit`) | väljer format (`selectFormat`) |
| LÄGE · Självgående | `gm/mode` | `self` | self-läge (auto) |
| LÄGE · Spelledare | `gm/mode` | `gm` | gm-läge (gatat) |
| START | `gm/start` | `1` | startar omgången (lämnar attract) |
| NÄSTA ▸ | `gm/nasta` | `1` | stegar till nästa steg (bara i gm) |
| PAUS / FORTSÄTT | `gm/paus` | `1` paus · `0` fortsätt · tomt = toggla | fryser/återupptar motorn |
| OMSTART | `gm/reset` | `1` | nollställer till attract |
| MASTER | `gm/master` | `1` ta över · `0` släpp | tystar appens lager-1-cues |

> Format-id:n: `tyck-till-facit`, `syna-experten`, `andra-dig`, `prata-in`,
> `radgivaren`, `spa-utfallet`, `ta-parti` (se `configs/formats/*.json`).

Hårdvaru-knapparna på borden publicerar i stället `utmanaexperten/knapp`
`{"plats":N,"knapp":"ja|nej|kanske"}` — röstning, och "klar"-knapp i tänk-turen.

---

## 2. Master-lås (speglar Eco Locos `gmMaster`)

`gm/master 1` → **två** lager tystnar oberoende:
- **Appen** (`masterLocked`): `cue()` blir no-op → inga scen/röst/facit-cues ut.
- **Hjärnan** (`hjarna-stubb.py` `master`): släpper alla app-cues, bara `gm/*` körs.

`gm/master 0` → båda släpper taget och looken rättar sig vid nästa cue.
I Blocks: en realm-variabel `gmMaster` (Boolean), MASTER-knappen växlar den och
publicerar `gm/master` 1/0; tasks som renderar app-cues villkoras med `!gmMaster.value`.

---

## 3. Per-steg-gating (vad spelledaren faktiskt styr)

| Stegtyp | self (auto) | gm (gatat) |
|---|---|---|
| present | auto efter dwell (20 s, `dwellSeconds` överstyr) | väntar på `gm/nasta` |
| vote | auto när alla platser röstat | väntar; "klar"-signal när alla röstat |
| speak_round | auto när sista platsen är klar | väntar på `gm/nasta` efter sista turen |
| assess | auto när bedömningen är klar | väntar på `gm/nasta` |
| facit | auto efter dwell | väntar på `gm/nasta` |
| feedback | auto efter dwell | väntar på `gm/nasta` |
| clip | auto efter dwell | väntar på `gm/nasta` |
| reveal | auto efter dwell (avslutar) | väntar på `gm/nasta` |

Spelledaren behöver i praktiken bara: välja FORMAT, välja LÄGE, START, och sedan
NÄSTA ▸ mellan stegen (gm). PAUS/MASTER/OMSTART vid behov.

---

## 4. Look-tabell — scen/cue → LED (hjärnan/Blocks återskapar den)

Detta ÄR specen Blocks översätter (källa: `tools/hjarna-stubb.py`, frusen lager 1).
Platser = tredjedelar i LED-stripen; `ja=1 · nej=2 · kanske=3`.

| App-cue (lager 1) | När | Look (alla platser om ej annat) |
|---|---|---|
| `scen attract` | vänteläge | blå-dämpad puls `h200 s60 v18 puls20` |
| `scen present` | frågan visas | dämpad `h30 s40 v12` |
| `scen vote` | röstning | neutral vänteljus `h35 s30 v20` (nollställer tredjedelar) |
| `scen speak` | tänk-tur | övriga dämpade; aktiv plats spot (se nedan) |
| `scen facit` | facit | rätt tredjedel tänds/blinkar på ALLA platser |
| `scen reality` | verklighetsklipp | dämpad `h30 s40 v12` |
| `scen verdict` | reveal/slut | `fx sweep` + fanfar-ljud |
| `aktiv_plats N` | i speak | plats N = spot `h0 s0 v90 puls50`, övriga dämpade |
| `rost {plats,val}` | röst lagd | kvitto: platsens tredjedel i röstfärgen |
| `facit_ratt {val}` | facit | rätt tredjedel blinkar (`blink60`) på alla |
| `ljud <id>` | show-ljud | spela upp (central högtalare) |

Röstfärger: `ja h120 s90 v90` · `nej h0 s100 v90` · `kanske h50 s100 v80`.

Rena rigg-gm (hanteras av hjärnan, inte appen): `gm/alla_slack`, `gm/musik <id>`,
`gm/plats/<N> <av|ja|nej|kanske>`.

---

## 5. Verifiering (gjord i pilot via on-screen-panelen)

- **self:** presentationssteg auto-stegar efter dwell (present → vote verifierat);
  interaktiva steg stegar när input är klar.
- **gm:** varje steg gatar; NÄSTA ▸ "ropar" (pulsar) när motorn väntar; `gm/nasta`
  stegar ett steg i taget; inget auto-hopp.
- **MASTER:** `gm/master 1` → appens cues tystas (verifierat: röst-cue uteblev i
  loggen); `0` → cues tillbaka.
- **PAUS:** `gm/paus` fryser motorn + paus-overlay; dwell-nedräkningen stoppas och
  återupptas vid fortsätt.

I drift: bygg motsvarande knappar i Blocks-spoten (realm `Utmana experten`), bind
var och en till en `publish`-sats på rätt `utmanaexperten/gm/<cmd>` enligt §1, och
`gmMaster`-variabeln enligt §2. Ljud-spoten byggs sist, separat.

---

## 6. Fjärr-spelledaren: eget fönster på annan skärm/enhet

I drift sitter spelledaren **inte** på stationsskärmen — kontrollen körs i ett eget
webbfönster (`spelledare.html`) på en annan skärm eller surfplatta. Det är samma
söm: fönstret publicerar `gm/*` (och `knapp` för test) och **speglar motorn** via
en ny retained topic:

| Topic | Riktning | Payload | Syfte |
|---|---|---|---|
| `utmanaexperten/status` | app → spelledare (**retained**) | hela motor-läget (JSON) | live-vy: fas, format, läge, steg X/Y, väntar, paus, master, platsnamn, röst-slottar, röster |

`status` är **kontroll-plan, inte en ljus-cue** → publiceras alltid, även under
master-lås (annars tappar spelledaren läget när hen tagit över riggen). Retained
→ ett sent anslutet spelledar-fönster får direkt aktuellt läge. Fälten: se
`StatusSnapshot` i `src/station-kit/adapters/rig/Rig.ts`.

**Öppna fönstret (surfplatta/laptop mot stationens broker):**

```
http://<station-ip>:8787/spelledare?mqtt=ws://<station-ip>:9001
```

- `?mqtt=` pekar på stationens MQTT-over-WS (mosquitto-listener 9001). Utan den
  frågar fönstret efter broker-URL och sparar den lokalt.
- `?root=` byter topic-rot (default `utmanaexperten`).
- Stationskärmen körs själv med `?mqtt=ws://localhost:9001` så sömmen är live.
- Brokern måste lyssna på `0.0.0.0:9001` (inte bara localhost) så surfplattan når
  den över nätet — samma delade broker som övriga stationer, isolerad per topic-rot.

Fönstret visar: anslutnings-prick, fas/format/läge/steg, FORMAT-chips (låsta =
ej byggda), LÄGE-segment, START · NÄSTA ▸ (pulsar när motorn gatat) · PAUS,
MASTER, OMSTART, och per plats live-röst + testknappar märkta efter formatets
svarsalternativ (ja/nej/kanske el. namngivna, t.ex. Höj lönen/Ny teknik/Synlighet).

> On-screen-panelen (`SpelledarePanel.vue`) finns kvar för enskärms-pilot/dev;
> i drift är `spelledare.html` kontrollytan. Blocks-dirigenten kan ersätta/komplettera
> fönstret — den publicerar samma `gm/*` och kan läsa `status` för sin egen vy.

**Verifierat (två fönster mot delad broker, MQTT-over-WS):** spelledar-fönstret
anslöt, speglade stationens format/läge/platsnamn/slottar live; `gm/format`,
`gm/mode`, `gm/start` (lämnade attract), `gm/nasta` (gatat steg) och simulerade
`knapp` (namngivna alternativ → rätt position → röstfärg på hästskon) drev
stationen end-to-end; `status` uppdaterade fönstrets steg/röster i realtid.
