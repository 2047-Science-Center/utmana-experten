#!/usr/bin/env bash
# uppdatera.sh — hämta senaste versionen, bygg om och starta om stationen.
# Mål för skrivbordsknappen "Uppdatera spelet" (körs i terminal så man ser förloppet).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
cd "$REPO" || { echo "Hittar inte repot ($REPO)"; [ -t 1 ] && read -rp "Enter..."; exit 1; }
pause() { [ -t 1 ] && read -rp "Tryck Enter för att stänga..."; }

echo "== Hämtar senaste (git pull) =="
if ! git pull; then
  echo; echo "git pull misslyckades (se ovan). Ofta pga lokala ändringar på lådan."
  pause; exit 1
fi

# Beroenden: kör npm ci bara om lockfilen ändrats (annars räcker ombygge).
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "package-lock.json\|package.json"; then
  echo; echo "== Beroenden ändrade — npm ci =="
  npm ci || { echo "npm ci misslyckades"; pause; exit 1; }
fi

echo; echo "== Bygger om appen =="
npm run build:kiosk || { echo "bygget misslyckades"; pause; exit 1; }

echo; echo "== Startar om stationen =="
systemctl --user restart utmana-gateway 2>/dev/null && echo "  ✓ gateway omstartad"
systemctl --user restart utmana-brain   2>/dev/null && echo "  ✓ hjärna omstartad"
pkill -f utmana-kiosk 2>/dev/null || true
pkill -f 'google-chrome' 2>/dev/null || true
sleep 1
setsid bash "$HOME/.local/bin/utmana-kiosk.sh" >/dev/null 2>&1 < /dev/null &

echo; echo "✔ Klart! Utmana experten är uppdaterad och omstartad."
pause
