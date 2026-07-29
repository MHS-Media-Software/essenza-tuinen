import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users, ShieldCheck, Sparkles, MapPin, HeartHandshake } from 'lucide-react';
import { BRAND, Layout, PageHeader, USPBar, Reviews, CTABand, fade } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, INK, MUTED, LINE, FONT_H, FONT_B, MINT, img } = BRAND;

const WAARDEN = [
  { icon: HeartHandshake, title: 'Volledig ontzorgd', desc: 'Van eerste schets tot en met de nazorg regelen wij alles. Eén vast aanspreekpunt, geen los-zand van verschillende partijen.' },
  { icon: Users, title: 'Vast, eigen team', desc: 'Bekende gezichten die uw tuin door en door kennen. Wij werken niet met wisselende onderaannemers.' },
  { icon: ShieldCheck, title: 'Heldere afspraken', desc: 'Een transparante offerte en een strakke planning. U weet vooraf waar u aan toe bent, zonder verrassingen achteraf.' },
  { icon: Sparkles, title: 'Maatwerk van hoog niveau', desc: 'Geen standaardoplossingen, maar een tuin die volledig bij u past. Kwaliteit en detail staan altijd voorop.' },
  { icon: Leaf, title: 'Groen hart', desc: 'Passie voor planten, natuur en vakmanschap. Wij kiezen de juiste beplanting op de juiste plek, voor een tuin die meegroeit.' },
  { icon: MapPin, title: 'Lokaal verankerd', desc: 'Wij kennen de grond, het klimaat en de streek van Zeeland en West-Brabant als geen ander.' },
];

export default function EssenzaTuinenOverOns() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Over ons"
        title="Uw vaste hovenier met een groen hart"
        intro="Essenza Tuinen ontwerpt, bouwt en onderhoudt bijzondere tuinen in Zeeland en West-Brabant. Wij geloven in vakmanschap, persoonlijk contact en volledig ontzorgen, van A tot Z."
        img={img.about}
      />

      {/* Verhaal */}
      <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <motion.div {...fade}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Ons verhaal</p>
            <h2 className="font-semibold mb-6" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>
              Alles voor de tuin, onder één dak
            </h2>
            {[
              'Essenza Tuinen is ontstaan uit een simpele overtuiging: een mooie tuin verdient één vakkundig team dat het hele traject verzorgt. Van het eerste ontwerp tot de laatste snoeibeurt.',
              'Daarom brengen wij zes vakgebieden samen onder één dak: tuinontwerp, houtbouw, watermanagement, tuinaanleg, tuinonderhoud en boomverzorging. U hoeft niet te schakelen tussen verschillende partijen, wij ontzorgen u volledig.',
              'Wij werken graag voor opdrachtgevers die kwaliteit en gemak vooropstellen. Geen halve oplossingen, maar maatwerk van hoog niveau, met oog voor detail en respect voor uw wensen, budget en planning.',
            ].map((t, i) => (<p key={i} className="text-base leading-relaxed mb-4" style={{ color: MUTED }}>{t}</p>))}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ height: 500 }}>
              <img src={img.about} alt="Essenza Tuinen aan het werk" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-5 px-6 py-4 rounded-2xl shadow-xl text-white" style={{ background: NAVY }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MINT }}>Werkgebied</p>
              <p className="text-sm font-bold" style={{ fontFamily: FONT_H }}>Zeeland &amp; West-Brabant</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cijfers */}
      <section className="pb-4" style={{ background: WHITE }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[['A–Z', 'Volledig ontzorgd'], ['6', 'Vakgebieden onder één dak'], ['1', 'Vast aanspreekpunt'], ['9,8', 'Klantwaardering']].map(([v, l], i) => (
              <motion.div key={l} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="p-7 rounded-2xl text-center" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <p className="font-bold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '2rem' }}>{v}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Waarden */}
      <section className="py-16 md:py-20" style={{ background: WHITE, fontFamily: FONT_B }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div {...fade} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: BLUE }}>Waar wij voor staan</p>
            <h2 className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY, fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)', letterSpacing: '-0.025em' }}>Onze belofte aan u</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WAARDEN.map((w, i) => {
              const Icon = w.icon;
              return (
                <motion.div key={w.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
                  className="p-8 rounded-3xl h-full" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 40px rgba(31,33,19,0.05)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: SOFT }}>
                    <Icon className="w-5 h-5" style={{ color: BLUE }} />
                  </div>
                  <h3 className="font-bold mb-2.5" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.15rem' }}>{w.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{w.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <USPBar />
      <Reviews />
      <CTABand title="Benieuwd wat wij voor uw tuin kunnen betekenen?" />
    </Layout>
  );
}
