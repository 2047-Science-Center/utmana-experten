#!/usr/bin/env bash
# installera-mint.sh — sätter upp en Linux MINT-låda som värd för "Utmana experten".
# Speglar Eco Loco mellans drift/mint-kit, men för utmanas stack:
#   broker (mosquitto 1883+9001) + gateway (Node, serverar appen + /assess + /speak)
#   + hjärna (hjarna-stubb.py: rost → LED-färg + ljud) + Google Chrome-kiosk (Web Speech).
#
# Allt utom brokern körs som --user-tjänster → skrivbordsknapparna startar om UTAN lösenord.
# Web Speech kräver Google Chrome (ej Chromium) + säker kontext (http://localhost).
#
#   bash drift/mint/installera-mint.sh            # lokal broker på denna låda (localhost)
#   bash drift/mint/installera-mint.sh 192.168.x.x   # peka mot EXTERN broker (ingen lokal)
#
# Körs som VANLIG användare (sudo:ar själv där det behövs). Lag-/rollval behövs inte — en låda = en station.
set -euo pipefail
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BROKER="${1:-localhost}"
PORT=8787
cd "$REPO_DIR"

behover_node() {
  command -v node >/dev/null 2>&1 || return 0
  [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ] && return 0
  return 1
}

echo "▸ Installerar systempaket (mosquitto-clients, mpg123, unclutter)…"
sudo apt-get update -qq
sudo apt-get install -y mosquitto-clients mpg123 unclutter

if behover_node; then
  echo "▸ Installerar Node.js 22 LTS (Mints apt-Node är för gammal)…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v google-chrome-stable >/dev/null 2>&1 && ! command -v google-chrome >/dev/null 2>&1; then
  echo "▸ Installerar Google Chrome (Web Speech saknas i Chromium)…"
  tmpdeb="$(mktemp --suffix=.deb)"
  curl -fL --progress-bar -o "$tmpdeb" https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
  sudo apt-get install -y "$tmpdeb"
  rm -f "$tmpdeb"
fi
CHROME="$(command -v google-chrome-stable || command -v google-chrome)"

echo "▸ Bygger appen (npm ci + build)…"
npm ci
npm run build:kiosk    # same-origin /assess (VITE_ASSESS_URL='')

# --- server/.env (hemligheter — fylls på lådan, aldrig i git) ---
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "  ⚠ server/.env skapad från mall — FYLL I AI_API_KEY (och ELEVENLABS_API_KEY) på denna låda."
fi

# --- Broker ---
if [ "$BROKER" = "localhost" ] || [ "$BROKER" = "127.0.0.1" ]; then
  echo "▸ LOKAL broker: installerar mosquitto (1883 för ESP + 9001 websockets för appen)…"
  sudo apt-get install -y mosquitto
  sudo cp "$REPO_DIR/tools/mosquitto-utmana.conf" /etc/mosquitto/conf.d/utmana.conf
  sudo systemctl enable --now mosquitto
  sudo systemctl restart mosquitto
  ESP_BROKER="$(hostname -I | awk '{print $1}')"
else
  echo "▸ EXTERN broker: $BROKER — installerar ingen lokal."
  ESP_BROKER="$BROKER"
fi

# --- --user-tjänster: gateway + hjärna ---
mkdir -p "$HOME/.config/systemd/user"
NODE="$(command -v node)"; PY="$(command -v python3)"

cat > "$HOME/.config/systemd/user/utmana-gateway.service" <<EOF
[Unit]
Description=Utmana experten — gateway (app + /assess + /speak)
After=network-online.target

[Service]
WorkingDirectory=${REPO_DIR}
Environment=PORT=${PORT}
ExecStart=${NODE} ${REPO_DIR}/server/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

cat > "$HOME/.config/systemd/user/utmana-brain.service" <<EOF
[Unit]
Description=Utmana experten — rigg-hjärna (hjarna-stubb)
After=network-online.target

[Service]
WorkingDirectory=${REPO_DIR}
Environment=BROKER=${BROKER}
Environment=NUM_SEATS=6
ExecStart=${PY} ${REPO_DIR}/tools/hjarna-stubb.py
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now utmana-gateway utmana-brain
sudo loginctl enable-linger "$USER" 2>/dev/null || true

# --- Kiosk-skript (Google Chrome, Web Speech, mic auto-godkänd, Anker-ljud) ---
mkdir -p "$HOME/.local/bin"
KIOSK_URL="http://localhost:${PORT}/?mqtt=ws://localhost:9001"
cat > "$HOME/.local/bin/utmana-kiosk.sh" <<EOF
#!/usr/bin/env bash
# Utmana experten kiosk — genererad av installera-mint.sh. Startas från skrivbordsikonen.
xset s off 2>/dev/null || true; xset -dpms 2>/dev/null || true; xset s noblank 2>/dev/null || true
# Ljud → Anker (mic in + ljud ut). Byt i farten: tools/audio.sh out "<namn>"
bash "${REPO_DIR}/tools/audio.sh" 2>/dev/null || true
unclutter -idle 1 & UNC=\$!
# --app + --start-fullscreen (INTE hård --kiosk) så appens ✕ Avsluta (window.close) funkar.
# --use-fake-ui-for-media-stream = auto-godkänn mikrofonen (ingen dialog).
"${CHROME}" --app="${KIOSK_URL}" --start-fullscreen \\
  --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream \\
  --no-first-run --no-default-browser-check --disable-session-crashed-bubble --disable-infobars \\
  --user-data-dir="\$HOME/.utmana-kiosk"
kill \$UNC 2>/dev/null || true
EOF
chmod +x "$HOME/.local/bin/utmana-kiosk.sh"

# "Starta Utmana experten"-ikon + Starta om/Uppdatera-knappar
apps="$HOME/.local/share/applications"
desktop_dir="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$apps"
tmp="$(mktemp)"
cat > "$tmp" <<EOF
[Desktop Entry]
Type=Application
Name=Starta Utmana experten
Comment=Öppna spelet i helskärm (Google Chrome)
Exec=bash "$HOME/.local/bin/utmana-kiosk.sh"
Icon=input-gaming
Terminal=false
Categories=Game;
StartupNotify=false
EOF
install -m 0755 "$tmp" "$apps/utmana-starta.desktop"
if [ -d "$desktop_dir" ]; then
  install -m 0755 "$tmp" "$desktop_dir/utmana-starta.desktop"; chmod +x "$desktop_dir/utmana-starta.desktop"
  gio set -t string "$desktop_dir/utmana-starta.desktop" metadata::trusted yes  2>/dev/null || true
  gio set -t string "$desktop_dir/utmana-starta.desktop" metadata::trusted true 2>/dev/null || true
fi
rm -f "$tmp"; update-desktop-database "$apps" 2>/dev/null || true

bash "$REPO_DIR/drift/mint/installera-knappar.sh"

echo
echo "✔ Utmana experten installerad på denna Mint-låda."
echo "  Denna lådas IP (broker för ESP + övriga): $ESP_BROKER"
echo "  → ESP32:ns .ino: MQTT_HOST = $ESP_BROKER  (flasha om)"
echo "  → FYLL I nycklar i server/.env (AI_API_KEY, ELEVENLABS_API_KEY), sen: systemctl --user restart utmana-gateway"
echo "  Skrivbordsikoner: 'Starta Utmana experten' · 'Starta om spelet' · 'Uppdatera spelet'"
echo "  Loggar:  journalctl --user -u utmana-gateway -f   /   -u utmana-brain -f"
