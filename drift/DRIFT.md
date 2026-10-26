# Drift — Utmana experten (Linux Mint)

En Mint-låda är hela stationens värd (som en NUC): broker + gateway + hjärna + kiosk.
Speglar Eco Loco mellans drift-kit.

```
[ESP32-S3: knapp+LED] ──WiFi/1883──┐
                                   ▼
            mosquitto (1883 ESP · 9001 webb-WS)
              ▲                         ▲
   hjärna (rost→LED+ljud)        appen i Google Chrome ──http:8787──► gateway (app + /assess + /speak → ChatGPT)
```

- **gateway** (Node) serverar den byggda appen + AI på port **8787**.
- **broker** (mosquitto) — 1883 för ESP:n, 9001 (websockets) för appen.
- **hjärna** (`hjarna-stubb.py`) — översätter `rost` → LED-färg, spelar ljud-cues.
- **kiosk** — Google Chrome (Web Speech kräver Chrome, ej Chromium) mot `http://localhost:8787/?mqtt=ws://localhost:9001`.
- Allt utom brokern kör som **--user-tjänster** → skrivbordsknapparna startar om utan lösenord.

## Installera (en gång, på Mint-lådan)
```bash
git clone https://github.com/2047-Science-Center/utmana-experten.git
cd utmana-experten
bash drift/mint/installera-mint.sh            # lokal broker på denna låda
# fyll i nycklar:
nano server/.env                              # AI_API_KEY (+ ELEVENLABS_API_KEY)
systemctl --user restart utmana-gateway
```
Installern skriver ut **lådans IP** — sätt den som `MQTT_HOST` i ESP:ns `.ino` och flasha om.

## Dagligt
| Vill du… | Gör så här |
|---|---|
| **Starta spelet** | Dubbelklicka **Starta Utmana experten** på skrivbordet |
| **Starta om / nollställ** | Dubbelklicka **Starta om spelet** (eller `systemctl --user restart utmana-gateway utmana-brain`) |
| **Uppdatera till senaste** | Dubbelklicka **Uppdatera spelet** (eller `git pull && npm run build:kiosk && systemctl --user restart utmana-gateway`) |
| **Avsluta kiosken** | Appens **✕ Avsluta**-knapp, eller Alt+F4 |
| **Byt högtalare** | `tools/audio.sh out "<namn>"` (`tools/audio.sh list` visar namnen) |

## Ljud (Anker som mic in + ljud ut)
Kiosken kör `tools/audio.sh` vid start → sätter default in/ut till Anker (`MIC_SOURCE`/`AUDIO_SINK`,
default "Anker", resolvas mot pactl-namnet). Byt default: redigera inte skriptet — sätt env, t.ex.
`AUDIO_SINK="alsa_output.usb-Anker…" systemctl --user set-environment` eller kör `tools/audio.sh out "…"`.

## Loggar / felsök
```bash
journalctl --user -u utmana-gateway -f      # appen + AI
journalctl --user -u utmana-brain -f        # hjärnan (rost→LED)
journalctl -u mosquitto -f                  # brokern
mosquitto_sub -t 'utmanaexperten/#' -v       # allt på bussen (knapp, rost, out/led…)
```
- **Skärmen tänds inte / "kan inte nå servern"** → `systemctl --user status utmana-gateway`.
- **Ingen LED** → kör hjärnan? `journalctl --user -u utmana-brain`; testa firmware direkt: `tools/mock-rigg-granular.sh demo`.
- **Ingen röst-transkription** → måste vara **Google Chrome** + internet; mick = systemets default-in (Anker).
- **9001 vägrar** → apt-mosquitto utan websockets-stöd; kolla `/etc/mosquitto/conf.d/utmana.conf` + `journalctl -u mosquitto`.

## Extern broker
`bash drift/mint/installera-mint.sh 192.168.0.23` → ingen lokal broker; gateway/hjärna/ESP pekar dit.

---

## Spelledarskärmen (eget fönster, annan skärm/enhet)

Spelledaren sitter INTE på stationsskärmen. Öppna på en surfplatta/laptop på
samma nät:

```
http://<nuc-ip>:8787/spelledare?mqtt=ws://<nuc-ip>:9001
```

- `<nuc-ip>` = stationslådans IP (installera-mint.sh skriver ut den; annars `hostname -I`).
- Stationen själv kör `…/?mqtt=ws://localhost:9001` (satt av installern).
- Brokern binder `0.0.0.0:9001` → surfplattan når den över LAN.
- `?mqtt=` kan utelämnas → fönstret frågar efter broker-URL och sparar den lokalt.
- I fönstret: välj format + variant (EXEMPEL-raden) + läge, START · NÄSTA ▸ (pulsar
  när motorn gatat) · PAUS · MASTER · OMSTART, och testknappar per plats.
- Söm: fönstret publicerar `utmanaexperten/gm/*` + `knapp`, speglar motorn via
  retained `utmanaexperten/status`. Samma söm som Blocks-dirigenten.

## Arkadknappar (ESP32, Erik-riggen)

Testrigg = 2 spelare × ja/nej/kanske (6 knappar). Firmware:
`bestallning-erik/utmana_rigg_test2_esp32s3eth/` (Waveshare ESP32-S3-ETH, WiFi).

1. `cd bestallning-erik/utmana_rigg_test2_esp32s3eth && cp secrets.example.h secrets.h`
   → fyll WIFI_SSID/WIFI_PASS + `MQTT_HOST` = NUC:ens IP.
2. Arduino IDE: kort "ESP32S3 Dev Module", USB CDC On Boot: Enabled, PSRAM "OPI PSRAM",
   Flash 8MB. Bibliotek: FastLED, PubSubClient, ArduinoJson. Flasha.
3. Pinnar: plats 1 ja=GPIO15 / nej=16 / kanske=17 · plats 2 ja=18 / nej=1 / kanske=2.
   LED-DIN = GPIO38. Gemensam GND. Knapp = GPIO→GND (INPUT_PULLUP).
4. Verifiera på NUC: `mosquitto_sub -t 'utmanaexperten/knapp' -v` → tryck knapp →
   `{"plats":1,"knapp":"ja"}`. (Eller seriemonitor: 't' = plats 1 "ja".)

OBS 2-spelartest: appen står på `config.seats = 6`. "Alla grönt"-gaten (självgående)
kräver att ALLA 6 platser trycker grönt → med 2 fysiska spelare: kör i spelledarläge
(spelledaren gatar), ELLER sätt `config.seats = 2` i `src/config.ts` och bygg om för
bänktestet (återställ till 6 för den stora riggen).
