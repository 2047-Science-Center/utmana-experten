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
