# Koppling & test — ESP32-S3-DevKitC-1 (prototyp, lokal broker i Malmö)

Rigg = **1 m WS2812B-list (6 platser)** + **1 arkadknapp (= "ja", plats 1)** på en
ESP32-S3. Sketchen: `utmana_rigg_esp32s3/utmana_rigg_esp32s3.ino`.

## Pinnar (ESP32-S3-DevKitC-1)

Samma plint/koppling som **Eco Loco mellan** (tre trådar: 5V, GND, data; WS2812B/GRB;
gemensam GND; **3,3 V data rakt in** på kort strip — ingen level-shifter).

| ESP32-S3 | → | Till | Not |
|---|---|---|---|
| **GPIO21** | → | LED-listens **DIN** (data rakt in) | = Eco Locos live-pin, S3-säker |
| **GND** | → | LED-listens **GND** | gemensam jord (OBLIGATORISK) |
| **5V** (USB-5V) | → | LED-listens **+5V** | prototyp: få tända LED → USB räcker |
| **GPIO4** | → | **knapp** → **GND** | INPUT_PULLUP, tryck = LOW |

Data går **rakt in** på DIN (som Eco Loco — "1 m funkar oftast med 3,3 V data rakt in").
Valfri extra robusthet (ej nödvändigt för 1 m): **330–470 Ω** i serie på DIN + **1000 µF**
över +5V/GND nära inmatningen. Håll kablarna korta.

### Ström
- **Prototyp** (bara några tredjedelar lyser åt gången): mata allt via **USB** — 5V-pinnen
  driver listen, `BRIGHTNESS 180` i sketchen håller strömmen nere. OK.
- **Drift / full ljusstyrka**: 60 LED/m på full vit ≈ 3,6 A → använd en **extern 5 V-PSU**
  till listen, och koppla **PSU-GND ihop med ESP-GND** (gemensam jord). Höj då `BRIGHTNESS` mot 255.
- Undvik att driva hela listen full vit från USB — det kan bruna ut kortet.

### Pinval (S3) — och varför de skiljer från Eco Loco/Färgkapsel
- **Data GPIO21:** Eco Locos data-pin är ett config-val (deras exempel GPIO5, live GPIO21).
  Jag använder **21** så .ino och PlatformIO-firmwaren (`firmware/rigg-esp`) säger samma sak;
  21 är S3-säker och utbruten på DevKitC-1.
- **Knapp GPIO4:** Färgkapsel kör **GPIO27** — men det funkar BARA på classic ESP32-WROOM.
  På **S3** är 26–32 flash/PSRAM → GPIO27 går inte. GPIO4 är S3-säker (samma debounce-mönster).
- S3-säkra alternativ om du vill byta: GPIO 4, 5, 6, 7, 15, 16, 17, 18, 21. Undvik 0, 3, 19, 20, 26–37, 43–46, 48.

## Arduino IDE
1. **Boards Manager** → installera **esp32 by Espressif** (v3.x).
2. Välj kort **"ESP32S3 Dev Module"**. Sätt **USB CDC On Boot: Enabled** (annars ingen seriemonitor).
3. **Library Manager** → installera: **FastLED** (≥ 3.7.0), **PubSubClient** (Nick O'Leary),
   **ArduinoJson** (v7, Benoit Blanchon).
4. Hemligheter: `cp secrets.example.h secrets.h` i sketch-mappen och fyll i `WIFI_SSID`,
   `WIFI_PASS`, `MQTT_HOST` (Mint-lådans/Macens IP). `secrets.h` är gitignore:ad — aldrig i git.
5. Ladda upp. Öppna seriemonitorn (115200) → ska visa `WiFi OK, IP …` + `MQTT connected + subscribed`.

> Om FastLED krånglar på S3: uppdatera FastLED till senaste; i nödfall funkar Adafruit
> NeoPixel som fallback (samma pin/koppling, annan render-kod).

## Broker på din Mac (Malmö)
```bash
cd /Users/josefsjonneby/Kontext/Mjukvara/utmana-experten
ipconfig getifaddr en0            # ← din Macs LAN-IP (sätt den som MQTT_HOST i .ino)
mosquitto -c tools/mosquitto-utmana.conf -v     # 1883 (ESP) + 9001 (webb-WS)
```
ESP:en och din Mac måste vara på **samma nät** (samma WiFi/LAN).

## Koppla ihop med webappen
```bash
python3 tools/hjarna-stubb.py                   # hjärnan: rost → LED-färg (+ ljud)
cp server/.env.example server/.env              # om ej gjort; AI_API_KEY för assess (ElevenLabs finns redan)
npm run gateway                                 # AI (assess) + /speak
npm run dev
```
Öppna appen **med MQTT på**, mot Macens IP:
`http://localhost:5173/?mqtt=ws://<MAC-IP>:9001`  (lokalt: `ws://localhost:9001`)

## Testa hela kedjan
1. **Bara firmware (LED):** `tools/mock-rigg-granular.sh demo` → listen ska spela scener (tredjedelar, sweep, countdown).
2. **Bara knapp:** tryck knappen (eller `t` i seriemonitorn) → monitorn visar `knapp -> {"plats":1,"knapp":"ja"}`, och `mosquitto_sub -t 'utmanaexperten/#' -v` visar den.
3. **Allt ihop:** starta en omgång i appen → gå till ett **vote-steg** → tryck knappen →
   plats 1 tänds grön **på skärmen** (hästskon) **och** på **listen** (plats 1, tredjedel 1).
4. **Flera platser nu (1 knapp):** använd ⚙-panelens TEST-knappar eller `tools/mock-knapp.sh 3 kanske` tills fler fysiska knappar kopplas.

## När fler knappar kopplas (drift)
Full rigg = 6 platser × 3 knappar (18 st). I sketchen: gör `BTN_PLATS`/`BTN_KNAPP`/`BTN_PIN`
till arrayer (se PlatformIO-firmwaren `firmware/rigg-esp` som redan har array-stödet), eller
en ESP per några platser. Signalen (`utmanaexperten/knapp {plats,knapp}`) är densamma.
