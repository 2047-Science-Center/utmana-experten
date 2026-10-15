/** Svenska — byggs nu. Alla spelbara strängar. */
export const sv: Record<string, string> = {
  // --- Gemensamt / kit ---
  'app.title': 'FÖRHANDLINGEN',
  'app.subtitle': 'X&Y-riggen · 2047',
  'common.press_to_start': 'TRYCK FÖR ATT BÖRJA',
  'common.press_to_skip': 'tryck för att hoppa över',
  'common.confirm': 'BEKRÄFTA',
  'common.cancel': 'NEJ, ÄNDRA',
  'common.next': 'NÄSTA',
  'common.back': 'TILLBAKA',
  'common.mute': 'LJUD AV',
  'common.unmute': 'LJUD PÅ',
  'common.capital': 'KAPITAL',
  'common.kr': '{n} kr',
  'common.timer': 'TID',
  'common.done_count': 'KLARA',
  'common.waiting': 'VÄNTAR …',
  'common.team': 'LAG',

  // --- Intro-klipp ---
  'intro.skip': 'Hoppa över',
  'intro.begin': 'BÖRJA',
  'onb.wait_other': 'Väntar på att andra valvet blir klart …',

  // --- Öppningssekvens (Titel → Deltagare → 3 pop-ups → klar-gate) ---
  'opening.tap_continue': 'tryck för att fortsätta',
  'opening.participants': 'Deltagare',
  'opening.tap_start': 'Tryck för att börja',
  'opening.headset_on': 'Ta på dig headsetet',
  'opening.begin': 'Börja',
  'opening.waiting_valv': 'Väntar på Valv {valv} …',
  // Överblicks-pop-ups (hur man vinner)
  'overview.p1': 'Det viktigaste är att få tag på er livsviktiga resurs — annars får ni 0 poäng.',
  'overview.p2': 'Spendera så lite pengar som möjligt. De pengar ni har kvar i slutet blir er poäng.',
  'overview.p3': 'Gissar ni rätt på motståndarens livsviktiga resurs — dubbel poäng.',
  'overview.secured': 'SÄKRAD',
  'overview.zero': '0 POÄNG',
  'overview.kept': 'KVAR',
  'overview.kept_is_points': 'KVAR = POÄNG',
  'overview.thrifty': 'Snål',
  'overview.wasteful': 'Slösig',
  'overview.points_short': 'p',
  'overview.right': 'RÄTT!',
  'overview.hide_yours': 'Dölj din egen',
  'overview.your_critical': 'Din livsviktiga',
  // Test 1
  'test1.pop1': 'Nu ska ni förhandla om ett styrkort.',
  'test1.pop2': 'Visa aldrig hur mycket ni är beredda att betala.',
  'test1.pop3': 'Ni har totalt 50 kr.',
  // Test 2 (livsviktig + pengar) återanvänder reveal-texterna nedan
  // Test 3
  'test3.instruction': 'Vilken resurs verkade vara livsviktig för det andra valvet? Lås er gissning — ingen får se den.',
  'test3.title': 'GISSNINGEN',
  // Resultat-popupar (efter test 2 & 3)
  'res.secured': 'Livsviktig resurs säkrad',
  'res.not_secured': 'Ej säkrad — detta gör att ni får 0 poäng från förhandlingen',
  'res.not_secured_short': 'Livsviktig resurs ej säkrad',
  'res.points': 'POÄNG',
  'res.remaining_capital': 'Kvarvarande kapital',
  'res.capital_is_points': 'Det kvarvarande kapitalet blir er poäng',
  'res.zero_points': '0 poäng',
  'res.guess_right': 'Rätt gissning',
  'res.guess_wrong': 'Fel gissning',
  'res.total': 'TOTALPOÄNG',
  'res.double_copy': 'Rätt gissning — ni fördubblar er poäng',
  'intro.memory': 'Inspelning från tidigare förhandling',
  'intro.must_win': 'Ni måste få tag på denna i förhandlingen, annars förlorar ni',
  'intro.get_ready': 'Gör er beredda att förhandla',
  'intro.double_on_right_guess': 'Poäng fördubblad vid rätt gissning',

  // --- Attract / boot ---
  'attract.boot': 'STARTAR TERMINAL …',
  'attract.tagline': 'En budgivning om resurser. Röster maskeras. Minst spenderat vinner.',

  // --- Roller ---
  'role.A': 'FÖRHANDLARE',
  'role.B': 'RAPPORTÖR',
  'role.A.desc': 'Sköter allt prat genom headsetet. Rör aldrig skärmen — budar bara med rösten.',
  'role.B.desc': 'Tyst under förhandlingen. Operatör av lagets skärm. Sköter avräkning och slutgissning.',

  // --- Login ---
  'login.title': 'ANSLUT LAG',
  'login.tag_band': 'Tagga ditt band',
  'login.tap_to_tag': 'TAGGA BAND (mock)',
  'login.members': 'Medlemmar',
  'login.assign_roles': 'Tilldela roller',
  'login.ready': 'LAGET KLART',
  'login.waiting_other': 'Väntar på det andra laget …',

  // --- Intro ---
  'intro.your_critical': 'ER LIVSVIKTIGA RESURS',
  'intro.critical_hint': 'Denna MÅSTE säkras. Avslöja den inte — motståndaren budar upp den.',
  'intro.start_round': 'STARTA RUNDAN',
  'intro.negotiator_goal': 'Förhandlare: spendera så lite som möjligt.',
  'intro.reporter_goal': 'Rapportör: lista ut motståndarens livsviktiga resurs.',

  // --- Bidding ---
  'critical.header': 'Resursen ni måste få tag på',
  'bidding.getready_title': 'Nu ska ni förhandla om resursen',
  'bidding.getready_countdown': 'Förhandlingen börjar om',
  'bidding.in_progress': 'BUDGIVNING PÅGÅR',
  'bidding.in_progress_sub': 'Den som är beredd att betala mest när tiden är ute får resursen.',
  'bidding.talk_now': 'Prata med motparten nu',
  'bidding.negotiating_now': 'NI FÖRHANDLAR OM',
  'bidding.negotiate_hint': 'Buda muntligt genom headseten. Tryck KLAR när budgivningen är över.',
  'bidding.done': 'AVSLUTA BUDGIVNINGEN',
  'bidding.entry_at': 'Avräkning hos lag {team} …',
  'bidding.price_for': 'Slutpris — lag {team} betalar',
  'bidding.active_hatch': 'AUKTION: {resource}',
  'bidding.open_me': 'ÖPPEN',
  'bidding.enter_result': 'Skriv in utfallet',
  'bidding.who_won': 'Vem vann?',
  'bidding.final_price': 'Slutpris (kr)',
  'bidding.no_buy': 'INGEN KÖPTE',
  'bidding.submit': 'BEKRÄFTA',
  'bidding.confirm_prompt': 'Bekräfta: {team} köpte {resource} för {price} kr?',
  'bidding.awaiting_confirm': 'Väntar på att vinnaren bekräftar …',
  'bidding.loser_enters': 'Förlorande lagets rapportör skriver in utfallet.',
  'bidding.your_turn_confirm': 'ETT KÖP VÄNTAR PÅ BEKRÄFTELSE',

  // --- Guessing ---
  'guess.title': 'GISSNINGSFAS',
  'guess.prompt': 'Vilken var motståndarens livsviktiga resurs?',
  'guess.submit': 'LÅS GISSNING',
  'guess.locked': 'Gissning låst. Väntar på det andra laget …',

  // --- Reveal / resultat ---
  'reveal.title': 'AVSLÖJANDE',
  'reveal.critical_was': '{team}s livsviktiga: {resource}',
  'reveal.secured': 'SÄKRAD ✓',
  'reveal.not_secured': 'EJ SÄKRAD ✗',
  'reveal.guess_right': 'Rätt gissning — poäng dubblad!',
  'reveal.guess_wrong': 'Fel gissning.',
  'reveal.capital_left': 'Kapital kvar: {n} kr',
  'reveal.team_score': 'Lagpoäng: {n}',
  'reveal.round_lost': 'Förlorad omgång — livsviktig ej säkrad.',
  'reveal.play_again': 'NOLLSTÄLL',

  // --- Intro-reveal (popup innan första förhandlingen) ---
  'reveal.your_critical_is': 'ER LIVSVIKTIGA RESURS ÄR',
  'reveal.here_is_money': 'HÄR ÄR ERA PENGAR',
  'reveal.money_here': 'syns här uppe',
  'reveal.start_trial': 'STARTA TESTET',
  'reveal.to_live': 'TILL SKARPT SPEL',
  'reveal.trial_rules_title': 'SÅ GÅR TESTET TILL',
  'reveal.trial_rules':
    'Förhandla muntligt med varandra. Skriv in priset när ni kommit överens — eller när tiden är ute.',
  'reveal.startkapital': 'Det här är ert startkapital',
  'reveal.critical_lose':
    'Det här är er livsviktiga resurs. Får ni inte tag på den förlorar ni förhandlingen.',

  // --- Resurser ---
  'resource.insulin': 'Insulin',
  'resource.branslecell': 'Bränslecell',
  'resource.styrkort': 'Styrkort',
  'resource.radiosandare': 'Radiosändare',
  'resource.membranfilter': 'Membranfilter',

  // Livsviktig-berättelse — visas BARA i intro-popupen (5 s) för det egna laget.
  'critical.copy.insulin':
    'Tre i ert valv är beroende av insulin — och kylförrådet slutade fungera i natt. Ni måste få tag på nytt innan lagret sinar.',
  'critical.copy.branslecell':
    'En cell har brunnit ut och reservkraften sjunker. Utan en ny slocknar livsuppehållningen sektion för sektion.',
  'critical.copy.styrkort':
    'Ett överslag stekte styrkortet. Tills det bytts styr ni luft och värme för hand — och det håller inte länge.',
  'critical.copy.radiosandare':
    'Er sändare slogs ut i stormen. Ni är avskurna — utan en ny når ni ingen.',
  'critical.copy.membranfilter':
    'Filtret är igensatt och proverna visar föroreningar. Utan ett nytt är dricksvattnet obrukbart inom dagar.',

  // --- Onboarding / tutorial ---
  'onboarding.next': 'NÄSTA',
  'onboarding.done': 'KLAR',
  'onboarding.skip': 'VI KAN REDAN',
  'onboarding.go_live': 'KÖR LIVE',
  'onboarding.retry': 'FÖRSÖK IGEN',

  'character.mentor': 'Kvartermästaren',
  'character.apprentice': 'Lärlingen',

  // Steg 1 — headset
  'onboarding.headset.prompt': 'Ta på dig headsetet och säg något.',
  'onboarding.headset.talk': 'TRYCK & TALA',
  'onboarding.headset.masking': 'Rösten maskeras …',
  'onboarding.headset.masked_done': 'Rösten är maskerad ✓',

  // Steg 2 — ramen
  'onboarding.frame.caption': 'Två valv · en hög förnödenheter',

  // Steg 3 — ett bud
  'onboarding.bid.prompt': 'Buda på den här.',
  'onboarding.bid.button': 'BUD',
  'onboarding.bid.won': 'VUNNEN',
  'onboarding.remaining': '{n} kvar',

  // Steg 4 — livsviktig resurs + knapphet
  'onboarding.critical.tag': 'ER LIVSVIKTIGA RESURS',
  'onboarding.critical.try': 'Prova en snabb omgång — spar till er livsviktiga.',
  'onboarding.critical.insufficient': 'OTILLRÄCKLIGT',
  'onboarding.critical.secured': 'SÄKRAD ✓',
  'onboarding.critical.missed': 'Ni hade inte råd. Livsviktiga förlorad.',

  // Steg 5 — dölja
  'onboarding.hide.try': 'Buda så det ser ut som att ni vill ha allt.',
  'onboarding.hide.only_prompt': 'Testa: buda BARA på er livsviktiga.',
  'onboarding.hide.exposed': 'GENOMSKÅDAD',
  'onboarding.hide.safe': 'Nu vet de inte vilken som är er.',

  // Steg 6 — roller
  'onboarding.roles.negotiator_desc': 'Pratar genom headsetet.',
  'onboarding.roles.reporter_desc': 'Lyssnar & gissar motståndarens livsviktiga.',
  'onboarding.roles.confirm': 'VI ÄR REDO',

  // Steg 7 — trial → live
  'onboarding.trial.watermark': 'ÖVNINGSOMGÅNG',
  'onboarding.trial.go': 'KÖR',

  // Karaktärsmanus (utbytbara narration-slots — text-läge nu)
  'narr.headset.mentor1': 'Där ja. Ingen hör vems röst det är.',
  'narr.frame.mentor1': 'Två valv. En hög förnödenheter. Ni ska förhandla om dem.',
  'narr.bid.apprentice1': 'Så jag budar, och pengarna dras?',
  'narr.bid.mentor1': 'Precis.',
  'narr.critical.mentor1': 'Det här är det NI måste få. Utan det klarar sig inte valvet.',
  'narr.critical.apprentice1': 'Då budar jag väl bara på den?',
  'narr.critical.mentor2': 'Om du har kvar pengar när den kommer. Ni har 100 — till alla fem.',
  'narr.hide.apprentice1': 'Men då behöver vi ju inte buda på nåt annat?',
  'narr.hide.mentor1':
    'Jo. Annars ser motståndaren direkt vilken som är er. Ni måste få det att verka som om ni vill ha allt.',
  'narr.roles.mentor1':
    'Förhandlaren pratar. Rapportören lyssnar — och gissar vilken deras livsviktiga var. Rätt gissning: dubbla poäng.',
  'narr.trial.before': 'Kör en övning. Ingen räknar poängen än.',
  'narr.trial.after': 'Nu kan ni det. Redo?',

  // --- Pilotpanel (finns ej i skarpt läge) ---
  'pilot.title': 'PILOTPANEL',
  'pilot.dataset': 'Dataset',
  'pilot.timer': 'Timer (s)',
  'pilot.view': 'Vy',
  'pilot.view.lag1': 'Lag 1',
  'pilot.view.lag2': 'Lag 2',
  'pilot.view.shared': 'Delad',
  'pilot.start': 'STARTA',
  'pilot.reset': 'NOLLSTÄLL',
  'pilot.autoplay': 'Auto-fyll lag',
}
