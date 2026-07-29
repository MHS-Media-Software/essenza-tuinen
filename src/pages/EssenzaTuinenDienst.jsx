import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Check, ClipboardList, Users, CalendarCheck, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { BRAND, Layout, PageHeader, CTABand, FaqBlok, DIENSTEN, PROJECTEN, DIENST_FAQS, dienstBySlug, BASE, fade } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, INK, MUTED, LINE, FONT_H, FONT_B, MINT } = BRAND;

const VERWACHTEN = [
  { icon: ClipboardList, t: 'Heldere offerte vooraf', d: 'Een transparante prijs op maat, zonder verrassingen achteraf.' },
  { icon: Users, t: 'Eén vast, eigen team', d: 'Bekende gezichten die uw project van begin tot eind uitvoeren.' },
  { icon: CalendarCheck, t: 'Planning die wij nakomen', d: 'Een realistische planning en afspraken waar u op kunt rekenen.' },
  { icon: Sparkles, t: 'Netjes werken', d: 'Wij laten de locatie schoon en verzorgd achter bij oplevering.' },
  { icon: MessageSquare, t: 'Persoonlijk advies', d: 'Eén aanspreekpunt dat met u meedenkt over de beste oplossing.' },
  { icon: ShieldCheck, t: 'Vakmanschap & nazorg', d: 'Kwaliteit van hoog niveau, met onderhoud en nazorg na oplevering.' },
];

export default function EssenzaTuinenDienst() {
  const { slug } = useParams();
  const d = dienstBySlug(slug);
  if (!d) return <Navigate to={`${BASE}/diensten`} replace />;
  const Icon = d.icon;
  const related = PROJECTEN.filter(p => p.type === d.title).slice(0, 3);
  const andere = DIENSTEN.filter(x => x.slug !== d.slug);
  const faqs = DIENST_FAQS[d.slug] || [];

  return (
    <Layout>
      <PageHeader eyebrow={`Dienst ${d.nr} · ${d.sub}`} title={d.title} intro={d.desc} img={d.img}>
        <Link to={`${BASE}/contact`} className="inline-flex items-center gap-2 text-sm font-bold px-7 py-4 rounded-xl text-white transition-all hover:scale-105" style={{ background: BLUE }}>
          Offerte aanvragen <ArrowUpRight className="w-4 h-4" />
        </Link>
      </PageHeader>

      {/* Intro + subdiensten */}
      <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          <motion.div {...fade}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: SOFT }}>
              <Icon className="w-6 h-6" style={{ color: BLUE }} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Wat wij voor u doen</p>
            <h2 className="font-semibold mb-6" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.3rem, 2vw, 1.7rem)', letterSpacing: '-0.025em' }}>{d.title} door Essenza Tuinen</h2>
            {d.long.map((t, i) => (<p key={i} className="text-[15px] leading-relaxed mb-4" style={{ color: MUTED }}>{t}</p>))}
            <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
              Wij combineren {d.title.toLowerCase()} moeiteloos met onze andere vakgebieden. Zo houdt u één aanspreekpunt en één vast team, van het eerste ontwerp tot en met de nazorg. Volledig ontzorgd van A tot Z, in heel Zeeland en West-Brabant.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="rounded-3xl overflow-hidden shadow-xl mb-6" style={{ height: 320 }}>
              <img src={d.img} alt={d.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-7 rounded-3xl" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: BLUE }}>Onze {d.title.toLowerCase()} omvat</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {d.subs.map(s => (
                  <div key={s} className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: INK }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                      <Check className="w-3.5 h-3.5" style={{ color: BLUE }} />
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Wat u mag verwachten */}
      <section className="py-16 md:py-20" style={{ background: LIGHT, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div {...fade} className="mb-10 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Onze werkwijze</p>
            <h2 className="font-semibold mb-3" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.3rem, 2vw, 1.7rem)', letterSpacing: '-0.025em' }}>Wat u van ons mag verwachten</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>Bij {d.title.toLowerCase()} werkt u met een vast team dat afspraken nakomt en kwaliteit levert. Van de eerste schouw tot de nette oplevering.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VERWACHTEN.map((w, i) => {
              const WIcon = w.icon;
              return (
                <motion.div key={w.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.07 }}
                  className="p-6 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: SOFT }}>
                    <WIcon className="w-4 h-4" style={{ color: BLUE }} />
                  </div>
                  <p className="font-bold text-sm mb-1.5" style={{ color: NAVY, fontFamily: FONT_H }}>{w.t}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{w.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gerelateerde projecten */}
      {related.length > 0 && (
        <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <motion.div {...fade} className="flex items-end justify-between mb-8 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Voorbeelden</p>
                <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.15rem, 1.9vw, 1.5rem)', letterSpacing: '-0.025em' }}>{d.title} in de praktijk</h2>
              </div>
              <Link to={`${BASE}/projecten`} className="hidden sm:inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3" style={{ color: BLUE }}>Alle projecten <ArrowRight className="w-4 h-4" /></Link>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p, i) => (
                <motion.div key={p.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="relative overflow-hidden group rounded-3xl" style={{ height: 320 }}>
                  <img src={p.img} alt={p.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(31,33,19,0.9) 0%, rgba(31,33,19,0.1) 55%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-1 rounded-full" style={{ background: 'rgba(11,157,70,0.9)', color: WHITE }}>{p.type}</span>
                    <p className="text-white font-bold" style={{ fontFamily: FONT_H }}>{p.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Per-dienst FAQ */}
      {faqs.length > 0 && <FaqBlok items={faqs} eyebrow="Veelgestelde vragen" title={`Vragen over ${d.title.toLowerCase()}`} bg={LIGHT} />}

      {/* Andere diensten */}
      <section className="py-16" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: BLUE }}>Meer diensten</p>
          <div className="flex flex-wrap gap-3">
            {andere.map(x => {
              const XIcon = x.icon;
              return (
                <Link key={x.slug} to={`${BASE}/diensten/${x.slug}`} className="flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all hover:scale-105" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <XIcon className="w-4 h-4" style={{ color: BLUE }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: NAVY }}>{x.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <CTABand title={`Interesse in ${d.title.toLowerCase()}?`} sub="Vraag uw offerte aan. Wij komen graag bij u langs voor een persoonlijk plan op maat." />
    </Layout>
  );
}
