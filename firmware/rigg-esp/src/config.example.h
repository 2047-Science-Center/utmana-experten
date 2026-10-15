#pragma once
// Kopiera till config.h (gitignore:ad) och fyll i. Inga hemligheter i git.
// Samma koppling som Eco Loco mellans rigg-esp: WS2812B, GRB, gemensam GND,
// 3,3 V data rakt in på en kort strip.

#define WIFI_SSID    "DITT_NAT"
#define WIFI_PASS    "DITT_LOSEN"
#define MQTT_BROKER  "192.168.68.56"   // bänk = din Mac (ip addr/ipconfig); drift = stationens broker
#define MQTT_PORT    1883
#define MQTT_CLIENT  "utmana-rigg-esp"

// Topic-rot (matchar appens config.rig.topicRoot).
#define TOPIC_ROOT   "utmanaexperten"

// --- LED ---
#define LED_PIN   21
// PROTOTYP: 1 m provlist. 60 LED/m är vanligast → NUM_LEDS 60. Är listen 30/m,
// sätt NUM_LEDS 30 och använd 30-LED-intervallen nedan (enda ändringen).
#define NUM_LEDS  60

#define NUM_SEATS 6                    // 6 spelare runt hästskon
// Plats→pixelintervall (inklusive index). Byt BARA dessa när geometrin ändras.
// 6 platser på 60 px (10 px/plats, var och en delas i 3 tredjedelar ja/nej/kanske):
#define SEAT_STARTS { 0, 10, 20, 30, 40, 50 }
#define SEAT_ENDS   { 9, 19, 29, 39, 49, 59 }
// Om listen är 30/m (30 px) i stället:
// #define NUM_LEDS  30
// #define SEAT_STARTS { 0, 5, 10, 15, 20, 25 }
// #define SEAT_ENDS   { 4, 9, 14, 19, 24, 29 }

// --- Knappar (in → MQTT) ---
// PROTOTYP: EN arkadknapp = plats 1, "ja" (vi testar med den tills fler kopplas).
// Aktiv-låg (INPUT_PULLUP): tryck = GND. -1 = ej inkopplad.
#define BTN_COUNT   1
#define BTN_PINS    { 4 }             // GPIO4 → knapp → GND. S3-säker. (classic ESP32/Färgkapsel: GPIO27 — EJ S3)
#define BTN_PLATS   { 1 }             // plats 1
#define BTN_KNAPP   { "ja" }          // ja (den enda knappen vi har nu)
// Drift (3 knappar/plats): S3 → { 4, 5, 6 } / { 1,1,1 } / { "ja","nej","kanske" }  (classic ESP32 → { 27, 26, 25 })
// Full rigg = 18 knappar (6 platser × 3) → utöka alla tre arrayer parallellt.
