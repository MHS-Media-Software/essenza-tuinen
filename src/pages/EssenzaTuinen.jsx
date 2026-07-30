import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowRight, Phone, Mail, MapPin, Menu, X, ChevronDown, CheckCircle, Check,
  PencilRuler, Shovel, Hammer, Droplets, Leaf, TreePine, Sparkles, Upload, Wand2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConceptAdminBar from '../components/ConceptAdminBar';

// ── Brand tokens (echte gescrapete huisstijl essenzatuinen.nl) ───────────────
const NAVY   = '#1F2113';
const NAVY2  = '#2C3019';
const BLUE   = '#0B9D46';
const BLUE_D = '#087A37';
const SOFT   = '#E4F2E8';
const LIGHT  = '#F5F7EE';
const WHITE  = '#FFFFFF';
const INK    = '#1F2113';
const MUTED  = '#6B7060';
const LINE   = '#E6E8DC';
const LINE_D = 'rgba(255,255,255,0.14)';
const FONT_H = "'Poppins', sans-serif";
const FONT_B = "'Inter', sans-serif";
const MINT   = '#8FD9A8';

const NAAM   = 'Essenza';
const NAAM2  = 'Tuinen';
const MONO   = 'ET';
const LOGO       = '/generated/essenza-tuinen/logo.png';
const LOGO_WHITE = '/generated/essenza-tuinen/logo-white.png';
const EST    = 'Hoveniersbedrijf · ontwerp, aanleg & onderhoud';
const EMAIL  = 'info@essenzatuinen.nl';
const TEL     = '+31621448790';
const TEL_TXT = '06 21 44 87 90';
const WHATSAPP = '31621448790';
const WERKGEBIED = 'Zeeland & West-Brabant';
// Standalone app draait op de root ('' ); in de concepts-repo onder /essenza-tuinen.
export const BASE = (typeof window !== 'undefined' && window.__ESSENZA_ROOT__) ? '' : '/essenza-tuinen';

const IMG = {
  hero:  '/generated/essenza-tuinen/hero.png',
  about: '/generated/essenza-tuinen/about.png',
  d1: '/generated/essenza-tuinen/d1.png',
  d2: '/generated/essenza-tuinen/d2.png',
  dhout: '/generated/essenza-tuinen/d-hout.png',
  dwater: '/generated/essenza-tuinen/d-water.png',
  d3: '/generated/essenza-tuinen/d3.png',
  dboom: '/generated/essenza-tuinen/d-boom.png',
  pr1: '/generated/essenza-tuinen/pr1.png', pr2: '/generated/essenza-tuinen/pr2.png', pr3: '/generated/essenza-tuinen/pr3.png',
  pr4: '/generated/essenza-tuinen/pr4.png', pr5: '/generated/essenza-tuinen/pr5.png', pr6: '/generated/essenza-tuinen/pr6.png',
  pr7: '/generated/essenza-tuinen/pr7.png', pr8: '/generated/essenza-tuinen/pr8.png', pr9: '/generated/essenza-tuinen/pr9.png',
  pr10: '/generated/essenza-tuinen/pr10.png',
};

const HERO_SLIDES = [IMG.hero, IMG.pr8, IMG.dwater, IMG.pr6, IMG.pr1];

// ── Diensten (6 hoofddiensten met subdiensten + eigen pagina) ────────────────
export const DIENSTEN = [
  {
    nr: '01', icon: PencilRuler, img: IMG.d1, slug: 'tuinontwerp',
    title: 'Tuinontwerp', sub: 'Tekenen en ontwerpen',
    desc: 'Wij vertalen uw wensen naar een volledig tuinontwerp met beplantingsplan, materialen en een 3D-sfeerbeeld. Zo weet u vooraf precies hoe uw nieuwe tuin eruit komt te zien.',
    long: [
      'Elk mooi project begint met een doordacht plan. Tijdens een persoonlijke schouw brengen wij uw wensen, de ligging en de mogelijkheden van uw tuin in kaart. Vervolgens tekenen wij een compleet ontwerp: van indeling en looproutes tot beplanting, materialen en verlichting.',
      'U ontvangt een helder plan met een 3D-impressie, zodat u de sfeer al ervaart voordat de eerste schop de grond in gaat. Omdat wij het ontwerp ook zelf uitvoeren, is elk detail meteen technisch haalbaar en realistisch begroot.',
    ],
    subs: ['Ontwerp op maat', 'Beplantingsplan', '3D-visualisatie', 'Materiaal- & sfeeradvies'],
  },
  {
    nr: '02', icon: Shovel, img: IMG.d2, slug: 'tuinaanleg',
    title: 'Tuinaanleg', sub: 'Van ontwerp naar realisatie',
    desc: 'Eén vast team legt uw tuin vakkundig aan: grondwerk, bestrating, beplanting en gazon. Netjes uitgevoerd volgens plan, zonder verrassingen achteraf.',
    long: [
      'Wij realiseren uw tuin van A tot Z met een vast, eigen team. Van grondwerk en bestrating tot beplanting en gazon: alles wordt secuur uitgevoerd volgens het goedgekeurde ontwerp en de planning.',
      'Doordat ontwerp en uitvoering in één hand liggen, houdt u één aanspreekpunt en verloopt het werk soepel. Wij laten de tuin schoon en verzorgd achter, klaar om jarenlang van te genieten.',
    ],
    subs: ['Bestrating', 'Beplanting', 'Gazon', 'Grondwerk'],
  },
  {
    nr: '03', icon: Hammer, img: IMG.dhout, slug: 'houtbouw',
    title: 'Houtbouw', sub: 'Maatwerk in hout',
    desc: 'Schuttingen, vlonders, pergola\'s en overkappingen in duurzaam hardhout. Strak vakwerk dat structuur, privacy en warmte aan uw tuin toevoegt.',
    long: [
      'Hout geeft een tuin karakter, warmte en structuur. Wij maken schuttingen, vlonders, pergola\'s, overkappingen en tuinhuizen op maat, uitgevoerd in duurzaam hardhout met strak vakwerk.',
      'Van een luxe vlonderterras tot een sfeervolle overkapping of een privacyschutting: wij denken mee over het ontwerp en zorgen voor een constructie die jaren meegaat en naadloos in uw tuin past.',
    ],
    subs: ['Schuttingen', 'Vlonders & terrassen', 'Pergola\'s & overkappingen', 'Tuinhuizen & bergingen'],
  },
  {
    nr: '04', icon: Droplets, img: IMG.dwater, slug: 'watermanagement',
    title: 'Watermanagement', sub: 'Water als beleving én oplossing',
    desc: 'Van sfeervolle vijvers en zwembaden tot een automatische beregening en doordachte waterafvoer. Uw planten krijgen altijd genoeg water, u staat nooit meer met de tuinslang in de tuin.',
    long: [
      'Water maakt een tuin compleet. Wij leggen sfeervolle vijvers en luxe zwembaden aan, maar zorgen ook voor de techniek eronder: een automatische beregening met sproei-installatie en drainageslangen, plus een doordachte waterafvoer.',
      'Zo krijgen uw planten altijd precies genoeg water en voeding, houdt u droge voeten bij hevige regen en staat u nooit meer zelf met de tuinslang in de tuin.',
    ],
    subs: ['Vijvers', 'Zwembaden', 'Beregening & sproei-installatie', 'Waterafvoer & drainage'],
  },
  {
    nr: '05', icon: Leaf, img: IMG.d3, slug: 'tuinonderhoud',
    title: 'Tuinonderhoud', sub: 'Het hele jaar verzorgd',
    desc: 'Met een vast onderhoudscontract houden wij uw tuin het hele seizoen in topconditie: maairondes, hagen snoeien en bemesting. Ook eenmalig onderhoud is mogelijk.',
    long: [
      'Een mooie tuin blijft mooi met het juiste onderhoud. Met een vast onderhoudscontract komen wij meerdere keren per jaar langs voor maairondes, het snoeien van hagen en bemesting, zodat uw tuin het hele seizoen in topconditie blijft.',
      'Liever eenmalig? Ook voor een grote voorjaars- of najaarsbeurt bent u bij ons aan het juiste adres. Vaste gezichten, heldere afspraken en een tuin die er altijd verzorgd bij ligt.',
    ],
    subs: ['Onderhoudscontract', 'Eenmalig onderhoud', 'Snoeiwerk', 'Bemesting & gazonbeheer'],
  },
  {
    nr: '06', icon: TreePine, img: IMG.dboom, slug: 'boomverzorging',
    title: 'Boomverzorging', sub: 'Veilig en deskundig boomwerk',
    desc: 'Van vormsnoei tot het veilig verwijderen van grote bomen met de hoogwerker. Onze verzorgers werken secuur volgens de richtlijnen en adviseren over gezondheid en standplaats.',
    long: [
      'Bomen vragen om vakkennis en veiligheid. Onze verzorgers snoeien vormbomen, dunnen kronen uit en verwijderen waar nodig grote takken of complete bomen, veilig met de hoogwerker en volgens de geldende richtlijnen.',
      'Wij adviseren u ook over de gezondheid en standplaats van uw bomen, zodat ze gezond blijven en uw tuin veilig is. Het snoeiafval voeren wij netjes af.',
    ],
    subs: ['Boomsnoei', 'Hoogwerk', 'Bomen zagen & rooien', 'Boomveiligheid'],
  },
];
export const dienstBySlug = (slug) => DIENSTEN.find(d => d.slug === slug);

export const BRAND = {
  naam: NAAM, naam2: NAAM2, volledig: `${NAAM} ${NAAM2}`, est: EST,
  slug: 'essenza-tuinen', conceptPath: '/essenza-tuinen', conceptLabel: 'concepts.mhsmedia.nl/essenza-tuinen', site: 'https://essenzatuinen.nl',
  email: EMAIL, tel: TEL, telTxt: TEL_TXT, whatsapp: WHATSAPP, werkgebied: WERKGEBIED,
  sector: 'Hovenier · tuinontwerp, aanleg & onderhoud',
  NAVY, NAVY2, BLUE, BLUE_D, SOFT, LIGHT, WHITE, INK, MUTED, LINE, LINE_D, FONT_H, FONT_B, MINT,
  logo: LOGO, logoWhite: LOGO_WHITE,
  img: IMG,
};

export const PROJECTEN = [
  { img: IMG.pr1, label: 'Complete tuinrenovatie met pergola', type: 'Tuinaanleg' },
  { img: IMG.pr2, label: 'Strakke voortuin met bestrating', type: 'Tuinontwerp' },
  { img: IMG.pr3, label: 'Natuurlijke borders & beplanting', type: 'Tuinaanleg' },
  { img: IMG.pr7, label: 'Natuurvijver met vlonderbrug', type: 'Watermanagement' },
  { img: IMG.pr8, label: 'Natuurzwembad met hardhouten deck', type: 'Watermanagement' },
  { img: IMG.pr9, label: 'Moderne hardhouten schutting & poort', type: 'Houtbouw' },
  { img: IMG.pr6, label: 'Vlonderterras met loungehoek', type: 'Houtbouw' },
  { img: IMG.pr4, label: 'Onderhouden siertuin met parterre', type: 'Tuinonderhoud' },
  { img: IMG.pr10, label: 'Boomonderhoud met de hoogwerker', type: 'Boomverzorging' },
  { img: IMG.pr5, label: 'Siertuin met vormsnoei', type: 'Boomverzorging' },
];

export const REVIEWS = [
  { naam: 'Sophie', score: 5, init: 'S', bron: 'Google', when: 'een week geleden', tekst: 'Super geholpen door Henk! Denkt goed mee en de mannen werken heel hard, zelfs toen het heel warm was! Het dolomiet ligt er nu strak bij.' },
  { naam: 'Peter van Duin', score: 5, init: 'P', bron: 'Google', when: 'een maand geleden', tekst: 'Bedankt voor de fijne samenwerking en de verbetering van onze tuin. We zijn er erg blij mee.' },
  { naam: 'Steve Feng', score: 5, init: 'S', bron: 'Google', when: 'een maand geleden', tekst: 'Ik ben zeer tevreden over het onderhoud van mijn tuin. Dankzij het zorgvuldige en toegewijde werk van de tuinman ziet mijn tuin er weer als nieuw uit. Een echte aanrader!' },
  { naam: 'Arne van Groningen', score: 5, init: 'A', bron: 'Google', when: '3 maanden geleden', tekst: 'Heel tevreden over deze mannen die ons terras aangelegd hebben. Snel geschakeld en een goede prijs. Aanrader!' },
  { naam: 'Safar C.', score: 5, init: 'S', bron: 'Google', when: '5 maanden geleden', tekst: 'Prettige samenwerking. Goede kwaliteit. Uitstekende vakman. Ruimte voor onderhandeling. Empathisch en betrouwbaar. Zeer aanbevolen.' },
  { naam: 'Jan-Hein van Heesch', score: 5, init: 'J', bron: 'Google', when: '5 maanden geleden', tekst: 'Prima werk geleverd. Snel contact opgenomen en op korte termijn de klus geklaard. Netjes gewerkt en een goed snoeiadvies gekregen.' },
  { naam: 'Werkspot-klant', score: 5, init: 'W', bron: 'Werkspot', when: '2 weken geleden', tekst: 'De klus is prima verlopen. Snel gereageerd en het heeft niet lang geduurd voordat de klus geklaard was. Goed en netjes gewerkt.' },
];

export const WERKWIJZE = [
  { nr: '01', title: 'Kennismaking & schouw', desc: 'Wij komen bij u langs, bekijken de locatie en bespreken uw wensen, budget en de mogelijkheden van uw tuin.',
    detail: 'In een persoonlijk gesprek bij u thuis luisteren wij naar uw wensen en brengen wij de tuin in kaart: ligging, grondsoort, bestaande beplanting en de sfeer die u zoekt. Zo leggen we samen een helder vertrekpunt vast.' },
  { nr: '02', title: 'Ontwerp & offerte', desc: 'U ontvangt een helder tuinontwerp met beplantingsplan en een transparante offerte. Aanpassingen verwerken wij totdat het plan volledig klopt.',
    detail: 'Op basis van de schouw maken wij een compleet ontwerp met 3D-impressie, beplantingsplan en materiaalkeuze, plus een transparante offerte. We schaven net zo lang bij tot het plan helemaal naar wens is.' },
  { nr: '03', title: 'Vakkundige aanleg', desc: 'Ons vaste team realiseert uw tuin volgens planning: grondwerk, bestrating, houtbouw, water en beplanting. Netjes en zonder verrassingen achteraf.',
    detail: 'Ons eigen team gaat aan de slag volgens een strakke planning. Grondwerk, bestrating, houtbouw, water en beplanting: alles onder één dak en één aanspreekpunt, netjes uitgevoerd en zonder verrassingen achteraf.' },
  { nr: '04', title: 'Oplevering & onderhoud', desc: 'Wij leveren de tuin verzorgd op en lichten het onderhoud toe. Met een onderhoudscontract houden wij uw tuin het hele jaar in topconditie.',
    detail: 'Wij leveren de tuin schoon en verzorgd op en nemen het onderhoud met u door. Met een onderhoudscontract blijven wij betrokken en houden wij uw tuin het hele jaar door in topconditie.' },
];

export const FAQS = [
  { v: 'Verzorgen jullie het hele traject van ontwerp tot onderhoud?', a: 'Ja. Wij ontzorgen u van A tot Z: tuinontwerp, houtbouw, bestrating, water, beplanting en doorlopend onderhoud. U heeft één vast aanspreekpunt van eerste schets tot en met de nazorg.' },
  { v: 'Wat houdt jullie watermanagement precies in?', a: 'Alles rondom water in de tuin: sierlijke vijvers en zwembaden, maar ook een automatische beregening en sproei-installatie met drainageslangen en een doordachte waterafvoer. Zo krijgen uw planten altijd genoeg water en staat u nooit meer zelf met de tuinslang in de tuin.' },
  { v: 'Kan ik een vast onderhoudscontract afsluiten?', a: 'Zeker. Met een onderhoudscontract komen wij meerdere keren per jaar langs voor maairondes, het snoeien van hagen en bemesting. Snoeiwerk plannen wij doorgaans twee keer per jaar. Eenmalig onderhoud is uiteraard ook mogelijk.' },
  { v: 'In welke regio zijn jullie actief?', a: 'Wij werken in heel Zeeland en West-Brabant, van Middelburg en Goes tot Bergen op Zoom, Breda en omstreken. Twijfelt u of uw locatie binnen ons werkgebied valt? Neem gerust contact op.' },
  { v: 'Voor wie werken jullie het liefst?', a: 'Voor opdrachtgevers die kwaliteit en gemak vooropstellen en volledig ontzorgd willen worden. Wij leveren maatwerk van hoog niveau, van ontwerp tot en met onderhoud, zodat u onbezorgd van uw tuin geniet.' },
];

// Per-dienst veelgestelde vragen (voor de dienstpagina's)
export const DIENST_FAQS = {
  tuinontwerp: [
    { v: 'Krijg ik een 3D-impressie van mijn tuin?', a: 'Ja. Bij elk ontwerp maken wij een 3D-impressie, zodat u de sfeer, de indeling en de beplanting al ziet voordat de aanleg begint.' },
    { v: 'Kan ik alleen een tuinontwerp laten maken?', a: 'Dat kan. U kunt bij ons terecht voor uitsluitend een ontwerp, maar de meeste klanten laten ons het plan ook uitvoeren, zodat alles in één hand blijft.' },
    { v: 'Wat kost een tuinontwerp?', a: 'Dat hangt af van de grootte en de complexiteit van uw tuin. Na een persoonlijke schouw ontvangt u een transparante prijs op maat.' },
  ],
  tuinaanleg: [
    { v: 'Hoe lang duurt de aanleg van een tuin?', a: 'Dat verschilt per project. Na het ontwerp geven wij een heldere planning met een realistische doorlooptijd, die wij ook nakomen.' },
    { v: 'Verzorgen jullie ook het grondwerk en de afvoer?', a: 'Ja. Grondwerk, bestrating, beplanting, gazon en de afvoer van grond en materiaal verzorgen wij volledig.' },
    { v: 'Werken jullie met een vast team?', a: 'Altijd. Eén vast, eigen team legt uw tuin aan, van de eerste schop tot de oplevering.' },
  ],
  houtbouw: [
    { v: 'Welk hout gebruiken jullie?', a: 'Wij werken met duurzaam hardhout dat jarenlang meegaat en mooi veroudert. Een andere houtsoort is in overleg mogelijk.' },
    { v: 'Maken jullie alles op maat?', a: 'Ja. Schuttingen, vlonders, pergola\'s, overkappingen en tuinhuizen maken en plaatsen wij volledig op maat.' },
    { v: 'Kan houtbouw met de tuinaanleg gecombineerd worden?', a: 'Zeker, dat is juist ons voordeel: hout, bestrating, water en beplanting in één plan en met één vast team.' },
  ],
  watermanagement: [
    { v: 'Leggen jullie ook zwembaden aan?', a: 'Ja, van sfeervolle vijvers tot luxe (natuur)zwembaden, inclusief de techniek en filtering eronder.' },
    { v: 'Wat houdt een beregeningsinstallatie in?', a: 'Een automatisch systeem met sproeiers en drainageslangen dat uw tuin op vaste tijden water geeft. Zo staat u nooit meer zelf met de tuinslang in de tuin en krijgen uw planten altijd genoeg water.' },
    { v: 'Lossen jullie ook wateroverlast op?', a: 'Ja. Met een doordachte waterafvoer en drainage houdt u droge voeten, ook bij hevige regen.' },
  ],
  tuinonderhoud: [
    { v: 'Hoe vaak komen jullie langs met een contract?', a: 'Meerdere keren per jaar voor maairondes, hagen snoeien en bemesting. De frequentie stemmen wij op uw tuin af.' },
    { v: 'Kan ik ook eenmalig onderhoud aanvragen?', a: 'Ja, bijvoorbeeld een grote voorjaars- of najaarsbeurt, ook zonder vast contract.' },
    { v: 'Snoeien jullie ook hagen en vormbomen?', a: 'Zeker. Snoeiwerk plannen wij doorgaans twee keer per jaar in, afgestemd op de beplanting.' },
  ],
  boomverzorging: [
    { v: 'Werken jullie met een hoogwerker?', a: 'Ja. Grote bomen snoeien of verwijderen wij veilig met de hoogwerker, volgens de geldende richtlijnen.' },
    { v: 'Voeren jullie het snoeiafval af?', a: 'Altijd. Wij laten de tuin schoon en opgeruimd achter.' },
    { v: 'Kunnen jullie een boom veilig verwijderen?', a: 'Ja, van vormsnoei tot het compleet en veilig vellen en rooien van bomen, inclusief advies over de standplaats.' },
  ],
};

const DIENST_OPTIES = [...DIENSTEN.map(d => d.title), 'Combinatie', 'Anders'];
const OMVANG_OPTIES = ['Voortuin', 'Achtertuin', 'Complete tuin', 'Zakelijk / groenplan'];
const WERKGEBIED_PLAATSEN = ['Middelburg', 'Goes', 'Vlissingen', 'Terneuzen', 'Bergen op Zoom', 'Roosendaal', 'Breda', 'Etten-Leur'];

export const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

export function useCarousel() {
  const track = useRef(null);
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth - el.clientWidth > 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check);
    return () => { ro.disconnect(); window.removeEventListener('resize', check); };
  }, []);
  const scroll = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * Math.max(320, el.clientWidth * 0.8), behavior: 'smooth' });
  };
  return { track, canScroll, scroll };
}

// ── Scroll naar boven bij paginawissel ───────────────────────────────────────
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ── Google "G" logo ──────────────────────────────────────────────────────────
export function GoogleG({ size = 16 }) {
  return (
    <svg viewBox="0 0 48 48" style={{ width: size, height: size }} aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}

// ── Intro-preloader (logo-reveal die omhoog wegveegt, 1x per load) ───────────
let introShown = false;
export function Intro() {
  const [show, setShow] = useState(!introShown);
  useEffect(() => {
    if (introShown) { setShow(false); return; }
    introShown = true;
    const t = setTimeout(() => setShow(false), 1250);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          style={{ background: NAVY }}>
          <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl" style={{ background: 'rgba(11,157,70,0.25)' }} />
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative">
            {LOGO_WHITE
              ? <img src={LOGO_WHITE} alt={`${NAAM} ${NAAM2}`} style={{ height: 96, maxWidth: 300 }} className="object-contain" />
              : <p className="font-bold text-white" style={{ fontFamily: FONT_H, fontSize: '2rem' }}>{NAAM} <span style={{ color: MINT }}>{NAAM2}</span></p>}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35, duration: 0.7, ease: 'easeInOut' }} className="h-0.5 mt-4 origin-left rounded-full" style={{ background: MINT }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Navbar (transparant over hero → wit bij scroll, met Diensten-megamenu) ────
export function Navbar({ solid = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isSolid = solid || scrolled;
  const NAV = [
    { to: `${BASE}/projecten`, label: 'Projecten' },
    { to: `${BASE}/werkwijze`, label: 'Werkwijze' },
    { to: `${BASE}/over-ons`, label: 'Over ons' },
    { to: `${BASE}/vacatures`, label: 'Vacatures' },
    { to: `${BASE}/contact`, label: 'Contact' },
  ];
  const linkCol = isSolid ? INK : 'rgba(255,255,255,0.85)';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: isSolid ? 'rgba(255,255,255,0.9)' : 'transparent',
        backdropFilter: isSolid ? 'blur(18px)' : 'none',
        boxShadow: isSolid ? '0 4px 30px rgba(31,33,19,0.08)' : 'none',
        fontFamily: FONT_B,
      }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between" style={{ height: 76 }}>
        <Link to={BASE || '/'} className="flex items-center gap-3">
          {LOGO ? (
            <img src={isSolid ? LOGO : (LOGO_WHITE || LOGO)} alt={`${NAAM} ${NAAM2}`} className="object-contain"
              style={{ height: 58, maxWidth: 240 }} />
          ) : (
            <p className="font-bold text-lg tracking-tight" style={{ fontFamily: FONT_H, color: isSolid ? NAVY : WHITE }}>
              {NAAM} <span style={{ color: BLUE }}>{NAAM2}</span>
            </p>
          )}
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <Link to={`${BASE}/diensten`} className="flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: linkCol }}>
              Diensten
              <motion.div animate={{ rotate: mega ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
            <AnimatePresence>
              {mega && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 mt-2 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 overflow-hidden rounded-2xl"
                  style={{ background: WHITE, border: `1px solid ${LINE}`, width: 720, boxShadow: '0 24px 60px rgba(31,33,19,0.16)' }}>
                  <div className="px-6 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: LINE, background: LIGHT }}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: MUTED }}>Onze diensten · ontzorgd van A tot Z</span>
                    <Link to={`${BASE}/diensten`} className="text-[11px] font-bold" style={{ color: BLUE }}>Alle diensten →</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-3">
                    {DIENSTEN.map((d, i) => {
                      const Icon = d.icon;
                      return (
                        <motion.div key={d.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <Link to={`${BASE}/diensten/${d.slug}`}
                            className="flex flex-col gap-2 px-3.5 py-3 rounded-xl transition-all"
                            onMouseEnter={e => e.currentTarget.style.background = SOFT}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: SOFT }}>
                                <Icon className="w-4 h-4" style={{ color: BLUE }} />
                              </div>
                              <p className="text-sm font-bold" style={{ fontFamily: FONT_H, color: NAVY }}>{d.title}</p>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 pl-0.5">
                              {d.subs.map(s => (<span key={s} className="text-[11px]" style={{ color: MUTED }}>{s}</span>))}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: LINE, background: LIGHT }}>
                    <Link to={`${BASE}/projecten`} className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: WHITE, border: `1px solid ${LINE}`, color: NAVY }}>Bekijk onze projecten</Link>
                    <Link to={`${BASE}/contact`} className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl text-white transition-all hover:opacity-90"
                      style={{ background: BLUE }}>Offerte aanvragen →</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-semibold transition-colors hover:opacity-70" style={{ color: linkCol }}>{n.label}</Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to={`${BASE}/contact`} className="text-sm font-semibold transition-colors hover:opacity-70" style={{ color: linkCol }}>
            Offerte aanvragen
          </Link>
          <Link to={`${BASE}/configurator`} className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105"
            style={{ background: BLUE }}>
            <Wand2 className="w-4 h-4" /> Ontwerp uw tuin in 3D
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(v => !v)} style={{ color: isSolid ? NAVY : WHITE }}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden" style={{ background: WHITE, borderTop: `1px solid ${LINE}` }}>
            <div className="px-6 py-5 space-y-1">
              {[{ to: `${BASE}/diensten`, label: 'Diensten' }, ...NAV].map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold border-b" style={{ color: INK, borderColor: LINE }}>{n.label}</Link>
              ))}
              <Link to={`${BASE}/configurator`} onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 py-3 mt-3 text-sm font-bold text-white rounded-xl" style={{ background: BLUE }}>
                <Wand2 className="w-4 h-4" /> Ontwerp uw tuin in 3D
              </Link>
              <Link to={`${BASE}/contact`} onClick={() => setOpen(false)} className="block text-center py-3 text-sm font-bold rounded-xl" style={{ border: `1px solid ${LINE}`, color: NAVY }}>
                Offerte aanvragen →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Footer (4 kolommen, groot logo) ──────────────────────────────────────────
export function Footer() {
  return (
    <footer style={{ background: NAVY, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-10">
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <Link to={BASE || '/'} className="inline-flex items-center mb-5">
              {LOGO ? (
                <img src={LOGO_WHITE || LOGO} alt={`${NAAM} ${NAAM2}`} className="object-contain" style={{ height: 66, maxWidth: 260 }} />
              ) : (
                <p className="font-bold text-white text-2xl" style={{ fontFamily: FONT_H }}>{NAAM} <span style={{ color: MINT }}>{NAAM2}</span></p>
              )}
            </Link>
            <p className="text-[13px] leading-relaxed mb-5 max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Uw vaste hovenier voor tuinontwerp, houtbouw, watermanagement, aanleg, onderhoud en boomverzorging in Zeeland en West-Brabant. Eén vast team, één aanspreekpunt, volledig ontzorgd van A tot Z.</p>
            <div className="flex items-center gap-2.5">
              <a href="https://www.instagram.com/essenzatuinen" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.8)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.86s-.01 3.6-.07 4.86c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.9.07s-3.6-.01-4.86-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s.01-3.6.07-4.86c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.21 8.8 2.2 12 2.2zm0 3.24A6.56 6.56 0 1018.56 12 6.56 6.56 0 0012 5.44zm0 10.82A4.26 4.26 0 1116.26 12 4.26 4.26 0 0112 16.26zm6.82-11.08a1.53 1.53 0 11-1.53-1.53 1.53 1.53 0 011.53 1.53z"/></svg>
              </a>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.8)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.12-.27-.2-.57-.35z"/></svg>
              </a>
            </div>
          </div>
          <div className="md:col-span-3">
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Diensten</p>
            <ul className="space-y-2.5">
              {DIENSTEN.map(d => <li key={d.title}><Link to={`${BASE}/diensten/${d.slug}`} className="text-[13px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>{d.title}</Link></li>)}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Navigatie</p>
            <ul className="space-y-2.5">
              {[['/diensten', 'Diensten'], ['/projecten', 'Projecten'], ['/werkwijze', 'Werkwijze'], ['/over-ons', 'Over ons'], ['/vacatures', 'Vacatures'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={label}><Link to={`${BASE}${to}`} className="text-[13px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} /><a href={`tel:${TEL}`} className="text-[13px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>{TEL_TXT}</a></li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} /><a href={`mailto:${EMAIL}`} className="text-[13px] hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>{EMAIL}</a></li>
              <li className="flex items-center gap-2.5"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} /><span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{WERKGEBIED}</span></li>
            </ul>
            <Link to={`${BASE}/contact`} className="inline-flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105" style={{ background: BLUE }}>Offerte aanvragen →</Link>
          </div>
        </div>
        <div className="pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-2" style={{ borderColor: LINE_D }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>© {new Date().getFullYear()} {NAAM} {NAAM2} · Alle rechten voorbehouden</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Website gemaakt door <a href="https://mhsmedia.nl" target="_blank" rel="noopener noreferrer" className="font-bold transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.55)' }}>MHS Media</a></p>
        </div>
      </div>
    </footer>
  );
}

// ── Zwevende knoppen: Bel ons (pill) + WhatsApp (rond), beide in merkgroen ────
export function ContactFAB() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <a href={`tel:${TEL}`} className="flex items-center gap-2 pl-4 pr-5 h-14 rounded-full shadow-2xl transition-all hover:scale-105 text-white text-sm font-bold" style={{ background: BLUE }} title="Bel ons">
        <Phone className="w-4 h-4" /> Bel ons
      </a>
      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110" style={{ background: BLUE }} title="WhatsApp">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

// ── Layout (gedeeld door alle Essenza-pagina's) ──────────────────────────────
export function Layout({ children, solidNav = false }) {
  return (
    <div style={{ fontFamily: FONT_B, background: WHITE }}>
      <style>{`.mp-carousel::-webkit-scrollbar{display:none}`}</style>
      <Intro />
      <ScrollToTop />
      <Navbar solid={solidNav} />
      {children}
      <Footer />
      <ConceptAdminBar slug={BRAND.slug} />
      <ContactFAB />
    </div>
  );
}

// ── PageHeader (donkere paginakop voor subpagina's) ──────────────────────────
export function PageHeader({ eyebrow, title, intro, img = IMG.hero, children }) {
  return (
    <section className="relative overflow-hidden" style={{ background: NAVY }}>
      <div className="absolute inset-0">
        <img src={img} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, ${NAVY} 40%, rgba(31,33,19,0.7) 100%)` }} />
        <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl" style={{ background: 'rgba(11,157,70,0.28)' }} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-36 pb-16">
        {eyebrow && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: MINT }}>{eyebrow}</motion.p>}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-semibold text-white leading-[1.12] mb-5" style={{ fontFamily: FONT_H, fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', letterSpacing: '-0.02em' }}
          dangerouslySetInnerHTML={{ __html: title }} />
        {intro && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-[15px] md:text-base leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.72)' }}>{intro}</motion.p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

// ── Herbruikbare secties ─────────────────────────────────────────────────────
export function SectionKop({ eyebrow, title, sub, center }) {
  return (
    <motion.div {...fade} className={`mb-12 ${center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>{eyebrow}</p>
      <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>{title}</h2>
      {sub && <p className="text-base leading-relaxed mt-4" style={{ color: MUTED }}>{sub}</p>}
    </motion.div>
  );
}

export function USPBar() {
  const USPS = [
    ['Ontzorgd van A tot Z', 'Ontwerp t/m onderhoud'],
    ['Vast, eigen team', 'Bekende gezichten'],
    ['Heldere afspraken', 'Geen verrassingen achteraf'],
    ['Maatwerk van hoog niveau', 'Kwaliteit voorop'],
  ];
  return (
    <section style={{ background: LIGHT, fontFamily: FONT_B }} className="py-8">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {USPS.map(([label, sub], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: SOFT }}>
                <Check className="w-4 h-4" style={{ color: BLUE }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: NAVY }}>{label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DienstenGrid({ heading = true }) {
  return (
    <section id="diensten" className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {heading && <SectionKop eyebrow="Wat wij doen" title="Zes vakgebieden, onder één dak" sub="Van het eerste ontwerp tot en met het jaarlijkse onderhoud. Kies uw dienst of laat ons het complete traject verzorgen." />}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DIENSTEN.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div key={d.nr} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}>
                <Link to={`${BASE}/diensten/${d.slug}`}
                  className="rounded-3xl overflow-hidden group flex flex-col h-full" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 40px rgba(31,33,19,0.05)' }}>
                  <div className="relative overflow-hidden" style={{ height: 190 }}>
                    <img src={d.img} alt={d.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(31,33,19,0.55), transparent 60%)' }} />
                    <div className="absolute top-4 left-4 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: BLUE }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-1.5" style={{ color: BLUE }}>{d.nr} · {d.sub}</p>
                    <h3 className="font-bold mb-3" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>{d.title}</h3>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>{d.desc}</p>
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3" style={{ color: BLUE }}>Bekijk {d.title.toLowerCase()} <ArrowUpRight className="w-4 h-4" /></span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProjectenPreview() {
  const { track, canScroll, scroll } = useCarousel();
  const uitgelicht = PROJECTEN.slice(0, 8);
  return (
    <section id="projecten" className="py-16 md:py-20" style={{ background: LIGHT, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div {...fade} className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Ons werk</p>
            <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Projecten</h2>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={`${BASE}/projecten`} className="hidden sm:inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3" style={{ color: BLUE }}>Alle projecten <ArrowRight className="w-4 h-4" /></Link>
            {canScroll && (
              <>
                <button onClick={() => scroll(-1)} aria-label="Vorige" className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ background: WHITE, border: `1px solid ${LINE}`, color: NAVY }}><ArrowRight className="w-4 h-4 rotate-180" /></button>
                <button onClick={() => scroll(1)} aria-label="Volgende" className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all hover:scale-105" style={{ background: BLUE }}><ArrowRight className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </motion.div>
        <div ref={track} className="mp-carousel flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {uitgelicht.map((p, i) => (
            <motion.div key={p.label + i} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05, duration: 0.6 }}
              className="relative overflow-hidden group rounded-2xl flex-shrink-0 snap-start" style={{ width: 340, height: 420 }}>
              <img src={p.img} alt={p.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(31,33,19,0.88) 0%, rgba(31,33,19,0.1) 55%, transparent 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(11,157,70,0.9)', color: WHITE }}>{p.type}</span>
                <p className="text-white font-bold text-sm" style={{ fontFamily: FONT_H }}>{p.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <Link to={`${BASE}/projecten`} className="flex items-center justify-center gap-2 text-sm font-bold py-3.5 rounded-xl text-white" style={{ background: BLUE }}>Bekijk alle projecten <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  const { track, canScroll, scroll } = useCarousel();
  return (
    <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div {...fade} className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Opdrachtgevers</p>
            <h2 className="font-semibold mb-3" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Wat onze klanten zeggen</h2>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
              <GoogleG />
              <span className="flex gap-0.5">{[...Array(5)].map((_, j) => (<svg key={j} viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" style={{ color: '#F5B301' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>))}</span>
              <span className="text-[13px] font-bold" style={{ color: NAVY }}>5,0</span>
              <span className="text-[12px]" style={{ color: MUTED }}>· Google &amp; Werkspot</span>
            </div>
          </div>
          {canScroll && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => scroll(-1)} aria-label="Vorige" className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ background: WHITE, border: `1px solid ${LINE}`, color: NAVY }}><ArrowRight className="w-4 h-4 rotate-180" /></button>
            <button onClick={() => scroll(1)} aria-label="Volgende" className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all hover:scale-105" style={{ background: BLUE }}><ArrowRight className="w-4 h-4" /></button>
          </div>
          )}
        </motion.div>
        <div ref={track} className="mp-carousel flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {REVIEWS.map((r, i) => (
            <motion.div key={r.naam + i} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }}
              className="p-7 rounded-3xl flex flex-col flex-shrink-0 snap-start" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 40px rgba(31,33,19,0.05)', width: 350 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: SOFT, color: BLUE, fontFamily: FONT_H }}>{r.init}</div>
                  <div>
                    <p className="font-bold text-sm leading-tight" style={{ color: NAVY }}>{r.naam}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>{r.when}</p>
                  </div>
                </div>
                {r.bron === 'Google' ? <GoogleG /> : <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: '#EAF3FF', color: '#1A73E8' }}>werkspot</span>}
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(r.score)].map((_, j) => (
                  <svg key={j} viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: '#F5B301' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: INK }}>"{r.tekst}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Herbruikbaar FAQ-accordion-blok
export function FaqBlok({ items = FAQS, eyebrow = 'FAQ', title = 'Veelgestelde vragen', bg = LIGHT }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-16 md:py-20" style={{ background: bg, fontFamily: FONT_B }}>
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <motion.div {...fade} className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>{eyebrow}</p>
          <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>{title}</h2>
        </motion.div>
        <div className="space-y-3">
          {items.map((f, i) => {
            const on = open === i;
            return (
              <motion.div key={i} {...fade} transition={{ delay: (i % 6) * 0.05 }} className="rounded-2xl overflow-hidden" style={{ background: on ? SOFT : WHITE, border: `1px solid ${on ? BLUE : LINE}` }}>
                <button onClick={() => setOpen(on ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-sm" style={{ color: NAVY, fontFamily: FONT_H }}>
                  {f.v}
                  <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform" style={{ transform: on ? 'rotate(180deg)' : 'none', color: BLUE }} />
                </button>
                <AnimatePresence>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: MUTED }}>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  return <FaqBlok />;
}

export function CTABand({ eyebrow = 'Ontzorgd van A tot Z', title = 'Klaar voor een tuin om trots op te zijn?', sub = 'Vraag uw offerte aan. Wij komen graag bij u langs voor een persoonlijk plan op maat.', to = `${BASE}/contact`, label = 'Offerte aanvragen' }) {
  return (
    <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div {...fade} className="relative overflow-hidden rounded-3xl p-10 md:p-16" style={{ background: NAVY }}>
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(11,157,70,0.35)' }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: MINT }}>{eyebrow}</p>
              <h3 className="font-bold text-white" style={{ fontFamily: FONT_H, fontSize: 'clamp(1.2rem, 1.9vw, 1.55rem)', letterSpacing: '-0.025em' }}>{title}</h3>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.65)' }}>{sub}</p>
            </div>
            <Link to={to} className="flex-shrink-0 flex items-center gap-2 text-sm font-bold px-7 py-4 rounded-xl transition-all hover:scale-105 whitespace-nowrap" style={{ background: WHITE, color: NAVY }}>{label} <ArrowUpRight className="w-4 h-4" /></Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Over ons blok (herbruikbaar op home + eigen pagina) ──────────────────────
export function OverOnsBlok({ ctaNaarPagina = false }) {
  return (
    <section id="over-ons" className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <motion.div {...fade}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Over ons</p>
            <h2 className="font-semibold mb-6" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>
              Uw vaste hovenier in Zeeland &amp; West-Brabant
            </h2>
            {[
              'Essenza Tuinen is een hoveniersbedrijf met een passie voor groen. Wij ontwerpen, bouwen en onderhouden bijzondere tuinen voor particulieren en bedrijven in Zeeland en West-Brabant.',
              'Bij ons werkt u met één vast team, van eerste schets tot oplevering en nazorg. Tuinontwerp, houtbouw, watermanagement, aanleg, onderhoud en boomverzorging heeft u bij ons onder één dak: volledig ontzorgd van A tot Z.',
            ].map((t, i) => (<p key={i} className="text-base leading-relaxed mb-4" style={{ color: MUTED }}>{t}</p>))}
            <div className="grid grid-cols-3 gap-6 pt-8 mt-4 border-t" style={{ borderColor: LINE }}>
              {[['Vast team', 'Eén aanspreekpunt'], ['A tot Z', 'Alles onder één dak'], ['Zeeland & West-Brabant', 'Ons werkgebied']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-bold text-lg mb-1" style={{ fontFamily: FONT_H, color: NAVY }}>{v}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{l}</p>
                </div>
              ))}
            </div>
            {ctaNaarPagina && (
              <Link to={`${BASE}/over-ons`} className="inline-flex items-center gap-2 text-sm font-bold mt-8 transition-all hover:gap-3" style={{ color: BLUE }}>Meer over ons <ArrowRight className="w-4 h-4" /></Link>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ height: 480 }}>
              <img src={IMG.about} alt="Essenza Tuinen aan het werk" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-5 px-6 py-4 rounded-2xl shadow-xl text-white" style={{ background: NAVY }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MINT }}>Vakmanschap</p>
              <p className="text-sm font-bold" style={{ fontFamily: FONT_H }}>Hovenier met groen hart</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Werkwijze blok (herbruikbaar) ────────────────────────────────────────────
export function WerkwijzeBlok({ ctaNaarPagina = false }) {
  return (
    <section id="werkwijze" className="py-16 md:py-20" style={{ background: LIGHT, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div {...fade} className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Hoe wij werken</p>
          <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Van eerste schets tot verzorgde tuin</h2>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-5">
          {WERKWIJZE.map((s, i) => (
            <motion.div key={s.nr} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-7 rounded-2xl h-full" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm mb-6" style={{ background: SOFT, color: BLUE, fontFamily: FONT_H }}>{s.nr}</div>
              <h3 className="font-bold mb-2.5" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.05rem' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
        {ctaNaarPagina && (
          <div className="text-center mt-10">
            <Link to={`${BASE}/werkwijze`} className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3" style={{ color: BLUE }}>Lees meer over onze werkwijze <ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Waarom Essenza (informatie-dicht blok) ───────────────────────────────────
export function WaaromBlok() {
  const REDENEN = [
    { icon: CheckCircle, t: 'Alles onder één dak', d: 'Ontwerp, houtbouw, water, aanleg, onderhoud en boomverzorging: u regelt niets los, wij verzorgen het complete traject.' },
    { icon: Check, t: 'Eén vast, eigen team', d: 'Geen wisselende onderaannemers maar bekende gezichten die uw tuin door en door kennen, van start tot nazorg.' },
    { icon: Leaf, t: 'Maatwerk van hoog niveau', d: 'Geen standaardpakketten. Wij ontwerpen en bouwen een tuin die volledig bij u, uw woning en uw wensen past.' },
    { icon: MapPin, t: 'Lokaal in Zeeland & West-Brabant', d: 'Wij kennen de grond, het klimaat en de streek. Kort op de bal en snel ter plaatse, van Middelburg tot Breda.' },
  ];
  return (
    <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Waarom Essenza Tuinen</p>
          <h2 className="font-semibold mb-4" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.02em' }}>Vakmanschap, gemak en één aanspreekpunt</h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: MUTED }}>
            Wij werken voor opdrachtgevers die kwaliteit en gemak vooropstellen. Daarom brengen wij zes vakgebieden samen in één team, met heldere afspraken, een transparante offerte en een strakke planning die wij nakomen.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {REDENEN.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.t} className="flex gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: SOFT }}>
                    <Icon className="w-4 h-4" style={{ color: BLUE }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: NAVY, fontFamily: FONT_H }}>{r.t}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{r.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-3xl overflow-hidden" style={{ height: 440 }}>
            <img src={IMG.pr1} alt="Tuin door Essenza Tuinen" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 right-10 p-6 rounded-2xl shadow-xl grid grid-cols-3 gap-4" style={{ background: NAVY }}>
            {[['A–Z', 'Ontzorgd'], ['6', 'Vakgebieden'], ['9,8', 'Waardering']].map(([v, l]) => (
              <div key={l}>
                <p className="font-bold text-white" style={{ fontFamily: FONT_H, fontSize: '1.4rem' }}>{v}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Hero (Ken Burns-slideshow) ───────────────────────────────────────────────
export function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="top" className="relative overflow-hidden flex items-center" style={{ minHeight: '100vh', background: NAVY, fontFamily: FONT_B }}>
      <div className="absolute inset-0">
        <AnimatePresence>
          <motion.img key={i} src={HERO_SLIDES[i]} alt="" className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1.12 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: 7, ease: 'linear' } }} />
        </AnimatePresence>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(24,26,15,0.94) 0%, rgba(24,26,15,0.7) 45%, rgba(24,26,15,0.4) 100%)' }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${NAVY} 1%, transparent 40%)` }} />
      </div>
      <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-8 w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center pt-28 pb-14">
        {/* Linkerkolom: tekst */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide"
            style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.9)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: MINT }} />
            Hoveniersbedrijf · Zeeland &amp; West-Brabant
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.8 }}
            className="text-white leading-[1.14] mb-5"
            style={{ fontFamily: FONT_H, fontSize: 'clamp(1.55rem, 2.8vw, 2.3rem)', fontWeight: 600, letterSpacing: '-0.015em' }}>
            Uw droomtuin, <span style={{ color: MINT }}>ontworpen, aangelegd en verzorgd</span> door één vast team.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-[15px] leading-relaxed mb-7 max-w-lg" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Van tuinontwerp en houtbouw tot watermanagement, aanleg, onderhoud en boomverzorging. Zes vakgebieden onder één dak, één aanspreekpunt en heldere afspraken. Volledig ontzorgd van A tot Z.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-x-6 gap-y-3.5 mb-8 max-w-md">
            {[[CheckCircle, 'Ontzorgd van A tot Z'], [Check, 'Vast, eigen team'], [MapPin, 'Zeeland & West-Brabant'], [CheckCircle, '9,8 klantwaardering']].map(([Icon, t]) => (
              <span key={t} className="inline-flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}><Icon className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} /> {t}</span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-5">
            <Link to={`${BASE}/projecten`} className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: WHITE }}>
              Bekijk ons werk <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={`tel:${TEL}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors">
              <Phone className="w-4 h-4" style={{ color: MINT }} /> {TEL_TXT}
            </a>
          </motion.div>
          {/* Slide-indicatoren */}
          <div className="flex gap-2 mt-9">
            {HERO_SLIDES.map((_, j) => (
              <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j + 1}`} className="rounded-full transition-all" style={{ width: j === i ? 24 : 8, height: 6, background: j === i ? MINT : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        </div>

        {/* Rechterkolom: offerte-formulier */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          className="rounded-3xl p-6 md:p-8" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLUE }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: BLUE }}>Offerte aanvragen</p>
          </div>
          <h2 className="font-semibold mb-1.5" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>Ontvang een prijs op maat</h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: MUTED }}>Vertel kort over uw tuin. Wij komen graag bij u langs voor een persoonlijk advies en een heldere offerte.</p>
          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
}

// ── Multi-step Contactformulier ──────────────────────────────────────────────
function fileToDataUrl(file, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const s = maxDim / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s);
        }
        const c = document.createElement('canvas'); c.width = width; c.height = height;
        c.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject; img.src = reader.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export function ContactForm() {
  const functie = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search).get('functie') : null;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    dienst: functie ? 'Anders' : '',
    omvang: '',
    naam: '', telefoon: '', email: '',
    bericht: functie ? `Sollicitatie voor de functie: ${functie}.\n\n` : '',
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const steps = ['Dienst', 'Uw tuin', 'Gegevens'];
  const last = steps.length - 1;

  const handleSend = async () => {
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: form.naam, email: form.email, telefoon: form.telefoon,
          bron: 'contactformulier', tier: form.omvang,
          note: [form.dienst && `Dienst: ${form.dienst}`, form.omvang && `Type tuin: ${form.omvang}`, form.bericht].filter(Boolean).join(' · '),
        }),
      });
      setSent(true);
    } catch { alert('Er ging iets mis. Probeer het opnieuw.'); }
    setLoading(false);
  };

  const inp = "w-full px-4 py-3.5 text-sm outline-none rounded-xl border transition-colors";
  const inpStyle = { borderColor: LINE, background: WHITE, color: INK };

  if (sent) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: SOFT }}>
        <CheckCircle className="w-8 h-8" style={{ color: BLUE }} />
      </div>
      <h3 className="font-bold text-xl mb-2" style={{ fontFamily: FONT_H, color: NAVY }}>Aanvraag ontvangen</h3>
      <p className="text-sm" style={{ color: MUTED }}>Wij nemen zo snel mogelijk contact met u op met een echte prijs op maat.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={i <= step ? { background: BLUE, color: WHITE } : { background: LIGHT, color: MUTED, border: `1px solid ${LINE}` }}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[11px] font-bold hidden sm:block" style={{ color: i <= step ? NAVY : MUTED }}>{s}</span>
            </div>
            {i < last && <div className="flex-1 h-0.5 mx-3 rounded" style={{ background: i < step ? BLUE : LINE }} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <div>
              <p className="text-sm font-bold mb-4" style={{ color: NAVY }}>Waarmee kunnen wij u helpen?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {DIENST_OPTIES.map(o => (
                  <button key={o} onClick={() => set('dienst', o)} className="px-4 py-3 text-left text-xs font-semibold rounded-xl border transition-all"
                    style={form.dienst === o ? { borderColor: BLUE, background: SOFT, color: NAVY } : { borderColor: LINE, background: WHITE, color: MUTED }}>{o}</button>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-bold mb-4" style={{ color: NAVY }}>Om wat voor tuin gaat het?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {OMVANG_OPTIES.map(o => (
                  <button key={o} onClick={() => set('omvang', o)} className="px-4 py-3 text-xs font-semibold rounded-xl border transition-all"
                    style={form.omvang === o ? { borderColor: BLUE, background: SOFT, color: NAVY } : { borderColor: LINE, background: WHITE, color: MUTED }}>{o}</button>
                ))}
              </div>
              <textarea rows={3} placeholder="Beschrijf wat u gedaan wilt hebben (bv. nieuw terras + border)" value={form.bericht} onChange={e => set('bericht', e.target.value)} className={`${inp} resize-none`} style={inpStyle} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2.5">
              <p className="text-sm font-bold mb-4" style={{ color: NAVY }}>Uw contactgegevens</p>
              {[{ k: 'naam', p: 'Naam *', t: 'text' }, { k: 'telefoon', p: 'Telefoonnummer *', t: 'tel' }, { k: 'email', p: 'E-mailadres', t: 'email' }].map(({ k, p, t }) => (
                <input key={k} type={t} placeholder={p} value={form[k]} onChange={e => set(k, e.target.value)} className={inp} style={inpStyle} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2.5 mt-6 pt-5 border-t" style={{ borderColor: LINE }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="px-5 py-3.5 text-xs font-bold rounded-xl border transition-all hover:bg-gray-50" style={{ borderColor: LINE, color: MUTED }}>← Terug</button>
        )}
        {step < last ? (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.dienst}
            className="flex-1 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-30" style={{ background: BLUE }}>
            Volgende →
          </button>
        ) : (
          <button onClick={handleSend} disabled={!form.naam || !form.telefoon || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-30" style={{ background: BLUE }}>
            {loading && <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: WHITE }} />}
            {loading ? 'Verzenden...' : 'Ontvang echte prijs + offerte'}
            {!loading && <ArrowUpRight className="w-4 h-4" />}
          </button>
        )}
      </div>
      <Link to={`${BASE}/configurator`} className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70" style={{ color: BLUE }}>
        <Sparkles className="w-3.5 h-3.5" /> Liever zelf ontwerpen? Open de 3D-tuinconfigurator →
      </Link>
    </div>
  );
}

// ── Contact blok (contactgegevens + formulier + werkgebied-pills) ────────────
export function ContactBlok() {
  return (
    <section id="contact" className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          <motion.div {...fade}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: BLUE }}>Contact</p>
            <h2 className="font-semibold mb-6" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Vraag uw offerte aan</h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: MUTED }}>
              Wilt u uw tuin laten ontwerpen, aanleggen of onderhouden? Neem contact op. Wij komen graag bij u langs voor een persoonlijk advies en een heldere offerte op maat.
            </p>
            <div className="space-y-4">
              {[{ icon: Phone, label: 'Telefoon', val: TEL_TXT, href: `tel:${TEL}` },
                { icon: Mail, label: 'E-mail', val: EMAIL, href: `mailto:${EMAIL}` },
                { icon: MapPin, label: 'Werkgebied', val: WERKGEBIED, href: null }].map(({ icon: Icon, label, val, href }) => {
                const el = (
                  <div className="flex items-center gap-4 p-4 rounded-2xl transition-all" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: SOFT }}>
                      <Icon className="w-4 h-4" style={{ color: BLUE }} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{label}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: NAVY }}>{val}</p>
                    </div>
                  </div>
                );
                return href ? <a key={label} href={href} className="block hover:opacity-80 transition-opacity">{el}</a> : <div key={label}>{el}</div>;
              })}
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: MUTED }}>Werkgebied · Zeeland &amp; West-Brabant</p>
              <div className="flex flex-wrap gap-2">
                {WERKGEBIED_PLAATSEN.map((plaats) => (
                  <span key={plaats} className="text-xs font-semibold px-3.5 py-1.5 rounded-full" style={{ background: LIGHT, border: `1px solid ${LINE}`, color: INK }}>{plaats}</span>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="p-8 md:p-10 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 20px 60px rgba(31,33,19,0.08)' }}><ContactForm /></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Homepage (previews die naar de eigen pagina's linken) ────────────────────
export default function EssenzaTuinen() {
  return (
    <Layout>
      <Hero />
      <USPBar />
      <OverOnsBlok ctaNaarPagina />
      <DienstenGrid />
      <WaaromBlok />
      <WerkwijzeBlok ctaNaarPagina />
      <ProjectenPreview />
      <Reviews />
      <FAQ />
      <CTABand />
    </Layout>
  );
}
