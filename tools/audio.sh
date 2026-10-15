#!/usr/bin/env bash
# Ljud-enhet för Utmana experten — mic IN + ljud UT (en "sink").
# Speglar Minnestestets mönster: MIC_SOURCE / AUDIO_SINK (default = Anker),
# som sätter SYSTEMETS default-enhet → Web Speech (Chrome) och afplay/hjärnan
# följer den. Cross-platform:
#   macOS → SwitchAudioSource (CoreAudio);  NUC/Linux → pactl (PulseAudio, = minnestest).
# Byt i terminalen utan att starta om spelet.
#
#   tools/audio.sh                 # sätt in+ut till default (Anker)
#   tools/audio.sh out "<namn>"    # byt bara högtalare
#   tools/audio.sh in  "<namn>"    # byt bara mic
#   tools/audio.sh status          # visa nuvarande in/ut
#   tools/audio.sh list            # lista enheter
#
# Överstyr default: MIC_SOURCE="..." AUDIO_SINK="..." tools/audio.sh
set -euo pipefail

MIC_SOURCE="${MIC_SOURCE:-Anker PowerConf S330}"
AUDIO_SINK="${AUDIO_SINK:-Anker PowerConf S330}"
OS="$(uname)"

die() { echo "audio.sh: $*" >&2; exit 1; }

setdev() { # typ(input|output)  namn
  if [ "$OS" = "Darwin" ]; then
    command -v SwitchAudioSource >/dev/null 2>&1 \
      || die "saknar SwitchAudioSource → 'brew install switchaudio-osx'"
    SwitchAudioSource -t "$1" -s "$2" >/dev/null \
      && echo "$1 → $2" \
      || die "kunde inte sätta $1 '$2' (kolla namnet med: tools/audio.sh list)"
  else
    command -v pactl >/dev/null 2>&1 || die "saknar pactl (PulseAudio)"
    local kind dev
    if [ "$1" = "input" ]; then kind=sources; else kind=sinks; fi
    # exakt → hel delsträng → FÖRSTA ordet (t.ex. "Anker" matchar alsa_output.usb-Anker_PowerConf_S330…)
    dev="$(pactl list short "$kind" | awk '{print $2}' | grep -ixF "$2" | head -1 || true)"
    [ -z "$dev" ] && dev="$(pactl list short "$kind" | awk '{print $2}' | grep -iF "$2" | head -1 || true)"
    [ -z "$dev" ] && dev="$(pactl list short "$kind" | awk '{print $2}' | grep -iF "${2%% *}" | head -1 || true)"
    [ -z "$dev" ] && dev="$2"
    if [ "$1" = "input" ]; then pactl set-default-source "$dev"; else pactl set-default-sink "$dev"; fi \
      && echo "$1 → $dev" || die "kunde inte sätta $1 '$dev'"
  fi
}

list() {
  if [ "$OS" = "Darwin" ]; then
    echo "— Utgångar (högtalare) —"; SwitchAudioSource -a -t output
    echo "— Ingångar (mic) —";       SwitchAudioSource -a -t input
  else
    echo "— sinks —"; pactl list short sinks; echo "— sources —"; pactl list short sources
  fi
}

status() {
  if [ "$OS" = "Darwin" ]; then
    echo "ut: $(SwitchAudioSource -c -t output)"
    echo "in: $(SwitchAudioSource -c -t input)"
  else
    echo "ut: $(pactl get-default-sink)"; echo "in: $(pactl get-default-source)"
  fi
}

case "${1:-default}" in
  default|anker) setdev output "$AUDIO_SINK"; setdev input "$MIC_SOURCE" ;;
  out)  setdev output "${2:?ange enhetsnamn, t.ex. tools/audio.sh out \"Högtalare i MacBook Pro\"}" ;;
  in)   setdev input  "${2:?ange enhetsnamn}" ;;
  status) status ;;
  list)   list ;;
  *) echo "Användning: tools/audio.sh [default|out \"<namn>\"|in \"<namn>\"|status|list]"; exit 1 ;;
esac
