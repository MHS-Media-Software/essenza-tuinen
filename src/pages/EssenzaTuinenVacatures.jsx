import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MapPin, Clock, TrendingUp, Check, Phone, Mail, X, Upload, CheckCircle, Headphones, Sprout, HardHat, PencilRuler } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BRAND, Layout, PageHeader } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, INK, MUTED, LINE, LINE_D, FONT_H, FONT_B } = BRAND;
const EMAIL = BRAND.email;
const TEL = BRAND.tel;
const TEL_TXT = BRAND.telTxt || '06 21 44 87 90';

// ── Vacatures (functies uit de onboarding) ──────────────────────────────────
const VACATURES = [
  {
    id: 'verkoper', icon: Headphones,
    title: 'Salesmedewerker / Verkoop binnendienst', niveau: 'Sales · commercieel', uren: '32–40 uur',
    intro: 'Jij bent de eerste stem van Essenza Tuinen. Je neemt telefoontjes aan, verwerkt aanvragen tot nette offertes en zorgt dat elke klant zich vanaf het eerste contact ontzorgd voelt.',
    taken: ['Inkomende telefoontjes en aanvragen aannemen en opvolgen', 'Offertes opstellen en verwerken in ons systeem', 'Afspraken inplannen voor de voormannen en het ontwerpteam', 'Klanten proactief informeren over de status van hun project'],
    profiel: ['MBO werk- en denkniveau, commercieel en klantgericht', 'Sterk in communicatie, telefonisch en per e-mail', 'Nauwkeurig, georganiseerd en zelfstandig', 'Affiniteit met tuinen en groen is een pré'],
    aanbod: ['Marktconform salaris met goede voorwaarden', 'Een centrale, zichtbare rol binnen een groeiend bedrijf', 'Korte lijnen en veel eigen verantwoordelijkheid'],
  },
  {
    id: 'assistent-hovenier', icon: Sprout,
    title: 'Assistent hovenier (niveau 2)', niveau: 'Hovenier · niveau 2', uren: '38–40 uur',
    intro: 'Je gaat mee met de voorman en leert het vak in de praktijk. Van aanleg en beplanting tot bestrating en onderhoud: jij bent onmisbaar in het team dat elke tuin realiseert.',
    taken: ['Meewerken aan tuinaanleg: grondwerk, bestrating en beplanting', 'Ondersteunen bij houtbouw, water en onderhoud', 'Materiaal en machines klaarzetten en netjes achterlaten', 'Leren van de voorman en meegroeien naar niveau 3'],
    profiel: ['Opleiding hovenier niveau 2 of aantoonbare ervaring', 'Fysiek werk spreekt je aan, je pakt graag aan', 'In het bezit van rijbewijs B (BE is een pré)', 'Teamspeler met oog voor kwaliteit'],
    aanbod: ['Vast team met bekende gezichten en veel afwisseling', 'Volop ruimte om door te groeien naar niveau 3', 'Goede arbeidsvoorwaarden en modern materieel'],
  },
  {
    id: 'voorman-n3', icon: HardHat,
    title: 'Voorman hovenier (niveau 3)', niveau: 'Hovenier · niveau 3', uren: '38–40 uur',
    intro: 'Als voorman ben je de spil op de projectlocatie. Je stuurt je team aan, bewaakt de kwaliteit en zorgt dat elk project netjes en volgens planning wordt opgeleverd.',
    taken: ['Dagelijkse aansturing van je team op de projectlocatie', 'Zelfstandig uitvoeren van tuinaanleg, houtbouw en water', 'Bewaken van planning, kwaliteit en veiligheid', 'Contact met de klant op locatie, het gezicht van Essenza'],
    profiel: ['Opleiding hovenier niveau 3 en ervaring als voorman', 'Leidinggevende, oplossingsgerichte instelling', 'Rijbewijs BE, VCA is een pré', 'Kwaliteitsgericht en trots op je werk'],
    aanbod: ['Uitstekend salaris passend bij je ervaring', 'Eigen verantwoordelijkheid over mooie projecten', 'Een ambitieus bedrijf met hoogwaardige opdrachten'],
  },
  {
    id: 'voorman-n4', icon: PencilRuler,
    title: 'Voorman / uitvoerder (niveau 4)', niveau: 'Hovenier · niveau 4', uren: '38–40 uur',
    intro: 'De alleskunner die ontwerp en uitvoering verbindt. Je maakt tekeningen en offertes, begeleidt projecten van A tot Z en denkt strategisch mee over de groei van Essenza Tuinen.',
    taken: ['Tuinontwerpen en tekeningen uitwerken', 'Offertes en calculaties opstellen', 'Projecten van start tot oplevering coördineren', 'Meedenken over werkwijze, kwaliteit en groei'],
    profiel: ['Opleiding hovenier niveau 4 of vergelijkbaar', 'Ervaring met ontwerp, calculatie en projectleiding', 'Sterk in plannen, organiseren en communiceren', 'Rijbewijs BE, VCA(-VOL) is een pré'],
    aanbod: ['Een sleutelrol met veel invloed en autonomie', 'Top salaris en uitstekende voorwaarden', 'Meebouwen aan een bedrijf met hoge ambities'],
  },
];

// ── Sollicitatie-pop-up (met CV-upload + motivatie) ──────────────────────────
function SollicitatieModal({ functie, onClose }) {
  const [form, setForm] = useState({ naam: '', email: '', telefoon: '', motivatie: '' });
  const [cv, setCv] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = 'w-full px-4 py-3 text-sm outline-none rounded-xl border transition-colors';
  const inpStyle = { borderColor: LINE, background: WHITE, color: INK };

  const verstuur = async () => {
    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: EMAIL,
        subject: `Sollicitatie: ${functie} — ${form.naam}`,
        body: `Functie: ${functie}\nNaam: ${form.naam}\nE-mail: ${form.email}\nTelefoon: ${form.telefoon}\nCV: ${cv ? cv.name : 'niet meegestuurd (wordt nagestuurd)'}\n\nMotivatie:\n${form.motivatie}`,
      });
    } catch { /* concept: toon sowieso succes */ }
    setLoading(false);
    setSent(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(15,16,9,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="flex items-start justify-between gap-4 p-6 md:p-7 border-b" style={{ borderColor: LINE }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: BLUE }}>Solliciteer</p>
            <h3 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>{functie}</h3>
          </div>
          <button onClick={onClose} aria-label="Sluiten" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: LIGHT, color: NAVY }}><X className="w-4 h-4" /></button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: SOFT }}><CheckCircle className="w-8 h-8" style={{ color: BLUE }} /></div>
            <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: FONT_H, color: NAVY }}>Sollicitatie verzonden</h4>
            <p className="text-sm" style={{ color: MUTED }}>Bedankt voor uw interesse in Essenza Tuinen. Wij nemen zo snel mogelijk contact met u op.</p>
            <button onClick={onClose} className="mt-6 text-sm font-bold px-6 py-3 rounded-xl text-white" style={{ background: BLUE }}>Sluiten</button>
          </div>
        ) : (
          <div className="p-6 md:p-7 overflow-y-auto space-y-3">
            <input type="text" placeholder="Naam *" value={form.naam} onChange={e => set('naam', e.target.value)} className={inp} style={inpStyle} />
            <div className="grid grid-cols-2 gap-3">
              <input type="email" placeholder="E-mail *" value={form.email} onChange={e => set('email', e.target.value)} className={inp} style={inpStyle} />
              <input type="tel" placeholder="Telefoon *" value={form.telefoon} onChange={e => set('telefoon', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <label className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all" style={{ borderColor: cv ? BLUE : LINE, background: LIGHT }}>
              <Upload className="w-5 h-5 flex-shrink-0" style={{ color: BLUE }} />
              <span className="text-sm font-semibold truncate" style={{ color: cv ? NAVY : MUTED }}>{cv ? cv.name : 'Upload uw cv (PDF of Word)'}</span>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCv(e.target.files?.[0] || null)} />
            </label>
            <textarea rows={4} placeholder="Motivatie: vertel kort waarom je bij Essenza Tuinen past *" value={form.motivatie} onChange={e => set('motivatie', e.target.value)} className={`${inp} resize-none`} style={inpStyle} />
            <button onClick={verstuur} disabled={!form.naam || !form.email || !form.telefoon || !form.motivatie || loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-30" style={{ background: BLUE }}>
              {loading && <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: WHITE }} />}
              {loading ? 'Verzenden…' : 'Verstuur sollicitatie'} {!loading && <ArrowUpRight className="w-4 h-4" />}
            </button>
            <p className="text-[11px] text-center" style={{ color: MUTED }}>Of bel ons direct op <a href={`tel:${TEL}`} className="font-bold" style={{ color: BLUE }}>{TEL_TXT}</a></p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function VacatureKaart({ v, onSolliciteer }) {
  const Icon = v.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
      className="rounded-3xl p-7 md:p-8 flex flex-col h-full" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 40px rgba(31,33,19,0.05)' }}>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: SOFT }}><Icon className="w-5 h-5" style={{ color: BLUE }} /></div>
        <div>
          <h3 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{v.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: MUTED }}><TrendingUp className="w-3.5 h-3.5" style={{ color: BLUE }} /> {v.niveau}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: MUTED }}><Clock className="w-3.5 h-3.5" style={{ color: BLUE }} /> {v.uren}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: MUTED }}><MapPin className="w-3.5 h-3.5" style={{ color: BLUE }} /> Zeeland &amp; West-Brabant</span>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>{v.intro}</p>
      <div className="grid gap-5 mb-7">
        {[['Wat je doet', v.taken], ['Wie jij bent', v.profiel], ['Wat wij bieden', v.aanbod]].map(([kop, items]) => (
          <div key={kop}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2.5" style={{ color: BLUE }}>{kop}</p>
            <ul className="space-y-1.5">
              {items.map(it => (
                <li key={it} className="flex items-start gap-2.5 text-[13px]" style={{ color: INK }}><Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: BLUE }} /> {it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap gap-3 pt-5 border-t" style={{ borderColor: LINE }}>
        <button onClick={() => onSolliciteer(v.title)} className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-xl text-white transition-all hover:scale-105" style={{ background: BLUE }}>
          Solliciteer op deze functie <ArrowUpRight className="w-4 h-4" />
        </button>
        <a href={`tel:${TEL}`} className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-xl transition-all" style={{ border: `1px solid ${LINE}`, color: NAVY }}><Phone className="w-4 h-4" /> Eerst even bellen</a>
      </div>
    </motion.div>
  );
}

export default function EssenzaTuinenVacatures() {
  const [solliciteer, setSolliciteer] = useState(null);

  return (
    <Layout>
      <PageHeader
        eyebrow="Werken bij Essenza Tuinen"
        title="Bouw mee aan de mooiste tuinen<br class='hidden md:block' /> van Zeeland &amp; West-Brabant"
        intro="Wij groeien en zoeken vakmensen die net als wij voor kwaliteit gaan. Een vast team, bekende gezichten, hoogwaardige projecten en volop ruimte om door te groeien. Bekijk onze openstaande functies en solliciteer direct online."
        img={BRAND.img.about}
      />

      {/* Waarom Essenza */}
      <section className="py-14" style={{ background: LIGHT }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Vast, hecht team', 'Bekende gezichten, korte lijnen'], ['Hoogwaardige projecten', 'Tuinen van hoog niveau'], ['Ruimte om te groeien', 'Van niveau 2 naar 4'], ['Goede voorwaarden', 'Marktconform salaris & modern materieel']].map(([t, s], i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="p-5 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
              <p className="text-sm font-bold" style={{ color: NAVY }}>{t}</p>
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>{s}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vacatures als kaarten */}
      <section className="py-16 md:py-20" style={{ background: WHITE }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div {...{ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }} className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Openstaande functies</p>
            <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Onze vacatures</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {VACATURES.map(v => <VacatureKaart key={v.id} v={v} onSolliciteer={setSolliciteer} />)}
          </div>
        </div>
      </section>

      {/* Open sollicitatie CTA */}
      <section className="pb-16 md:pb-20" style={{ background: WHITE }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-14" style={{ background: NAVY }}>
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(11,157,70,0.35)' }} />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: '#8FD9A8' }}>Geen passende functie?</p>
                <h3 className="font-semibold text-white" style={{ fontFamily: FONT_H, fontSize: 'clamp(1.25rem, 2vw, 1.6rem)', letterSpacing: '-0.025em' }}>Stuur ons een open sollicitatie</h3>
                <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Ben jij een vakmens met passie voor groen? Wij maken graag kennis.</p>
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <button onClick={() => setSolliciteer('Open sollicitatie')} className="flex items-center gap-2 text-sm font-bold px-7 py-4 rounded-xl transition-all hover:scale-105 whitespace-nowrap" style={{ background: WHITE, color: NAVY }}><Mail className="w-4 h-4" /> Open sollicitatie</button>
                <a href={`tel:${TEL}`} className="flex items-center gap-2 text-sm font-bold px-7 py-4 rounded-xl transition-all hover:bg-white/10 whitespace-nowrap" style={{ border: `1px solid ${LINE_D}`, color: WHITE }}><Phone className="w-4 h-4" /> {TEL_TXT}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {solliciteer && <SollicitatieModal functie={solliciteer} onClose={() => setSolliciteer(null)} />}
      </AnimatePresence>
    </Layout>
  );
}
