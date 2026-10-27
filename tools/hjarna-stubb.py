#!/usr/bin/env python3
"""
DIRIGENTEN (hjärnan) för Utmana experten — Blocks-stand-in. Prenumererar på
lager 1 (semantiska cues) och översätter till lager 2 (granulära LED-primitiver)
enligt look-mappningen i RIGG-KONTRAKT §4. Byts osömlöst mot Blocks sen —
båda kontrakten är frysta, så spel och firmware märker inget.

Noll pip-beroenden: shellar ut till mosquitto_sub/mosquitto_pub (+ afplay/mpg123
för ljud). Master-lås speglar Blocks gmMaster: GM-cues processas alltid, men när
master=1 släpps alla app-cues.

  BROKER=localhost PORT=1883 NUM_SEATS=6 python3 tools/hjarna-stubb.py
"""
import subprocess, json, os, shutil

BROKER = os.environ.get("BROKER", "localhost")
PORT = os.environ.get("PORT", "1883")
ROOT = os.environ.get("TOPIC_ROOT", "utmanaexperten")
NUM_SEATS = int(os.environ.get("NUM_SEATS", "6"))
AUDIO_DIR = os.environ.get(
    "AUDIO_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "audio")
)
AUDIO_SINK = os.environ.get("AUDIO_SINK")  # Linux PulseAudio-sink för central högtalare

# --- Look-mappning (RIGG-KONTRAKT §4 — DENNA tabell ÄR specen Blocks återskapar) ---
SPOT_LOOK = {"h": 0, "s": 0, "v": 90, "puls": 50}          # aktiv plats: din tur
DIM_LOOK = {"h": 30, "s": 40, "v": 12}                      # övriga platser dämpade
ATTRACT_LOOK = {"h": 200, "s": 60, "v": 18, "puls": 20}
NEUTRAL_LOOK = {"h": 35, "s": 30, "v": 20}                 # vänteläge under röstning
GATE_LOOK = {"h": 35, "s": 70, "v": 25, "puls": 45}        # "Är du redo?" — varm förväntan
OVERLAY_LOOK = {"h": 25, "s": 60, "v": 20, "puls": 28}     # "Vill du ändra dig?" — eftertänksam
COUNTDOWN_LOOK = {"h": 0, "s": 100, "v": 85, "puls": 85}   # timer sista 5 s — röd puls på platsen
OFF = {"h": 0, "s": 0, "v": 0}

# röst/facit → tredjedel (ja=1, nej=2, kanske=3) + färg
VAL_THIRD = {"ja": 1, "nej": 2, "kanske": 3}
VAL_COLOR = {
    "ja": {"h": 120, "s": 90, "v": 90},
    "nej": {"h": 0, "s": 100, "v": 90},
    "kanske": {"h": 50, "s": 100, "v": 80},
}

SOUND = {"verdict": "fanfar"}

master = False
scen = "attract"


# --- granulärt ut (till firmware) ---
def pub(topic, msg):
    subprocess.run(["mosquitto_pub", "-h", BROKER, "-p", PORT, "-t", topic, "-m", str(msg)])


def set_seat(n, look):
    pub(f"{ROOT}/out/led/{n}", json.dumps(look))


def set_third(n, k, look):
    pub(f"{ROOT}/out/led/{n}/del/{k}", json.dumps(look))


def set_all(look):
    for n in range(1, NUM_SEATS + 1):
        set_seat(n, look)


def set_fx(fx, speed=60):
    pub(f"{ROOT}/out/fx", json.dumps({"fx": fx, "speed": speed}))


# --- ljud (one-shot, tyst om saknas / spelare saknas) ---
def resolve(name):
    if not name:
        return None
    for ext in ("", ".wav", ".mp3", ".m4a", ".aiff"):
        p = os.path.join(AUDIO_DIR, name + ext)
        if os.path.isfile(p):
            return p
    return None


def play(name):
    p = resolve(name)
    if not p:
        return
    if shutil.which("afplay"):
        subprocess.Popen(["afplay", p])
    elif shutil.which("mpg123"):
        env = dict(os.environ, **({"PULSE_SINK": AUDIO_SINK} if AUDIO_SINK else {}))
        subprocess.Popen(["mpg123", "-q", p], env=env)
    elif shutil.which("ffplay"):
        subprocess.Popen(["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", p])


# --- handlers ---
def apply_scen(payload):
    global scen
    scen = payload
    if payload == "attract":
        set_fx("none"); set_all(ATTRACT_LOOK)
    elif payload == "present":
        set_fx("none"); set_all(DIM_LOOK)
    elif payload == "vote":
        set_fx("none"); set_all(NEUTRAL_LOOK)   # nollställer tredjedelar → nya röster syns
    elif payload == "speak":
        set_fx("none"); set_all(DIM_LOOK)
    elif payload == "gate":
        set_fx("none"); set_all(GATE_LOOK)   # "Är du redo?"; gröna tändas vid redo (rost ja)
    elif payload == "overlay":
        set_fx("none"); set_all(OVERLAY_LOOK)  # "Vill du ändra dig?"
    elif payload == "facit":
        set_fx("none")
    elif payload == "reality":
        set_fx("none"); set_all(DIM_LOOK)
    elif payload == "verdict":
        set_fx("sweep"); play(SOUND["verdict"])


def apply_aktiv_plats(payload):
    n = int(payload)
    if scen != "speak":
        return
    for s in range(1, NUM_SEATS + 1):
        set_seat(s, SPOT_LOOK if s == n else DIM_LOOK)


def apply_rost(payload):
    d = json.loads(payload)
    plats = int(d.get("plats", 0))
    val = d.get("val")
    k = VAL_THIRD.get(val)
    color = VAL_COLOR.get(val)
    if plats and k and color:
        set_third(plats, k, color)   # kvitto — syns kvar så man ser allas val


def apply_facit(payload):
    d = json.loads(payload)
    val = d.get("val")
    k = VAL_THIRD.get(val)
    color = VAL_COLOR.get(val)
    if k and color:
        lit = dict(color, blink=60)
        for n in range(1, NUM_SEATS + 1):
            set_third(n, k, lit)     # rätt svar tänds/blinkar på ALLA platser


def apply_timer(payload):
    try:
        d = json.loads(payload)
    except Exception:
        return
    plats = int(d.get("plats", 0) or 0)
    sek = d.get("sekunder")
    # Röd puls på den aktiva platsen sista sekunderna. Nästa aktiv_plats återställer.
    if plats and isinstance(sek, (int, float)) and 0 < sek <= 5:
        set_seat(plats, COUNTDOWN_LOOK)


def handle_gm(sub, payload):
    global master
    if sub == "master":
        master = payload == "1"
    elif sub == "alla_slack":
        set_fx("none"); set_all(OFF)
    elif sub == "musik":
        play(payload)
    elif sub.startswith("plats/"):
        n = int(sub.split("/")[1])
        set_seat(n, OFF if payload == "av" else VAL_COLOR.get(payload, NEUTRAL_LOOK))


def on_semantic(topic, payload):
    if topic.startswith(f"{ROOT}/gm/"):
        handle_gm(topic[len(f"{ROOT}/gm/"):], payload)
        return
    if master:
        return  # GM har tagit över — släpp app-cues
    if topic == f"{ROOT}/scen":
        apply_scen(payload)
    elif topic == f"{ROOT}/aktiv_plats":
        apply_aktiv_plats(payload)
    elif topic == f"{ROOT}/rost":
        apply_rost(payload)
    elif topic == f"{ROOT}/facit_ratt":
        apply_facit(payload)
    elif topic == f"{ROOT}/ljud":
        play(payload)
    elif topic == f"{ROOT}/timer":
        apply_timer(payload)


def main():
    topics = ["scen", "aktiv_plats", "rost", "facit_ratt", "timer", "ljud"]
    args = ["mosquitto_sub", "-h", BROKER, "-p", PORT, "-v"]
    for t in topics:
        args += ["-t", f"{ROOT}/{t}"]
    args += ["-t", f"{ROOT}/gm/#"]
    print(f"[hjarna] lyssnar på {ROOT}/* via {BROKER}:{PORT} (platser={NUM_SEATS})")
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, text=True)
    for line in proc.stdout:
        topic, _, payload = line.rstrip("\n").partition(" ")
        try:
            on_semantic(topic, payload)
        except Exception as e:  # noqa: BLE001 — stubb, logga och fortsätt
            print(f"[hjarna] fel på {topic}: {e}")


if __name__ == "__main__":
    main()
