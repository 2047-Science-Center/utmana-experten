# Utmana experten

Flerpersons röst-/AI-bedömningsstation för 2047 Science Center. 1–6 unga tar
ställning till en fråga från arbetslivet, möter verkligheten och tänker om —
**attityd mäts före→efter** (glappet = effekten).

Stationen binder ihop två befintliga byggen:

- **Minnestestets motor** — station-kit (Lager A) + det frysta `/assess`-kontraktet
  (AI på riktigt, ingen mock).
- **Eco Loco mellans rigg-söm** — tvålagers-MQTT (semantik → hjärna/Blocks →
  granulär firmware) för LED/ljud + spelledare.

Allt drivs av en **komponerbar steg-motor**: ett format = en ordnad `steps[]` av
typade byggstenar (`present/vote/speak_round/assess/facit/feedback/clip/reveal`)
i en config. De 7 formaten är olika steg-listor på SAMMA motor — nytt format =
ny config, ingen kodändring.

## Arkitektur
```
Lager A  src/station-kit/        återanvänt kit (tema, Teletype, CRT, audio, i18n,
                                  capture, adaptrar: assess/speak/result/transport/rig)
Lager B  src/stations/utmana-experten/
           engine/               ren, testbar motor (sequencer, knapp, types)
           store/utmanaStore.ts  sekvenseraren (Pinia)
           components/ steps/     tunna vyer ovanpå kitet
           configs/formats/*.json 7 format (data)
           theme/gameshow.css     game-show-tema (tokens)
server/                           AI-gateway (/assess + /speak), config-driven
firmware/rigg-esp/                dum renderare: LED-tredjedelar + knapp→MQTT
tools/                            hjärna-stubb (dirigent) + mockar + broker-conf
```

Pilot↔drift byts på EN plats: `config.mode` + adapter-fabriken. Inga hemligheter
i git (nycklar i `server/.env`, firmware i `config.h` — båda gitignore:ade).

## Kör pilot (tyck-till-facit, end-to-end)
```bash
npm install
cp server/.env.example server/.env        # fyll i AI_API_KEY (Josefs nyckel)
npm run gateway                            # terminal 1 — AI på riktigt
npm run dev                                # terminal 2 — appen
```
Öppna appen → tryck för att börja (självgående). Spelledarläge/format via ⚙-panelen
(speglar Blocks-dirigenten via samma `gm/*`-söm).

### Med rigg (LED/knapp)
```bash
mosquitto -c tools/mosquitto-utmana.conf -v   # 1883 (ESP) + 9001 (webb-WS)
python3 tools/hjarna-stubb.py                 # dirigenten (lager1→lager2)
# öppna appen med ?mqtt=ws://localhost:9001 → mosquitto_pub når knapp-topicen
tools/mock-knapp.sh 1 ja                       # mocka en arkadknapp
```

## Söm (frysta kontrakt)
- **AI:** `POST /assess` (frysta multi-speaker-kontraktet: `turns[]` + `focus`
  = perPerson) → `{ assessment:{band,svar_text} }`. `POST /speak` (ElevenLabs,
  server-side, av i pilot).
- **Rigg lager 1 (app→hjärna):** `utmanaexperten/scen|aktiv_plats|rost|facit_ratt|timer|ljud`.
- **Rigg lager 2 (hjärna→firmware):** `utmanaexperten/out/led/<1-6>[/del/<1-3>]|fx`.
- **Knapp in (ESP→app):** `utmanaexperten/knapp {plats,knapp}`.
- **Resultat (av i pilot):** `station<N>/result` — `result_value` = attityd-delta.

## Test
```bash
npm test          # sequencer, knapp-logik, assess-adapterns kontraktsform
npm run typecheck
```

## Status & ägarskap
Se `bestallning-utmana-experten-claude-code.md` (grundprompten) för DoD,
hårdvarubeställning till Erik och gateway-härdning (Emil). Prototyp-firmware =
1 strip + 1 knapp + tredjedels-primitiven; skarp 18-knapps-rigg byggs när sömmen
frysts.
