import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone } from 'lucide-react';
import { BRAND, Layout, PageHeader, BASE } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, MUTED, LINE, FONT_H, FONT_B } = BRAND;

const BIJGEWERKT = '30 juli 2026';

// Kleine bouwstenen voor een leesbare, consistente juridische pagina.
function H({ children }) {
  return <h2 className="font-semibold mt-10 mb-3" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>{children}</h2>;
}
function P({ children }) {
  return <p className="text-[15px] leading-relaxed mb-3" style={{ color: MUTED }}>{children}</p>;
}
function LI({ children }) {
  return <li className="text-[15px] leading-relaxed" style={{ color: MUTED }}>{children}</li>;
}

const GEGEVENS = [
  { wat: 'Contact- en offerteformulier', data: 'Naam, e-mailadres, telefoonnummer en uw bericht', doel: 'Uw aanvraag beantwoorden en een offerte op maat opstellen', grond: 'Uitvoering van (pre)contractuele afspraken' },
  { wat: '3D-tuinconfigurator', data: 'Tuinafmetingen, uw ontwerp en een eventueel geüploade foto van uw tuin', doel: 'Een prijsindicatie berekenen en een AI-impressie van uw tuin maken', grond: 'Toestemming (foto) en gerechtvaardigd belang' },
  { wat: 'Klantaccount (optioneel)', data: 'E-mailadres en een versleuteld wachtwoord', doel: 'Uw tuinontwerpen bewaren zodat u later kunt verdergaan', grond: 'Uitvoering van de overeenkomst' },
  { wat: 'Offertes en facturen', data: 'Naam, adres, e-mailadres en opdrachtgegevens', doel: 'Offertes, facturen en administratie', grond: 'Wettelijke verplichting en overeenkomst' },
];

const VERWERKERS = [
  ['Vercel', 'Hosting van de website en de beveiligde functies'],
  ['Turso', 'Database voor aanvragen, ontwerpen, offertes en facturen'],
  ['Strato', 'Verzending van e-mail (offertes en facturen)'],
  ['OpenRouter / Google', 'AI-beeldgeneratie voor de tuinimpressie (verwerkt de plattegrond en een eventuele foto)'],
  ['PDOK / Kadaster', 'Adres opzoeken op basis van postcode (alleen wanneer u dat gebruikt)'],
];

export default function EssenzaTuinenPrivacy() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Juridisch"
        title="Privacyverklaring"
        intro="Essenza Tuinen respecteert uw privacy en gaat zorgvuldig om met uw persoonsgegevens. Hieronder leest u welke gegevens wij verwerken, waarom, en welke rechten u heeft."
      />

      <section className="py-14 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-8" style={{ background: SOFT }}>
            <Shield className="w-4 h-4" style={{ color: BLUE }} />
            <span className="text-xs font-bold" style={{ color: NAVY }}>Laatst bijgewerkt: {BIJGEWERKT}</span>
          </div>

          <H>1. Wie is verantwoordelijk voor uw gegevens?</H>
          <P>{BRAND.volledig} is de verwerkingsverantwoordelijke voor de verwerking van uw persoonsgegevens zoals beschreven in deze verklaring. Wij zijn actief als hovenier in {BRAND.werkgebied}. Voor vragen over privacy bereikt u ons via de contactgegevens onderaan deze pagina.</P>

          <H>2. Welke gegevens verwerken wij en waarom?</H>
          <P>Wij verwerken alleen de gegevens die u zelf aan ons verstrekt, voor de volgende doeleinden:</P>
          <div className="space-y-3 my-5">
            {GEGEVENS.map((g) => (
              <div key={g.wat} className="p-4 rounded-2xl" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <p className="text-sm font-bold mb-1.5" style={{ color: NAVY }}>{g.wat}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}><b style={{ color: NAVY }}>Gegevens:</b> {g.data}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}><b style={{ color: NAVY }}>Doel:</b> {g.doel}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}><b style={{ color: NAVY }}>Grondslag:</b> {g.grond}</p>
              </div>
            ))}
          </div>

          <H>3. Foto's in de configurator</H>
          <P>Als u in de 3D-configurator een foto van uw tuin uploadt of maakt, gebruiken wij die uitsluitend om er een AI-impressie van uw nieuwe tuin mee te maken. De foto en de plattegrond worden daarvoor verwerkt door onze AI-dienstverlener. Wij gebruiken uw foto niet voor andere doeleinden en delen deze niet met derden voor marketing.</P>

          <H>4. Hoelang bewaren wij uw gegevens?</H>
          <P>Wij bewaren uw gegevens niet langer dan nodig. Aanvragen en ontwerpen bewaren wij zolang dat nodig is om u goed te helpen. Voor offertes, facturen en administratie geldt de wettelijke bewaartermijn van 7 jaar. Een klantaccount en de daarin bewaarde ontwerpen kunt u op elk moment laten verwijderen.</P>

          <H>5. Met wie delen wij gegevens?</H>
          <P>Wij verkopen uw gegevens nooit. Voor de werking van onze dienstverlening schakelen wij een aantal verwerkers in, met wie wij verwerkersafspraken hebben:</P>
          <ul className="list-disc pl-5 space-y-1.5 my-4">
            {VERWERKERS.map(([naam, doel]) => (
              <LI key={naam}><b style={{ color: NAVY }}>{naam}</b> — {doel}</LI>
            ))}
          </ul>
          <P>Daarnaast delen wij gegevens alleen wanneer wij daartoe wettelijk verplicht zijn.</P>

          <H>6. Cookies</H>
          <P>Onze website gebruikt alleen functionele cookies die nodig zijn om te functioneren, zoals een sessiecookie wanneer u inlogt op een account. Wij gebruiken geen tracking- of marketingcookies en volgen u niet over andere websites.</P>

          <H>7. Beveiliging</H>
          <P>Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen. De website werkt volledig via een beveiligde verbinding (HTTPS) en wachtwoorden worden uitsluitend versleuteld opgeslagen.</P>

          <H>8. Uw rechten</H>
          <P>U heeft het recht op inzage, correctie en verwijdering van uw persoonsgegevens. Ook kunt u bezwaar maken tegen de verwerking, uw toestemming intrekken of vragen om overdracht van uw gegevens. Stuur daarvoor een bericht naar onderstaand e-mailadres; wij reageren binnen de wettelijke termijn. Bent u het niet eens met hoe wij met uw gegevens omgaan, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).</P>

          <H>9. Wijzigingen</H>
          <P>Wij kunnen deze privacyverklaring van tijd tot tijd aanpassen. De meest actuele versie vindt u altijd op deze pagina, met de datum van de laatste wijziging bovenaan.</P>

          <div className="mt-10 p-6 rounded-3xl" style={{ background: NAVY }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: BRAND.MINT }}>Contact over privacy</p>
            <p className="font-bold text-white mb-4" style={{ fontFamily: FONT_H, fontSize: '1.1rem' }}>{BRAND.volledig}</p>
            <div className="flex flex-col gap-2.5">
              <a href={`mailto:${BRAND.email}`} className="inline-flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}><Mail className="w-4 h-4" style={{ color: BRAND.MINT }} /> {BRAND.email}</a>
              <a href={`tel:${BRAND.tel}`} className="inline-flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}><Phone className="w-4 h-4" style={{ color: BRAND.MINT }} /> {BRAND.telTxt}</a>
            </div>
            <Link to={`${BASE}/contact`} className="inline-flex items-center gap-2 mt-5 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105" style={{ background: BLUE }}>Naar contact →</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
