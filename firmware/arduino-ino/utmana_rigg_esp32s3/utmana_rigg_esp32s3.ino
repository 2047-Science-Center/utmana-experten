/*
 * Utmana experten — RIGG (ESP32-S3-DevKitC-1) · Arduino-IDE-sketch
 * ===================================================================
 * DUM RENDERARE + KNAPP-IN. Samma frysta söm som PlatformIO-firmwaren
 * (firmware/rigg-esp): firmwaren känner BARA lager 2 (granulära primitiver)
 * och ritar dem; all mening bor uppåt (hjärnan/Blocks). Knappen följer
 * Färgkapsels mönster (INPUT_PULLUP, tryck=LOW, tidsbaserad debounce).
 *
 *   IN  (hjärna → ESP, LED):
 *     utmanaexperten/out/led/<1-N>            {h,s,v,puls,blink}  hela platsen
 *     utmanaexperten/out/led/<1-N>/del/<1-3>  {h,s,v}             EN tredjedel (ja=1/nej=2/kanske=3)
 *     utmanaexperten/out/fx                    {fx,speed}          helslinge-overlay (sweep/countdown)
 *   UT  (ESP → app, KNAPP):
 *     utmanaexperten/knapp                     {plats,knapp}        vid nedtryck
 *
 * ARDUINO IDE:
 *   Kort:        "ESP32S3 Dev Module"   (installera "esp32 by Espressif", v3.x)
 *   USB CDC On Boot: Enabled  (för seriemonitorn)
 *   Bibliotek (Library Manager): FastLED (>=3.7.0), PubSubClient, ArduinoJson (v7)
 *
 * Testa utan knapp: skicka 't' i seriemonitorn (= tryck plats 1).
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>

// ===================== MILJÖ =====================
// Hemligheter (WiFi + broker-IP) ligger i secrets.h — GITIGNORE:AD. Första gången:
//   cp secrets.example.h secrets.h   (och fyll i), annars kompilerar den inte.
#include "secrets.h"                            // WIFI_SSID, WIFI_PASS, MQTT_HOST
const uint16_t MQTT_PORT   = 1883;
const char*    MQTT_CLIENT = "utmana-rigg-esp";
const char*    ROOT        = "utmanaexperten"; // matchar appens config.rig.topicRoot

// ===================== LED (1 m WS2812B, 6 platser) =====================
// Data 3,3 V RAKT IN på kort strip (som Eco Loco mellan) — 330 Ω i serie är valfritt.
#define LED_PIN     21                // GPIO21 → strippens DIN (= Eco Locos live-pin, S3-säker)
#define NUM_LEDS    60                 // 1 m @ 60/m. 30/m → sätt 30 + intervallen nedan
#define NUM_SEATS   6
#define BRIGHTNESS  180                // höj mot 255 när extern 5 V-PSU är inkopplad

// Plats → pixelintervall (inklusive). Byt BARA dessa när geometrin ändras.
int SEAT_STARTS[NUM_SEATS] = { 0, 10, 20, 30, 40, 50 };   // 30/m: {0,5,10,15,20,25}
int SEAT_ENDS[NUM_SEATS]   = { 9, 19, 29, 39, 49, 59 };   // 30/m: {4,9,14,19,24,29}

// ===================== KNAPP (in → MQTT) =====================
// Prototyp: EN arkadknapp = plats 1, "ja". GPIO4 → knapp → GND (intern pull-up).
// OBS: Färgkapsels GPIO27 funkar BARA på classic ESP32 — på S3 är 26–32 flash/PSRAM. GPIO4 är S3-säker.
#define BTN_PIN      4
const int   BTN_PLATS = 1;
const char* BTN_KNAPP = "ja";
const unsigned long DEBOUNCE_MS = 50;

// ===================== INTERNT =====================
CRGB leds[NUM_LEDS];

struct Look { float h = 0, s = 0, v = 0, puls = 0, blink = 0; };
Look seatBase[NUM_SEATS];
Look thirdLook[NUM_SEATS][3];
bool thirdOn[NUM_SEATS][3];

String fxMode = "none";
int    fxSpeed = 50;

WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);

// knapp-debounce (Färgkapsel-mönstret)
int lastReading = HIGH, btnState = HIGH;
unsigned long lastChange = 0;

CRGB toRGB(float h, float s, float v) {
  return CHSV((uint8_t)(h * 255.0 / 360.0), (uint8_t)(s * 2.55), (uint8_t)(v * 2.55));
}

// puls = mjuk sinus på v; blink = hård på/av. Högre värde = snabbare/djupare.
float modV(const Look &L, unsigned long now) {
  if (L.blink > 0) {
    float period = max(140.0f, 520.0f - L.blink * 3.0f);
    return (((now / (unsigned long)period) % 2) == 0) ? L.v : 0;
  }
  if (L.puls > 0) {
    float amp = (L.puls / 100.0) * 0.6;
    float w = sinf(2 * PI * now / 1200.0) * 0.5 + 0.5;
    return L.v * (1 - amp) + L.v * amp * w;
  }
  return L.v;
}

// vilken tredjedel (0..2) en pixel i platsens intervall tillhör
int thirdOfPixel(int seat, int pixel) {
  int start = SEAT_STARTS[seat], end = SEAT_ENDS[seat];
  int len = end - start + 1;
  if (len <= 0) return 0;
  int third = ((pixel - start) * 3) / len;
  if (third > 2) third = 2;
  if (third < 0) third = 0;
  return third;
}

void render() {
  unsigned long now = millis();

  // countdown = hela slingan vit, pulsande ~1 Hz. Överstyr allt.
  if (fxMode == "countdown") {
    float v = 20 + (sinf(2 * PI * now / 900.0) * 0.5 + 0.5) * 80;
    fill_solid(leds, NUM_LEDS, toRGB(0, 0, v));
    FastLED.show();
    return;
  }

  // bas-look per plats, med ev. tredjedels-override
  for (int s = 0; s < NUM_SEATS; s++) {
    for (int i = SEAT_STARTS[s]; i <= SEAT_ENDS[s] && i < NUM_LEDS; i++) {
      int k = thirdOfPixel(s, i);
      const Look &L = thirdOn[s][k] ? thirdLook[s][k] : seatBase[s];
      leds[i] = toRGB(L.h, L.s, modV(L, now));
    }
  }

  // sweep = guldkomet över stripen (turordnings-svep). Additivt ovanpå bas.
  if (fxMode == "sweep") {
    float pxPerMs = 0.02 + (fxSpeed / 100.0) * 0.10;
    int head = ((int)(now * pxPerMs)) % NUM_LEDS;
    for (int o = 0; o < 6; o++) {
      int idx = (head - o + NUM_LEDS) % NUM_LEDS;
      uint8_t b = (uint8_t)(255 * (1.0 - o / 6.0));
      leds[idx] += CRGB(b, (uint8_t)(b * 0.7), (uint8_t)(b * 0.12));
    }
  }
  FastLED.show();
}

void onMsg(char *topic, byte *payload, unsigned int len) {
  String t(topic);
  char buf[256];
  if (len > 255) len = 255;
  memcpy(buf, payload, len);
  buf[len] = 0;

  String ledRoot = String(ROOT) + "/out/led/";
  if (t.startsWith(ledRoot)) {
    String rest = t.substring(ledRoot.length());   // "<n>" eller "<n>/del/<k>"
    int slash = rest.indexOf('/');
    JsonDocument d;
    if (deserializeJson(d, buf)) return;
    if (slash < 0) {
      int n = rest.toInt();
      if (n < 1 || n > NUM_SEATS) return;
      Look &L = seatBase[n - 1];
      L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f;
      L.puls = d["puls"] | 0.0f; L.blink = d["blink"] | 0.0f;
      for (int k = 0; k < 3; k++) thirdOn[n - 1][k] = false;   // ny bas → nollställ tredjedelar
    } else {
      int n = rest.substring(0, slash).toInt();
      int k = rest.substring(rest.lastIndexOf('/') + 1).toInt();
      if (n < 1 || n > NUM_SEATS || k < 1 || k > 3) return;
      Look &L = thirdLook[n - 1][k - 1];
      L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f;
      L.puls = d["puls"] | 0.0f; L.blink = d["blink"] | 0.0f;
      thirdOn[n - 1][k - 1] = true;
    }
    return;
  }

  if (t == String(ROOT) + "/out/fx") {
    JsonDocument d;
    if (deserializeJson(d, buf)) return;
    fxMode = String((const char *)(d["fx"] | "none"));
    fxSpeed = d["speed"] | 50;
  }
}

void publishKnapp(int plats, const char *knapp) {
  char msg[48];
  snprintf(msg, sizeof(msg), "{\"plats\":%d,\"knapp\":\"%s\"}", plats, knapp);
  mqtt.publish((String(ROOT) + "/knapp").c_str(), msg);
  Serial.print(F("[rigg] knapp -> ")); Serial.println(msg);
}

void connectMqtt() {
  int tries = 0;
  while (!mqtt.connected() && tries++ < 5) {
    if (mqtt.connect(MQTT_CLIENT)) {
      Serial.println(F("[rigg] MQTT connected + subscribed"));
      mqtt.subscribe((String(ROOT) + "/out/led/#").c_str());
      mqtt.subscribe((String(ROOT) + "/out/fx").c_str());
    } else {
      Serial.print(F("[rigg] MQTT fail rc=")); Serial.println(mqtt.state());
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println(F("\n[rigg] start (ESP32-S3)"));

  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.clear(true);

  pinMode(BTN_PIN, INPUT_PULLUP);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) { delay(200); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) { Serial.print(F("\n[rigg] WiFi OK, IP ")); Serial.println(WiFi.localIP()); }
  else Serial.println(F("\n[rigg] WiFi FAILED — kollar igen i loop"));

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMsg);
}

void readButton() {
  int reading = digitalRead(BTN_PIN);
  if (reading != lastReading) { lastChange = millis(); lastReading = reading; }
  if (millis() - lastChange > DEBOUNCE_MS && reading != btnState) {
    btnState = reading;
    if (btnState == LOW) publishKnapp(BTN_PLATS, BTN_KNAPP);   // nedtryck (aktiv-låg)
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); delay(200); }
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  // seriemonitor-trigger: 't' = tryck plats 1 (test utan knapp)
  while (Serial.available()) { char k = Serial.read(); if (k == 't' || k == 'T') publishKnapp(BTN_PLATS, BTN_KNAPP); }

  readButton();
  render();
}
