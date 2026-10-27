# Ljudsättning — förslag för hela Utmana experten

> **Status: FÖRSLAG att reagera på.** Ingen flödeskod ändrad, inget wire:at. Bygger
> vidare på `LJUDIDENTITET.md` och de 5 cues som redan spelas (`public/audio/`:
> boot/confirm/blip/win/deny). Smakprov att LYSSNA på ligger i
> `design/ljud/forslag/<riktning>/` (se del 2).

Spelet i en mening: **1–6 ungdomar tar ställning → möter verkligheten → får ändra sig.**
Den emotionella bågen ljudet ska bära: **självsäkerhet → överraskning → eftertanke → payoff.**
Ljudet ska låta som skärmen ser ut (Marquee: petrol/björk/bränd orange/creme + rymd/planet).

---

## Del 1 — Ljudkarta för hela flödet

Kolumnen **Hook** = var i koden cue:n triggas (eller behöver en ny trigger).
**FINNS** = spelas redan · **NY** = föreslås (inte inlagd i UI/flöde än).

### Ram & ambiens
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| **Attract-loop** (bädd innan start) | inbjudande, "kom hit" | loop | **NY** | attract-vyn i `UtmanaApp.vue` — starta/stoppa loop vid attract in/ut |
| Boot-anslag (tryck för att börja) | energi-kick, "nu kör vi" | 1 s | FINNS | `UtmanaApp.onAttractStart` (`audio.play('boot')`) |
| Namn bekräftat (incheckning) | litet varmt kvitto | 0.3 s | **NY** | `CheckinScreen.go()` per ifyllt namn (håll MYCKET kort, spelas upp till 6×) |

### Fråga & röstning (`present`, `vote`)
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| Fråge-/titel-anslag ("nytt yrke/dilemma") | nyfikenhet, "här kommer det" | 0.8 s | **NY** | `enterStep` → `present` (`store`) / `PresentStep` mount |
| Röst lagd (arkadknapp) | tillfredsställande bekräftelse | 0.3 s | FINNS | `castVote` (`audio.play('confirm')`), spelas upp till 6× |
| Alla har röstat (omröstning låst) | "då var det klart" | 0.6 s | **NY** | `castVote` → `allSeatsVoted` innan `stepComplete` |

### Tänk-turen (`speak_round`)
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| Tänk-bädd (lågmäld bakgrund) | fokus, ingen stress | loop | **NY** | `enterStep` → `speak_round` start/stopp |
| "Din tur" (första talaren) | mjuk inbjudan | 0.5 s | **NY** | `beginSpeakRound` (idag ljudlöst; `blip` finns bara vid turbyte) |
| Turbyte (nästa plats får ordet) | "nästa!" | 0.4 s | FINNS | `endTurn` (`audio.play('blip')`) |
| Timer-varning (~5 s kvar) | diskret puls, "skynda lite" | 0.3 s ×n | **NY** | `SpeakRoundStep` watch `remainingMs` / `secondsLeft === warnAtSeconds` |

### AI-bedömning & feedback (`assess`, `feedback`, `facit`)
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| "Bearbetar"-bädd (medan AI tänker) | spänd nyfikenhet | loop | **NY** | `store.assessing === true` |
| Bedömning klar | "aha, nu vet vi" | 0.8 s | **NY** | `runAssess` finally / `assessing → false` |
| AI-domen landar (per person) | varm, personlig | 0.6 s | **NY** | `FeedbackStep` när varje persons text visas |
| Facit avslöjas (rätt tänds) | "så här är det" | 0.8 s | **NY** | `enterStep` → `facit` / `facitRatt` (bara facit-format) |

### Gaten "Är du redo?" (NYTT steg)
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| Gate-inträde (förväntan) | laddning, "strax" | 1 s + ev. bädd | **NY** | `enterStep` → `gate` / `GateStep` mount |
| Grön tryckt (en plats redo) | kvitto | 0.3 s | FINNS* | `onKnapp` gate-gren (`audio.play('confirm')`) — *egen "redo"-cue vore bättre än confirm |
| **Alla gröna → kör** | utlösning, "nu händer det!" | 0.8 s | **NY** | gate `stepComplete` (alla redo) → leder in i klippet |

### Klipp, overlay, övergångar
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| Pre-klipp riser | bygg inför verkligheten | 1.5 s | **NY** | `enterStep` → `clip` (precis före) |
| Under klippet | *ducka* appens cues | — | **NY** | `clip` aktivt → sänk/pausa bädd så klippets eget ljud får plats |
| Overlay "Vill du ändra dig?" | mjuk mellanspels-chime | 0.6 s | **NY** | `OverlayStep` mount (matchar scale/fade-in-animationen) |
| Steg-korsfade (genomgående) | subtil whoosh | 0.3 s | **NY** (valfri) | `StepStage` `<Transition>` |

### Finalen (`reveal`) — payoff
| Moment | Känsla | Längd | Status | Hook |
|---|---|---|---|---|
| Pre-reveal riser | trumvirvel-förväntan | 1.5 s | **NY** | precis före `enterStep` → `reveal` |
| Fanfar / payoff | triumf + glimt i ögat | 1.5 s | FINNS | `enterStep` → `reveal` (`rig.ljud('fanfar')` + `audio.play('win')`) |
| Utfalls-sting (variant) | "X tänkte om" vs "ni stod fast" | 0.8 s | **NY** | `RevealStep` beroende på `delta.andrade` (två varianter) |

**Sammanfattning av vad som saknas mest** (störst effekt, minst jobb): attract-loop, tänk-bädd, timer-varning, "alla gröna → kör", pre-reveal riser, och en egen "redo"-cue i gaten. Dessa bär bågen; idag finns bara de fyra punkt-cuesen (boot/confirm/blip/win).

---

## Del 2 — Tre tematiska riktningar (+ för-start-tema)

Smakprov per riktning i `design/ljud/forslag/<mapp>/`: **`riser.mp3`** (förväntan före reveal/klipp), **`reveal-sting.mp3`** (payoff), **`mood-forstart-loop.mp3`** (känslan på attract, loopbar). Jämför genom att lyssna.

> **Om ledmotivet/musiken:** ElevenLabs text-to-SFX komponerar inte en riktig,
> igenkännbar melodi bra. `mood-forstart-loop` är därför en **känslo-/texturskiss**
> som visar riktningens färg — den faktiska loopbara slingan/ledmotivet letar Josef
> fram själv (eller så tar vi ett musik-verktyg). Alla *stingers/risers/cues* ovan
> går däremot utmärkt att generera med ElevenLabs.

### Riktning 1 — "Varmt varieté" · `varmt-variete/`
- **Klang:** vintage-brass (ventil/muted trumpet) + Hammond-orgel (lätt leslie) + rundad analog synth, analog bandvärme.
- **Känsla:** stolt men lekfull 60/70-tals rymdålders-frågesport i en varm trästudio. Glimten i ögat.
- **Ledmotiv:** brass bär melodin i fanfar/reveal, synth i attract/stingers, orgel som varm matta. En kort 5-tonsfras som varieras genom momenten.
- **För-start:** hela frasen lågmält på synth+orgel + mjukt publiksorl — går att höra i timmar.
- **Varför:** matchar Marquee-estetiken rakast och "game-show" mest; värmen tar udden av att det är ett allvarligt tema (yrkesval). Detta är i linje med nuvarande `LJUDIDENTITET.md`.

### Riktning 2 — "Retro-rymd" · `retro-rymd/`
- **Klang:** analog synth i förgrunden (arpeggio, varma pads) + kosmisk shimmer/stjärnglitter, Vangelis/80-tals sci-fi men varm (inte kall).
- **Känsla:** hoppfull framtid, rymd/planet-motivet hörbart, "omställning" och nya yrken kodat i ljudet.
- **Ledmotiv:** samma fras men buren av synth-arpeggio; reveal = ljus ackord-stöt + bells i stället för brass-fanfar.
- **För-start:** långsam pad + glest arpeggio + avlägsen shimmer — planetarie-lugn, inbjudande.
- **Varför:** lutar mot FRAMTID/förändring snarare än nostalgisk varieté; passar "Kompetens för omställning" och rymd-motivet. Modernare, mindre pampig.

### Riktning 3 — "Organisk omställning" · `organisk-omstallning/`
- **Klang:** handtrummor + plockade strängar (mandolin/kalimba) + varm björk-trä-marimba + andande pad, med en diskret elektronisk gnistra.
- **Känsla:** jordnära, mänsklig, "riktiga människor, riktiga jobb" — dokumentärt varmt snarare än blänkande game-show.
- **Ledmotiv:** frasen plockad på kalimba/mandolin; payoff = akustisk flourish + mjuk elektronisk shimmer.
- **För-start:** mjuk kalimba + strängar över andande pad, lågmält — handgjort och välkomnande.
- **Varför:** tonar ner show-elementet och lyfter ÄKTHETEN ("möt verkligheten"); kan kännas mer trovärdigt för ungdomar och knyter an till björk/trä i paletten. Risk: mindre "wow" än 1–2.

**Rekommendation att utgå från:** 1 och 2 är närmast nuvarande identitet; 3 är det djärva alternativet. Ett gångbart drag är **2 som grund-värld + brass-accenter från 1 i payoff-momenten** — framtid i bädden, show i fanfaren. Men lyssna på de tre `mood`/`riser`/`reveal`-smakproven och peka ut känslan först, så genererar vi hela biblioteket i vald riktning.
