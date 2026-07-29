import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, MapPin, PencilRuler, Hammer, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND, Layout, PageHeader, WERKWIJZE, FaqBlok, CTABand, BASE, fade } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, INK, MUTED, LINE, FONT_H, FONT_B, MINT, img } = BRAND;

const STAP_ICONS = [MapPin, PencilRuler, Hammer, Leaf];

const BELOFTES = [
  'Eén vast aanspreekpunt van begin tot eind',
  'Een transparante offerte zonder verrassingen',
  'Een strakke planning die wij nakomen',
  'Netjes werken en de tuin schoon opleveren',
];

export default function EssenzaTuinenWerkwijze() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Hoe wij werken"
        title="Van eerste schets tot verzorgde tuin"
        intro="Een tuin aanleggen hoeft geen gedoe te zijn. Wij nemen u stap voor stap mee en ontzorgen u van A tot Z, van de kennismaking tot en met het onderhoud. Dit is onze werkwijze in vier heldere stappen."
        img={img.d1}
      />

      {/* Tijdlijn */}
      <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
          <motion.div {...fade} className="lg:sticky lg:top-28 self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Ons stappenplan</p>
            <h2 className="font-semibold mb-4" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.85rem)', letterSpacing: '-0.025em' }}>Vier stappen naar uw droomtuin</h2>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: MUTED }}>
              Omdat ontwerp én uitvoering bij ons in één hand liggen, verloopt elk project soepel en houdt u steeds één aanspreekpunt. Zo weet u altijd waar u aan toe bent.
            </p>
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ height: 260 }}>
              <img src={img.hero} alt="Verzorgde tuin door Essenza Tuinen" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* Verticale tijdlijn met verbindingslijn */}
          <div className="relative">
            <div className="absolute left-[27px] top-4 bottom-4 w-px" style={{ background: LINE }} />
            <div className="space-y-6">
              {WERKWIJZE.map((s, i) => {
                const Icon = STAP_ICONS[i] || Check;
                return (
                  <motion.div key={s.nr} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="relative flex gap-6">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: BLUE }}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 rounded-3xl p-6 md:p-7" style={{ background: i % 2 ? LIGHT : WHITE, border: `1px solid ${LINE}` }}>
                      <span className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: BLUE }}>Stap {s.nr}</span>
                      <h3 className="font-semibold mt-2 mb-2.5" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{s.title}</h3>
                      <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>{s.detail}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Belofte-blok */}
      <section className="pb-16 md:pb-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid lg:grid-cols-2 items-stretch rounded-3xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
            <div className="p-10 md:p-14" style={{ background: LIGHT }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Onze belofte</p>
              <h2 className="font-semibold mb-6" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.3rem, 2vw, 1.9rem)', letterSpacing: '-0.025em' }}>Ontzorgd van A tot Z</h2>
              <ul className="space-y-3 mb-8">
                {BELOFTES.map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm" style={{ color: INK }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                      <Check className="w-3.5 h-3.5" style={{ color: BLUE }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to={`${BASE}/contact`} className="inline-flex items-center gap-2 text-sm font-bold px-7 py-4 rounded-xl text-white transition-all hover:scale-105" style={{ background: BLUE }}>
                Vraag uw offerte aan <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="min-h-[300px]">
              <img src={img.about} alt="Essenza Tuinen aan het werk" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <FaqBlok />
      <CTABand title="Klaar om te beginnen?" sub="Plan een kennismaking. Wij komen graag bij u langs voor een persoonlijk plan op maat." />
    </Layout>
  );
}
