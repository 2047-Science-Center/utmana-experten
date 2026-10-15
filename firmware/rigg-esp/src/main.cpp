/**
 * Utmana experten — rigg-firmware (DUM RENDERARE). Spegel av Eco Loco mellans
 * rigg-esp: firmwaren känner BARA lager 2 (granulära primitiver) och ritar dem;
 * all mening bor uppåt (hjärnan/Blocks). Två tillägg mot Eco Locos firmware:
 *   (a) plats delas i TRE TREDJEDELAR (ja/nej/kanske) — del-primitiven.
 *   (b) KNAPP-IN: läser arkadknapp(ar) och publicerar utmanaexperten/knapp.
 *
 * Lager 2 in:  <root>/out/led/<1-N>            {h,s,v,puls,blink}  hela platsen
 *              <root>/out/led/<1-N>/del/<1-3>  {h,s,v}             en tredjedel
 *              <root>/out/fx                    {fx,speed}          helslinge-overlay
 * In→MQTT ut:  <root>/knapp                     {plats,knapp}
 *
 * Behåller WS2812B/GRB, FastLED, PubSubClient + ArduinoJson, config.h-mönstret.
 */
#include <Arduino.h>
#include <FastLED.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
#else
  #include <WiFi.h>
#endif

CRGB leds[NUM_LEDS];
const int seatStarts[NUM_SEATS] = SEAT_STARTS;
const int seatEnds[NUM_SEATS]   = SEAT_ENDS;

const int   btnPins[BTN_COUNT]  = BTN_PINS;
const int   btnPlats[BTN_COUNT] = BTN_PLATS;
const char *btnKnapp[BTN_COUNT] = BTN_KNAPP;

// Knapp-debounce — tidsbaserad, icke-blockerande (speglar fargkapsel exakt):
// INPUT_PULLUP, tryck = LOW, avfyra på stabil nedtryckning. Ingen delay().
const unsigned long DEBOUNCE_MS = 50;
int lastReading[BTN_COUNT];
int btnState[BTN_COUNT];
unsigned long lastChange[BTN_COUNT];

struct Look { float h = 0, s = 0, v = 0, puls = 0, blink = 0; };
Look seatBase[NUM_SEATS];
Look thirdLook[NUM_SEATS][3];
bool thirdOn[NUM_SEATS][3];

String fxMode = "none";
int    fxSpeed = 50;

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

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

// Vilken tredjedel (0..2) en pixel i platsens intervall tillhör.
int thirdOfPixel(int seat, int pixel) {
  int start = seatStarts[seat];
  int end = seatEnds[seat];
  int len = end - start + 1;
  if (len <= 0) return 0;
  int rel = pixel - start;
  int third = (rel * 3) / len; // 0,1,2
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
    for (int i = seatStarts[s]; i <= seatEnds[s] && i < NUM_LEDS; i++) {
      int k = thirdOfPixel(s, i);
      const Look &L = thirdOn[s][k] ? thirdLook[s][k] : seatBase[s];
      leds[i] = toRGB(L.h, L.s, modV(L, now));
    }
  }

  // sweep = guldkomet som löper över stripen (turordnings-svep). Additivt.
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

  const String ledRoot = String(TOPIC_ROOT) + "/out/led/";
  if (t.startsWith(ledRoot)) {
    String rest = t.substring(ledRoot.length()); // "<n>" eller "<n>/del/<k>"
    int slash = rest.indexOf('/');
    if (slash < 0) {
      // hela platsen
      int n = rest.toInt();
      if (n < 1 || n > NUM_SEATS) return;
      JsonDocument d;
      if (deserializeJson(d, buf)) return;
      Look &L = seatBase[n - 1];
      L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f;
      L.puls = d["puls"] | 0.0f; L.blink = d["blink"] | 0.0f;
      for (int k = 0; k < 3; k++) thirdOn[n - 1][k] = false; // ny bas → nollställ tredjedelar
    } else {
      // en tredjedel: "<n>/del/<k>"
      int n = rest.substring(0, slash).toInt();
      int k = rest.substring(rest.lastIndexOf('/') + 1).toInt();
      if (n < 1 || n > NUM_SEATS || k < 1 || k > 3) return;
      JsonDocument d;
      if (deserializeJson(d, buf)) return;
      Look &L = thirdLook[n - 1][k - 1];
      L.h = d["h"] | 0.0f; L.s = d["s"] | 0.0f; L.v = d["v"] | 0.0f;
      L.puls = d["puls"] | 0.0f; L.blink = d["blink"] | 0.0f;
      thirdOn[n - 1][k - 1] = true;
    }
    return;
  }

  if (t == String(TOPIC_ROOT) + "/out/fx") {
    JsonDocument d;
    if (deserializeJson(d, buf)) return;
    fxMode = String((const char *)(d["fx"] | "none"));
    fxSpeed = d["speed"] | 50;
  }
}

void publishKnapp(int plats, const char *knapp) {
  char msg[48];
  snprintf(msg, sizeof(msg), "{\"plats\":%d,\"knapp\":\"%s\"}", plats, knapp);
  mqtt.publish((String(TOPIC_ROOT) + "/knapp").c_str(), msg);
  Serial.print(F("[rigg] knapp -> ")); Serial.println(msg);
}

void connectMqtt() {
  int tries = 0;
  while (!mqtt.connected() && tries++ < 5) {
    if (mqtt.connect(MQTT_CLIENT)) {
      Serial.println(F("[rigg] MQTT connected + subscribed"));
      mqtt.subscribe((String(TOPIC_ROOT) + "/out/led/#").c_str());
      mqtt.subscribe((String(TOPIC_ROOT) + "/out/fx").c_str());
    } else {
      Serial.print(F("[rigg] MQTT fail rc=")); Serial.println(mqtt.state());
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println(F("\n[rigg] start"));
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(255);

  for (int b = 0; b < BTN_COUNT; b++) {
    if (btnPins[b] >= 0) pinMode(btnPins[b], INPUT_PULLUP);
    lastReading[b] = HIGH;
    btnState[b] = HIGH;
    lastChange[b] = 0;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) { delay(200); }
  if (WiFi.status() == WL_CONNECTED) { Serial.print(F("[rigg] WiFi OK, IP ")); Serial.println(WiFi.localIP()); }
  else Serial.println(F("[rigg] WiFi FAILED"));

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(onMsg);
}

// Tidsbaserad debounce per knapp (fargkapsel-mönstret): fyra på stabil
// nedtryckning (LOW), inget blockerande delay().
void readButtons() {
  for (int b = 0; b < BTN_COUNT; b++) {
    if (btnPins[b] < 0) continue;
    int reading = digitalRead(btnPins[b]);
    if (reading != lastReading[b]) { lastChange[b] = millis(); lastReading[b] = reading; }
    if (millis() - lastChange[b] > DEBOUNCE_MS && reading != btnState[b]) {
      btnState[b] = reading;
      if (btnState[b] == LOW) publishKnapp(btnPlats[b], btnKnapp[b]); // nedtryck (aktiv-låg)
    }
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); delay(200); }
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  // Serie-trigger (fargkapsel): skicka 't' i monitorn → samma som att trycka knapp 1.
  while (Serial.available()) {
    char k = Serial.read();
    if ((k == 't' || k == 'T') && BTN_COUNT > 0) publishKnapp(btnPlats[0], btnKnapp[0]);
  }
  readButtons();
  render();
  yield();
}
