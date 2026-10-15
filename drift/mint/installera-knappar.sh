#!/usr/bin/env bash
# installera-knappar.sh — lägger skrivbordsknappar så stationen sköts UTAN terminal:
#   • "Starta om spelet"  -> starta-om.sh   (nollställer, inget lösenord)
#   • "Uppdatera spelet"  -> uppdatera.sh   (git pull + bygg + omstart, körs i terminal)
# (installera-mint.sh lägger även "Starta Utmana experten"-ikonen.)
#
#   bash drift/mint/installera-knappar.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$HERE"/*.sh

apps="$HOME/.local/share/applications"
desktop_dir="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$apps"

lagg_knapp() {  # <desktop-mall> <målskript>
  local mall="$HERE/$1" skript="$HERE/$2" namn="$1" tmp
  tmp="$(mktemp)"
  sed "s|@EXEC@|bash \"$skript\"|g" "$mall" > "$tmp"
  install -m 0755 "$tmp" "$apps/$namn"
  if [ -d "$desktop_dir" ]; then
    install -m 0755 "$tmp" "$desktop_dir/$namn"; chmod +x "$desktop_dir/$namn"
    gio set -t string "$desktop_dir/$namn" metadata::trusted yes  2>/dev/null || true
    gio set -t string "$desktop_dir/$namn" metadata::trusted true 2>/dev/null || true
  fi
  rm -f "$tmp"; echo "  ✓ $namn"
}

echo "== Lägger skrivbordsknappar =="
lagg_knapp "utmana-starta-om.desktop" "starta-om.sh"
lagg_knapp "utmana-uppdatera.desktop" "uppdatera.sh"
update-desktop-database "$apps" 2>/dev/null || true

echo
echo "✔ Klart. 'Starta om spelet' och 'Uppdatera spelet' finns på skrivbordet + i appmenyn."
echo "  Grå/inaktiv ikon? → HÖGERKLICKA → 'Tillåt start' (Allow Launching), eller starta från MENYN."
