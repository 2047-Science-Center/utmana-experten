/*
 * Utmana experten — TESTRIGG 2 SPELARE (Waveshare ESP32-S3-ETH) · Arduino-sketch
 * ===================================================================
 * Simulerar TVÅ spelare: 6 arkadknappar (plats 1 & 2 × JA/NEJ/KANSKE) + en
 * WS2812B-strip på 30 px uppdelad i 2 platser (15 px vardera). Samma frysta söm
 * som den stora riggen — dum renderare (LED-primitiver in) + knapp→MQTT ut.
 * Kör på WiFi (enklast för bänktest); pinnarna undviker W5500 så kortets Ethernet
 * går att slå på i drift.
 *
 *   IN  (hjärna → ESP, LED):
 *     utmanaexperten/out/led/<1-2>            {h,s,v,puls,blink}  hela platsen
 *     utmanaexperten/out/led/<1-2>/del/<1-3>  {h,s,v}             EN tredjedel (ja=1/nej=2/kanske=3)
 *     utmanaexperten/out/fx                    {fx,speed}          svep/countdown
 *   UT  (ESP → app, KNAPP):
 *     utmanaexperten/knapp                     {plats,knapp}        vid nedtryck
 *
 * KORT: Waveshare ESP32-S3-ETH (ESP32-S3R8: OPI PSRAM + 16 MB flash). Verifierat
 *       mot kortets pinout. Upptaget på kortet (undvik): W5500 (GPIO9–14),
 *       SD (GPIO4–7), USB (GPIO19/20), UART0 (GPIO43/44), strapping (0/3/45/46),
 *       inbyggd RGB-LED (GPIO38).
 *
 * ARDUINO IDE: kort "ESP32S3 Dev Module", USB CDC On Boot: Enabled, PSRAM: "OPI PSRAM",
 *              Flash Size: 16MB. Bibliotek: FastLED, PubSubClient, ArduinoJson.
 * Testa utan knapp: skicka 't' i seriemonitorn (= tryck plats 1, "ja").
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>
#include "secrets.h"                 // WIFI_SSID, WIFI_PASS, MQTT_HOST (kopiera secrets.example.h)

const uint16_t MQTT_PORT   = 1883;
const char*    MQTT_CLIENT = "utmana-rigg-test2";
const char*    ROOT        = "utmanaexperten";

// ===================== LED (WS2812B-strip, 2 platser × 15 px) =====================
// Strip-DIN på GPIO38. OBS: GPIO38 är även kortets INBYGGDA RGB-LED (WS2812) — se pinout.
// Vanligast (ombordets RGB i PARALLELL på stiftet): strippen visar px 0–29 rätt och
// ombordets RGB speglar bara pixel 0 → behåll NUM_LEDS=30 nedan.
// Om strippen i stället ser 1 px FÖRSKJUTEN ut (ombordets RGB sitter i SERIE före
// strippen): sätt NUM_LEDS=31 och SEAT_STARTS/ENDS = {1,16}/{15,30}.
// (Vill du slippa helt: flytta strip-DIN till en ren fri pin, t.ex. GPIO48 eller GPIO47.)
#define LED_PIN     38
#define NUM_LEDS    30               // 2 platser × 15 px
#define NUM_SEATS   2
#define BRIGHTNESS  160
int SEAT_STARTS[NUM_SEATS] = {  0, 15 };   // plats 1 = px 1–15 (index 0–14), plats 2 = px 16–30 (index 15–29)
int SEAT_ENDS[NUM_SEATS]   = { 14, 29 };

// ===================== KNAPPAR (6 st = 2 spelare × ja/nej/kanske) =====================
// Varje knapp: GPIO → knapp → GND (INPUT_PULLUP, tryck = LOW). Verifierat mot pinout:
// alla fria GPIO, ingen krock med W5500/SD/USB/UART/strapping.
#define BTN_COUNT 6
const int   btnPins[BTN_COUNT]  = {   15,    16,       17,     18,     1,        2   };
const int   btnPlats[BTN_COUNT] = {    1,     1,        1,      2,     2,        2   };
const char* btnKnapp[BTN_COUNT] = { "ja", "nej", "kanske",  "ja", "nej", "kanske"  };
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

int lastReading[BTN_COUNT];
int btnState[BTN_COUNT];
unsigned long lastChange[BTN_COUNT];

CRGB toRGB(float h, float s, float v) {
  return CHSV((uint8_t)(h * 255.0 / 360.0), (uint8_t)(s * 2.55), (uint8_t)(v * 2.55));
}
float modV(const Look &L, unsigned long now) {
  if (L.blink > 0) { float p = max(140.0f, 520.0f - L.blink * 3.0f); return (((now / (unsigned long)p) % 2) == 0) ? L.v : 0; }
  if (L.puls > 0)  { float a = (L.puls / 100.0) * 0.6; float w = sinf(2 * PI * now / 1200.0) * 0.5 + 0.5; return L.v * (1 - a) + L.v * a * w; }
  return L.v;
}
int thirdOfPixel(int seat, int pixel) {
  int len = SEAT_ENDS[seat] - SEAT_STARTS[seat] + 1; if (len <= 0) return 0;
  int t = ((pixel - SEAT_STARTS[seat]) * 3) / len; return t < 0 ? 0 : (t > 2 ? 2 : t);
}

void render() {
  unsigned long now = millis();
  if (fxMode == "countdown") {
    float v = 20 + (sinf(2 * PI * now / 900.0) * 0.5 + 0.5) * 80;
    fill_solid(leds, NUM_LEDS, toRGB(0, 0, v)); FastLED.show(); return;
  }
  for (int s = 0; s < NUM_SEATS; s++)
    for (int i = SEAT_STARTS[s]; i <= SEAT_ENDS[s] && i < NUM_LEDS; i++) {
      int k = thirdOfPixel(s, i);
      const Look &L = thirdOn[s][k] ? thirdLook[s][k] : seatBase[s];
      leds[i] = toRGB(L.h, L.s, modV(L, now));
    }
  if (fxMode == "sweep") {
    float pxPerMs = 0.02 + (fxSpeed / 100.0) * 0.10;
    int head = ((int)(now * pxPerMs)) % NUM_LEDS;
    for (int o = 0; o < 6; o++) { int idx = (head - o + NUM_LEDS) % NUM_LEDS; uint8_t b = (uint8_t)(255 * (1.0 - o / 6.0)); leds[idx] += CRGB(b, (uint8_t)(b * 0.7), (uint8_t)(b * 0.12)); }
  }
  FastLED.show();
}

void onMsg(char *topic, byte *payload, unsigned int len) {
  String t(topic); char buf[256]; if (len > 255) len = 255; memcpy(buf, payload, len); buf[len] = 0;
  String ledRoot = String(ROOT) + "/out/led/";
  if (t.startsWith(ledRoot)) {
    String rest = t.substring(ledRoot.length()); int slash = rest.indexOf('/');
    JsonDocument d; if (deserializeJson(d, buf)) return;
    if (slash < 0) {
      int n = rest.toInt(); if (n < 1 || n > NUM_SEATS) return;
      Look &L = seatBase[n - 1]; L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f; L.puls = d["puls"] | 0.0f; L.blink = d["blink"] | 0.0f;
      for (int k = 0; k < 3; k++) thirdOn[n - 1][k] = false;
    } else {
      int n = rest.substring(0, slash).toInt(); int k = rest.substring(rest.lastIndexOf('/') + 1).toInt();
      if (n < 1 || n > NUM_SEATS || k < 1 || k > 3) return;
      Look &L = thirdLook[n - 1][k - 1]; L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f; thirdOn[n - 1][k - 1] = true;
    }
    return;
  }
  if (t == String(ROOT) + "/out/fx") { JsonDocument d; if (deserializeJson(d, buf)) return; fxMode = String((const char *)(d["fx"] | "none")); fxSpeed = d["speed"] | 50; }
}

void publishKnapp(int plats, const char *knapp) {
  char msg[48]; snprintf(msg, sizeof(msg), "{\"plats\":%d,\"knapp\":\"%s\"}", plats, knapp);
  mqtt.publish((String(ROOT) + "/knapp").c_str(), msg);
  Serial.print(F("[test2] knapp -> ")); Serial.println(msg);
}

void connectMqtt() {
  int tries = 0;
  while (!mqtt.connected() && tries++ < 5) {
    if (mqtt.connect(MQTT_CLIENT)) {
      Serial.println(F("[test2] MQTT connected + subscribed"));
      mqtt.subscribe((String(ROOT) + "/out/led/#").c_str());
      mqtt.subscribe((String(ROOT) + "/out/fx").c_str());
    } else { Serial.print(F("[test2] MQTT fail rc=")); Serial.println(mqtt.state()); delay(1000); }
  }
}

void setup() {
  Serial.begin(115200); delay(300); Serial.println(F("\n[test2] start (ESP32-S3-ETH, 2 spelare, 30 px)"));
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS); FastLED.setBrightness(BRIGHTNESS); FastLED.clear(true);
  for (int b = 0; b < BTN_COUNT; b++) { pinMode(btnPins[b], INPUT_PULLUP); lastReading[b] = HIGH; btnState[b] = HIGH; lastChange[b] = 0; }
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis(); while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) { delay(200); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) { Serial.print(F("\n[test2] WiFi OK, IP ")); Serial.println(WiFi.localIP()); } else Serial.println(F("\n[test2] WiFi FAILED"));
  mqtt.setServer(MQTT_HOST, MQTT_PORT); mqtt.setCallback(onMsg);
}

void readButtons() {
  for (int b = 0; b < BTN_COUNT; b++) {
    int reading = digitalRead(btnPins[b]);
    if (reading != lastReading[b]) { lastChange[b] = millis(); lastReading[b] = reading; }
    if (millis() - lastChange[b] > DEBOUNCE_MS && reading != btnState[b]) {
      btnState[b] = reading;
      if (btnState[b] == LOW) publishKnapp(btnPlats[b], btnKnapp[b]);
    }
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); delay(200); }
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  while (Serial.available()) { char k = Serial.read(); if (k == 't' || k == 'T') publishKnapp(btnPlats[0], btnKnapp[0]); }
  readButtons();
  render();
}
