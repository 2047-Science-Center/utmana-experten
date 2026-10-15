#!/usr/bin/env bash
# starta-om.sh — nollställ spelet: starta om gateway + hjärna, ladda om kiosken.
# Mål för skrivbordsknappen "Starta om spelet". Inget lösenord (--user-tjänster).
set -u
pause() { [ -t 1 ] && read -rp "Tryck Enter för att stänga..."; }

echo "== Startar om gateway (appen + AI) =="
systemctl --user restart utmana-gateway && echo "  ✓ utmana-gateway omstartad" || echo "  ! kunde inte starta om gateway"

echo "== Startar om rigg-hjärnan =="
systemctl --user restart utmana-brain && echo "  ✓ utmana-brain omstartad" || echo "  ! kunde inte starta om hjärnan"

echo "== Laddar om kiosk-skärmen =="
pkill -f utmana-kiosk 2>/dev/null || true
pkill -f 'google-chrome' 2>/dev/null || true
sleep 1
setsid bash "$HOME/.local/bin/utmana-kiosk.sh" >/dev/null 2>&1 < /dev/null &

echo; echo "✔ Klart — rent bord. Skärmen är tillbaka i attract-läget."
pause
