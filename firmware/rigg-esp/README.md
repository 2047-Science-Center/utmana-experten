# rigg-esp — prototyp-firmware (Utmana experten)

Dum renderare, spegel av Eco Loco mellans `rigg-esp`. Firmwaren känner bara
**lager 2** (granulära primitiver) och ritar dem; all mening bor uppåt
(hjärnan/Blocks). Två tillägg mot Eco Locos firmware:

1. **Tredjedels-primitiven** — varje plats delas i tre (ja/nej/kanske) så varje
   plats röstvisning kan ske per tredjedel.
2. **Knapp-in** — läser arkadknapp(ar) och publicerar `utmanaexperten/knapp`.

## Koppling (samma som Eco Loco)
- WS2812B-strip: 5 V + **gemensam GND**, data (3,3 V) rakt in på `LED_PIN`.
- Arkadknapp: mellan `BTN_PIN` och GND (aktiv-låg, `INPUT_PULLUP`).

## Topics
| Riktning | Topic | Payload |
|---|---|---|
| in | `utmanaexperten/out/led/<1-N>` | `{h,s,v,puls,blink}` hela platsen |
| in | `utmanaexperten/out/led/<1-N>/del/<1-3>` | `{h,s,v}` en tredjedel |
| in | `utmanaexperten/out/fx` | `{fx:"none\|sweep\|countdown",speed}` |
| ut | `utmanaexperten/knapp` | `{plats,knapp}` vid knapptryck |

## Bygg & flasha (gör själv — kommandon, kör dem inte åt dig)
```bash
cp src/config.example.h src/config.h      # fyll i WiFi/MQTT + pinnar (gitignore:ad)
pio run -e esp32dev -t upload             # eller -e nodemcuv2 / -e esp32-s3
pio device monitor
```

## Testa utan app
```bash
# 1) broker
mosquitto -c ../../tools/mosquitto-utmana.conf -v
# 2) driv firmwaren direkt (lager 2)
../../tools/mock-rigg-granular.sh demo
# tryck på knappen → ska se:  [rigg] knapp -> {"plats":1,"knapp":"ja"}
```

## Geometri
Byt **bara** `NUM_SEATS` + `SEAT_STARTS`/`SEAT_ENDS` när LED-antal/platser ändras
(prototyp: 1 plats/30 px → drift: 6 platser/180 px). Resten är oförändrat.
