# Beställning till Erik — Testrigg "Utmana experten" (2 spelare)

Bygg en **testlåda som simulerar två spelare**: 6 arkadknappar (plats 1 & 2, var sin
**JA / NEJ / KANSKE**) + en kort **WS2812B-list** uppdelad i 2 platser, allt på din
**Waveshare ESP32-S3-ETH**. Knapptryck ska skickas som MQTT, och listen ska lysa i rätt
plats/tredjedel. Inget beteende/logik bygger du — bara signalerna (allt ligger i firmwaren här).

Mapp: allt du behöver ligger här i `bestallning-erik/`:
- `utmana_rigg_test2_esp32s3eth/` — Arduino-sketchen (+ `secrets.example.h`)
- `kopplingsschema.svg` — kopplingsschema (öppna i webbläsare)
- den här filen — pinnar + flash + test

---

## 1. Pinnar (Waveshare ESP32-S3-ETH)

**Knappar** — varje knapp: **GPIO → knapp → GND** (intern pull-up, tryck = LOW, polaritet spelar ingen roll):

| Spelare | Knapp | GPIO |
|---|---|---|
| 1 | JA | **GPIO15** |
| 1 | NEJ | **GPIO16** |
| 1 | KANSKE | **GPIO17** |
| 2 | JA | **GPIO18** |
| 2 | NEJ | **GPIO1** |
| 2 | KANSKE | **GPIO2** |
| — | alla knappars andra ben | **valfri GND** (gemensam) |

**LED-list (WS2812B, 2 platser):**

| List | → | ESP32-S3-ETH |
|---|---|---|
| **DIN** | → | **GPIO38** (data rakt in på kort strip) |
| **+5V** | → | **5V / VBUS** |
| **GND** | → | **GND** (gemensam med knapparna) |

**Varför just dessa pinnar:** de är fria på ditt kort. Undvikna (upptagna): W5500/Ethernet
**9–14**, SD-kort **4–7**, PSRAM **33–37**, USB **19/20**, UART **43/44**, strapping **0/3/45/46**,
onboard-RGB **21**. Därför går testets pinnar att behålla även när vi slår på **Ethernet** i drift.

> Ström: en kort testlist (2×~10 LED) klarar sig på kortets 5V/VBUS. Vill du köra en längre
> strip på full ljusstyrka → extern 5V-PSU med **gemensam GND**.

---

## 2. Arduino IDE — installera & flasha (du gör själv)

1. **Boards Manager** → installera **esp32 by Espressif** (v3.x).
2. Välj kort **"ESP32S3 Dev Module"**. Inställningar: **USB CDC On Boot: Enabled**,
   **PSRAM: "OPI PSRAM"**, Flash Size 8MB (matchar modulen).
3. **Library Manager** → installera **FastLED** (≥3.7), **PubSubClient** (Nick O'Leary),
   **ArduinoJson** (v7).
4. Hemligheter: i sketch-mappen, `cp secrets.example.h secrets.h` och fyll i:
   - `WIFI_SSID`, `WIFI_PASS`
   - `MQTT_HOST` = brokerns IP (Josefs dator / Mint-lådan — fråga Josef; `hostname -I`)
   `secrets.h` ska **aldrig** checkas in (gitignore:ad).
5. Öppna `utmana_rigg_test2_esp32s3eth.ino`, ladda upp. Seriemonitor (115200) ska visa
   `WiFi OK, IP …` + `MQTT connected + subscribed`.

---

## 3. Koppling

Se `kopplingsschema.svg`. Kort: 6 knappar var och en mellan sin GPIO och GND; listen med
3 trådar (+5V, DIN→GPIO38, GND). **Gemensam GND** för allt (obligatoriskt). Du bygger det i
en testlåda så två personer kan trycka JA/NEJ/KANSKE var för sig.

---

## 4. Testa

- **Knapparna:** öppna seriemonitorn och tryck → ska visa t.ex. `knapp -> {"plats":1,"knapp":"ja"}`.
  (Utan knapp: skicka `t` i monitorn = plats 1 "ja".) Josef ser dem på bussen med
  `mosquitto_sub -t 'utmanaexperten/knapp' -v`.
- **Listen:** Josef driver den från sin sida (`tools/mock-rigg-granular.sh demo` eller hela
  spelet) — plats 1/2 ska tändas i rätt färg (ja=grön, nej=röd, kanske=gul) per tredjedel.

---

## 5. Signalkontrakt (fryst — det enda vi kommer överens om)

| Riktning | Topic | Payload |
|---|---|---|
| ESP → app | `utmanaexperten/knapp` | `{"plats":1-2,"knapp":"ja\|nej\|kanske"}` |
| app → ESP | `utmanaexperten/out/led/<1-2>` | `{h,s,v,puls,blink}` (hela platsen) |
| app → ESP | `utmanaexperten/out/led/<1-2>/del/<1-3>` | `{h,s,v}` (en tredjedel) |
| app → ESP | `utmanaexperten/out/fx` | `{"fx":"none\|sweep\|countdown","speed":0-100}` |

Samma broker som Josef kör (fråga efter IP). WiFi i testet; Ethernet (W5500) kan slås på senare —
pinnarna är valda så de inte krockar.

**Frågor → Josef.** När testet funkar skalar vi upp till 6 platser × 3 knappar (18 st).
