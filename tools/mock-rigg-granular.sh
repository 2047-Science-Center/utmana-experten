#!/usr/bin/env bash
# Testar FIRMWAREN ensam (lager 2 — inget spel, ingen hjärna). Publicerar
# utmanaexperten/out/led... + /out/fx direkt. Bevisar tredjedels-primitiven och
# knapp-firmwaren utan appen.
#
#   ./mock-rigg-granular.sh <scen>     kör en scen
#   ./mock-rigg-granular.sh demo       kör alla i sekvens
#   ./mock-rigg-granular.sh            interaktiv panel
set -euo pipefail
BROKER="${BROKER:-localhost}"
PORT="${PORT:-1883}"
ROOT="${TOPIC_ROOT:-utmanaexperten}"
SEAT="${SEAT:-1}"

p() { mosquitto_pub -h "$BROKER" -p "$PORT" -t "$ROOT/$1" -m "$2"; echo "→ $ROOT/$1 $2"; }

scene() {
  case "$1" in
    spotlight)  p "out/led/$SEAT" '{"h":0,"s":0,"v":90,"puls":50}' ;;
    dim)        p "out/led/$SEAT" '{"h":30,"s":40,"v":12}' ;;
    ja)         p "out/led/$SEAT/del/1" '{"h":120,"s":90,"v":90}' ;;
    nej)        p "out/led/$SEAT/del/2" '{"h":0,"s":100,"v":90}' ;;
    kanske)     p "out/led/$SEAT/del/3" '{"h":50,"s":100,"v":80}' ;;
    facit-nej)  p "out/led/$SEAT/del/2" '{"h":0,"s":100,"v":90,"blink":60}' ;;
    sweep)      p "out/fx" '{"fx":"sweep","speed":60}' ;;
    countdown)  p "out/fx" '{"fx":"countdown","speed":70}' ;;
    none)       p "out/fx" '{"fx":"none"}' ;;
    off)        p "out/led/$SEAT" '{"h":0,"s":0,"v":0}'; p "out/fx" '{"fx":"none"}' ;;
    *) echo "okänd scen: $1"; return 1 ;;
  esac
}

if [ "$#" -ge 1 ] && [ "$1" != "demo" ]; then scene "$1"; exit 0; fi

if [ "${1:-}" = "demo" ]; then
  for s in dim spotlight ja nej kanske facit-nej sweep none off; do scene "$s"; sleep 1.2; done
  exit 0
fi

echo "Granular-mock (plats=$SEAT). Scener: spotlight dim ja nej kanske facit-nej sweep countdown none off. 'q'=avsluta."
while true; do
  read -rp "> " s || break
  [ "${s:-q}" = "q" ] && break
  scene "$s" || true
done
