#!/usr/bin/env bash
# Mockar arkadknappar → publicerar utmanaexperten/knapp {plats,knapp}. DRIVER
# appen EXakt som hårdvaran (ESP32 publicerar samma topic). On-screen-knapparna
# i appen kör i sin tur samma inväg (store.onKnapp).
#
#   ./mock-knapp.sh <plats> <ja|nej|kanske>      en knapptryck
#   ./mock-knapp.sh                               interaktiv panel
#
# Appen måste köra mot en MQTT-over-WS-broker: öppna med ?mqtt=ws://localhost:9001
# och starta brokern: mosquitto -c tools/mosquitto-utmana.conf
set -euo pipefail
BROKER="${BROKER:-localhost}"
PORT="${PORT:-1883}"
ROOT="${TOPIC_ROOT:-utmanaexperten}"

send() { # plats knapp
  mosquitto_pub -h "$BROKER" -p "$PORT" -t "$ROOT/knapp" -m "{\"plats\":$1,\"knapp\":\"$2\"}"
  echo "→ $ROOT/knapp {plats:$1,knapp:$2}"
}

if [ "$#" -ge 2 ]; then
  send "$1" "$2"; exit 0
fi

echo "Mock-knapp. Skriv '<plats> <knapp>' (t.ex. '1 ja'), 'q' för avsluta."
while true; do
  read -rp "> " plats knapp || break
  [ "${plats:-q}" = "q" ] && break
  [ -z "${knapp:-}" ] && { echo "ange: <plats> <ja|nej|kanske>"; continue; }
  send "$plats" "$knapp"
done
