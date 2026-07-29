import React from 'react';
import VoorstelTemplate from '../components/voorstel/VoorstelTemplate';
import { BRAND } from './EssenzaTuinen';

// Voorstel voor Essenza Tuinen — inhoud o.b.v. de onboarding met Henk van Westerveld (10 juli 2026).
const data = {
  brand: BRAND,
  datum: '14 juli 2026',
  jaar: '2026',
  geldigTot: '14 augustus 2026',
  clientSigner: 'Henk van Westerveld',
  sectorLabel: 'Hovenier · tuinontwerp, aanleg & onderhoud · Zeeland & West-Brabant',

  headline: 'De complete online etalage voor volledig ontzorgd tuinvakmanschap.',
  intro: 'Essenza Tuinen levert hoogwaardig werk voor opdrachtgevers die kwaliteit en gemak vooropstellen. Dit voorstel laat zien hoe wij dat vakmanschap online net zo overtuigend maken: een premium website met een helder dienstenmenu, een portfolio dat vertrouwen wekt, slimme leadfilters en een eigen dashboard dat elke aanvraag van bron tot getekende opdracht volgt.',
  doelen: ['Volledig ontzorgd van A tot Z', 'Meer hoogwaardige tuinaanvragen', 'Eigen dashboard & 3D-configurator'],

  aanpakKop: 'Een online etalage die past bij het niveau van uw werk.',
  aanpakIntro1: 'Uw ideale klant hecht waarde aan een volledig ontzorgde ervaring en is niet in de eerste plaats prijsgevoelig. Toch is uw vakmanschap online nauwelijks terug te vinden: geen gedetailleerd dienstenmenu, geen portfolio per vakgebied en geen manier om serieuze aanvragen te scheiden van vrijblijvende. Daardoor blijven waardevolle opdrachten liggen.',
  aanpakIntro2: 'Dit voorstel gaat daarom niet over een mooiere website alleen, maar over drie samenhangende uitkomsten: een site die het complete verhaal van A tot Z vertelt en bezoekers omzet in serieuze aanvragen, lokale marketing die u bovenaan zet in heel Zeeland en West-Brabant, en een dashboard plus 3D-configurator waarmee u projecten van meet af aan helder inricht.',
  aanpak: [
    { title: 'Een premium website met volledig dienstenmenu', body: 'Een verfijnde site met een gedetailleerd menu (Tuinontwerp, Houtbouw, Watermanagement, Tuinaanleg, Tuinonderhoud, Boomverzorging), een portfolio per vakgebied en een dienstenpagina die "ontzorgd van A tot Z" tastbaar maakt.', result: 'Premium website + dienstenmenu' },
    { title: 'Lokaal gevonden worden in Zeeland & West-Brabant', body: 'Groei via organische content per dienst en plaats, van Middelburg en Goes tot Breda en Bergen op Zoom, gecombineerd met een sterk Google Bedrijfsprofiel en gerichte advertenties voor koopklare zoekers.', result: 'SEO + Google Ads + lokale vindbaarheid' },
    { title: 'Dashboard, leadfilter én 3D-configurator', body: 'Een dashboard dat elke aanvraag van bron tot opdracht volgt, een getrapt prijsmodel dat serieuze leads filtert, en op termijn een 3D-tuinconfigurator waarmee klanten zelf hun tuin ontwerpen.', result: 'CRM-dashboard + configurator' },
  ],

  fundamentKop: 'Een website die net zo verzorgd is als uw tuinen.',
  fundamentBody: 'Wij bouwen een premium, conversiegerichte website voor Essenza Tuinen, afgestemd op opdrachtgevers die volledig ontzorgd willen worden. Met een gedetailleerd dienstenmenu, een portfolio met filters, een vacaturepagina en een slimme offerteflow die serieuze aanvragen naar boven haalt.',
  website: [
    { title: 'Homepage met fotoslideshow', desc: 'Een sfeervolle hero-slideshow met eigen werk en inspiratie, een helder dienstenmenu, USP-blok, portfolio en reviews, gebouwd om te overtuigen én te converteren.', tag: 'Kern' },
    { title: 'Gedetailleerd dienstenmenu', desc: 'Zes vakgebieden met subdiensten (o.a. vijvers, zwembaden, schuttingen, bestrating, snoei) vangen elke specifieke zoekvraag van uw bezoekers op.', tag: 'Structuur' },
    { title: 'Projecten- & vacaturepagina', desc: 'Een portfolio met categoriefilters dat vakmanschap toont, plus een prominente vacaturepagina voor Sales, Voorman en Hoveniers niveau 2 t/m 4.', tag: 'Groei' },
    { title: 'Slimme offerteflow met leadfilter', desc: 'Een meertraps offerteformulier met AI-visualisatie en een getrapt prijsmodel (Premium, Standaard, Budget) dat serieuze aanvragen scheidt van vrijblijvende.', tag: 'Leads' },
    { title: 'Dashboard, CRM & 3D-configurator', desc: 'Een eigen backend voor leads, urenregistratie en personeelsbeheer, met als volgende stap een 3D-tuinconfigurator naar voorbeeld van trendhout.nl.', tag: 'Data' },
  ],
  uitdagingen: [
    'Vakmanschap is online nauwelijks terug te vinden',
    'Geen gedetailleerd dienstenmenu voor specifieke zoekvragen',
    'Geen manier om serieuze aanvragen te filteren',
    'Geen zicht op leads, uren of personeel in één systeem',
  ],
  oplossingen: [
    'Een premium etalage die A-tot-Z-ontzorging uitstraalt',
    'Menu per dienst en plaats voor sterke lokale vindbaarheid',
    'Getrapt prijsmodel dat serieuze leads naar boven haalt',
    'Eén dashboard voor leads, uren, personeel en offertes',
  ],

  marketingKop: 'Gevonden worden op het moment dat men een hovenier zoekt.',
  marketingBody: 'De website is het fundament, marketing is de motor. Wij combineren betaald verkeer voor snel resultaat met organische groei voor blijvende autoriteit in heel Zeeland en West-Brabant. Het advertentiebudget is bewust gekozen als minimum om snel genoeg data te verzamelen voor effectieve optimalisatie.',
  marketing: [
    { tag: 'SEO · organisch', title: 'Blijvende lokale vindbaarheid', body: 'Diepgaande content per dienst en plaats, zoals tuinaanleg en watermanagement in uw werkgebied. Dit bouwt autoriteit op die blijft werken, ook als de advertenties uitstaan. Maandelijks opzegbaar.' },
    { tag: 'SEA · Google Ads', title: 'Direct koopklare aanvragen', body: 'Vanaf dag een zichtbaar bij koopklare zoekopdrachten, met verkeer naar zeer relevante landingspaginas. Dit levert direct aanvragen terwijl de SEO tractie opbouwt.' },
  ],
  gmbNote: '<strong>Advertentiebudget:</strong> het Google Ads-budget van <strong>v.a. € 1.200 per maand</strong> betaalt u rechtstreeks aan Google. Dit is het minimum dat nodig is om snel genoeg data te verzamelen voor effectieve optimalisatie, geen doel op zich maar de motor onder de datagedreven groei.',
  planning: [
    { title: 'Onboarding', desc: 'U levert foto\'s en teksten aan via ons portaal. Wij regelen de rest.' },
    { title: 'V1 bouwen', desc: 'Premium website met dienstenmenu, projecten en vacatures binnen 5 werkdagen.' },
    { title: 'Feedback', desc: 'Wij nemen V1 samen door en verwerken uw aanpassingen.' },
    { title: 'Livegang & V2', desc: 'Live met SEO, Ads en dashboard. Daarna bouwen wij de 3D-configurator uit.' },
  ],

  seo: {
    voorbeelden: ['Tuinaanleg Middelburg', 'Watermanagement vijver Goes', 'Houtbouw schutting Bergen op Zoom', 'Tuinontwerp Breda'],
  },

  // ── Backend & CRM (referentie: simpul.nl — urenregistratie, personeelsbeheer, offertes) ──
  backend: {
    kop: 'Eén systeem voor leads, uren, personeel en offertes.',
    body: 'Naar voorbeeld van de software die u aanleverde (simpul.nl) bouwen wij een backend die verder gaat dan een leadlijst. Alles komt samen in één dashboard: aanvragen met status, urenregistratie op project, personeelsbeheer en geautomatiseerde offertes met een getrapt prijsmodel dat serieuze leads filtert.',
    features: [
      'Leaddashboard: elke aanvraag van bron tot getekende opdracht',
      'Getrapt prijsmodel (Premium, Standaard, Budget) dat leads filtert',
      'Urenregistratie per project en per medewerker',
      'Personeelsbeheer en planning van teams en voormannen',
      'Geautomatiseerde offertes op basis van het ontwerp',
      'Reviewbeheer: tevreden klanten automatisch om een review vragen',
    ],
    integraties: [
      { naam: 'Simpul', url: 'https://simpul.nl', desc: 'Referentie voor urenregistratie, personeelsbeheer en offertes' },
      { naam: 'Trendhout 3D-configurator', url: 'https://trendhoutapp.nl', desc: 'Inspiratie voor de 3D-tuinconfigurator (V2)' },
      { naam: 'Kadaster', url: 'https://www.kadaster.nl', desc: 'Kavelimport via postcode voor nauwkeurige afmetingen' },
      { naam: 'Google Bedrijfsprofiel', url: 'https://business.google.com', desc: 'Reviews en lokale vindbaarheid gekoppeld aan het dashboard' },
    ],
  },

  // ── Prijsmodel (vaste MHS-tarieven) ──
  pricing: {
    website: 2250,
    fotografie: { key: 'fotografie', label: 'Professionele fotografie', sub: 'Fotoshoot on-location voor authentieke tuinbeelden', prijs: 1500 },
    inbegrepen: [
      { key: 'onderhoud', label: 'Hosting & onderhoud', sub: 'Snelle, veilige hosting plus doorlopende updates, beheer & dashboard', prijs: 65 },
      { key: 'gmb', label: 'Google Bedrijfsprofiel (GMB)', sub: 'Beheer, optimalisatie & reviewstrategie', prijs: 95 },
    ],
    optioneel: [
      { key: 'seo', label: 'SEO — dienst- & locatiepagina\'s', sub: 'Doorlopend nieuwe subdienst- en locatiepagina\'s (dienst × plaats)', prijs: 235 },
      { key: 'sea', label: 'Google Ads-beheer (SEA)', sub: '€ 500 basistarief plus 10% van het advertentiebudget', prijs: 620 },
    ],
    extern: { label: 'Google Ads budget (extern · rechtstreeks aan Google)', sub: 'Minimum voor effectieve dataverzameling & optimalisatie', prijs: 1200, prefix: 'v.a. ' },
    adspend: 1200,
  },
};

export default function EssenzaTuinenVoorstel() {
  return <VoorstelTemplate data={data} />;
}
