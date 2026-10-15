/**
 * Svenska — all Utmana experten-copy. Injiceras i kitets i18n-bundle via
 * registerMessages(). Kitet självt hålls rent från station-copy.
 */
export const sv: Record<string, string> = {
  // --- Kit-överskrivningar ---
  'app.title': 'UTMANA EXPERTEN',
  'app.subtitle': 'Kompetens för omställning · 2047',
  'attract.tagline': 'Ta plats — tryck en knapp för att börja.',
  'attract.boot': 'STARTAR STUDION …',
  'common.press_to_start': 'TRYCK FÖR ATT BÖRJA',

  // --- Gemensamma knappar ---
  'common.continue': 'FORTSÄTT',
  'common.begin': 'KÖR',
  'common.next': 'NÄSTA',
  'common.done': 'KLAR',

  // --- Facilitator-kontroller ---
  'facil.pause': 'Paus',
  'facil.resume': 'Fortsätt',
  'facil.reset': 'Starta om',
  'facil.reset_confirm': 'Starta om hela stationen?',
  'facil.reset_yes': 'Ja, starta om',
  'facil.exit': 'Avsluta',
  'facil.exit_confirm': 'Avsluta stationen och gå till skrivbordet?',
  'facil.exit_yes': 'Ja, avsluta',
  'facil.cancel': 'Avbryt',
  'facil.paused_title': 'PAUSAT',
  'facil.paused_sub': 'Spelledaren har pausat. Vänta ett ögonblick.',

  // --- Studio / scen ---
  'studio.welcome': 'Välkomna till studion!',
  'studio.pick_format': 'Välj omgång',
  'studio.seats': 'Tävlande',
  'studio.seat': 'Plats {n}',
  'studio.gm_mode': 'Spelledarläge',
  'studio.self_mode': 'Självgående',
  'studio.waiting_gm': 'Väntar på spelledaren …',

  // --- Röstning ---
  'vote.title': 'Vad tycker ni?',
  'vote.fore': 'Rösta nu',
  'vote.efter': 'Rösta igen',
  'vote.ja': 'JA',
  'vote.nej': 'NEJ',
  'vote.kanske': 'KANSKE',
  'vote.cast': 'Plats {n} röstade',
  'vote.waiting': 'Väntar på fler röster …',

  // --- Tänk-tur ---
  'speak.your_turn': 'Plats {n} har ordet',
  'speak.prompt': 'Motivera kort hur ni tänker.',
  'speak.done': 'KLAR ▸',
  'speak.listening': 'Lyssnar …',
  'speak.round_done': 'Alla har sagt sitt.',
  'speak.manual_hint': 'Rösten fångas inte — skriv in i stället:',

  // --- AI / facit / feedback ---
  'assess.thinking': 'Experten tänker …',
  'facit.title': 'Facit',
  'facit.right_answer': 'Rätt svar: {val}',
  'feedback.title': 'Så här tänkte ni',
  'npc.error': 'Experten tappade tråden en stund — men bra tänkt!',

  // --- Reveal ---
  'reveal.title': 'Ändrade ni er?',
  'reveal.changed': '{n} av {m} tänkte om',
  'reveal.none': 'Ingen ändrade sig — ni stod fast.',
  'reveal.fanfar': 'Tack för att ni utmanade experten!',
}
