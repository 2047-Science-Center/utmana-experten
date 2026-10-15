# Teknisk ryggrad — koppla ihop allt (prototyp)

Minsta end-to-end: **knapp → MQTT → app (röst) → hjärna → LED-list**, plus **app → ChatGPT**.
Hårdvaran nu: 1 m WS2812B-list (6 platser), **1 arkadknapp (= "ja")**, 1 ESP32.

```
[knapp]→ESP32 ──utmanaexperten/knapp {plats:1,knapp:"ja"}──▶ [broker] ──▶ [APP]
                                                                   │  röst registreras, publicerar:
                                                                   ▼  utmanaexperten/rost {plats:1,val:"ja"}
                                                            [hjärna] ──utmanaexperten/out/led/1/del/1 (grön)──▶ [ESP32]→[LED-list]
[APP] ──POST /assess (turns[])──▶ [gateway] ──▶ ChatGPT
```

Fyra processer + firmware. Starta i denna ordning.

## 0. Broker (mosquitto) — 1883 (ESP) + 9001 (webb-WS)
```bash
mosquitto -c tools/mosquitto-utmana.conf -v
```
Kör på din Mac. ESP:en och appen ansluter till din Macs LAN-IP (`ipconfig getifaddr en0`).

## 1. Firmware (du flashar själv)
```bash
cd firmware/rigg-esp
cp src/config.example.h src/config.h      # redigera: WIFI_SSID/PASS, MQTT_BROKER = din Macs IP
pio run -e esp32dev -t upload             # eller -e nodemcuv2 / -e esp32-s3
pio device monitor                        # ska visa "WiFi OK" + "MQTT connected + subscribed"
```
config.h är redan satt för **6 platser på 60 px** + **1 knapp (plats 1, "ja") på GPIO27** (husets
konvention, samma som Färgkapsel: knapp mellan GPIO27 och GND, INPUT_PULLUP, tidsbaserad debounce).
Är listen 30/m: ändra NUM_LEDS + SEAT_STARTS/ENDS (kommenterat i filen). Testa utan knapp: skicka `t` i
seriemonitorn (= tryck plats 1).

## 2. Hjärnan (dirigent-stubb — översätter röst → LED-färg)
```bash
NUM_SEATS=6 python3 tools/hjarna-stubb.py
```
Lyssnar på `utmanaexperten/rost|scen|aktiv_plats|facit_ratt` och publicerar granulära `out/led/...`.

## 3. Gateway (ChatGPT) — behövs för AI-steget
```bash
cp server/.env.example server/.env        # fyll i AI_API_KEY
npm run gateway
```
Utan nyckel faller `/assess` mjukt till platshållartext (flödet funkar ändå för LED/knapp-testet).

## 3b. Ljud-enhet — Anker som mic in + ljud ut (speglar Minnestestet)
Samma mönster som Minnestestet (`MIC_SOURCE`/`AUDIO_SINK`): sätt SYSTEMETS default
in/ut → Web Speech (appen) och `afplay` (hjärnans SFX) följer den. Default = Anker.
```bash
brew install switchaudio-osx     # en gång (macOS)
tools/audio.sh                   # sätt in+ut till Anker (spelets standard)
tools/audio.sh status            # kontrollera
```
Byt högtalare i farten (utan omstart):
```bash
tools/audio.sh out "Högtalare i MacBook Pro"     # tools/audio.sh list visar namnen
```
Överstyr default utan att redigera skriptet: `AUDIO_SINK="..." MIC_SOURCE="..." tools/audio.sh`.
I drift (NUC) går samma vars i `kiosk.env` och sätts med `pactl` — skriptet gör rätt per OS.

## 4. Appen — ansluten till MQTT-bussen
```bash
npm run dev
```
Öppna **med MQTT på**: `http://localhost:5173/?mqtt=ws://localhost:9001`
(På annan dator/NUC: byt localhost mot Macens IP.)

---

## Verifiera (minsta beviset)
1. Starta en omgång (tyck-till-facit) → gå till ett **vote-steg**.
2. **Tryck på knappen** → monitorn visar `knapp -> {"plats":1,"knapp":"ja"}`.
3. Appen: plats 1 tänds grön på skärmen **och** listens plats 1 (px 0–2, tredjedel 1) tänds grön.
4. Kör ett **speak_round** → **assess** → ser du riktig AI-text (med nyckel) är hela spelet ihopkopplat.

## Felsök / testa delar var för sig
```bash
# Se ALLA meddelanden på bussen:
mosquitto_sub -h localhost -t 'utmanaexperten/#' -v

# Mocka knappen utan hårdvara (appen öppnad med ?mqtt=...):
tools/mock-knapp.sh 1 ja

# Testa LED-listen direkt (bara firmware, ingen app/hjärna):
tools/mock-rigg-granular.sh demo
```

## Vad som är kvar efter att ryggraden står
- Skriva **regelverket** till AI:n (gateway-config `server/instructions/utmana.sv.txt`).
- **Spelform för test:** `tyck-till-facit` (finns, platshållar-copy klar) — mäter attityd före→efter.
- Ny **skärm-look** (Marquee + hästsko) byggs när designspåret är valt.
