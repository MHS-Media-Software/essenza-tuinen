import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { BRAND, DIENSTEN, PROJECTEN, Layout, PageHeader, CTABand } from './EssenzaTuinen';

const { NAVY, BLUE, SOFT, LIGHT, WHITE, INK, MUTED, LINE, LINE_D, FONT_H, FONT_B } = BRAND;

// Filtercategorieën = de zes hoofddiensten + "Alle".
const CATS = ['Alle', ...DIENSTEN.map(d => d.title)];

export default function EssenzaTuinenProjecten() {
  const [cat, setCat] = useState('Alle');
  const [lightbox, setLightbox] = useState(null);
  const zichtbaar = cat === 'Alle' ? PROJECTEN : PROJECTEN.filter(p => p.type === cat);

  return (
    <Layout>
      <PageHeader
        eyebrow="Ons werk"
        title="Projecten in Zeeland &amp; West-Brabant"
        intro="Een selectie van tuinen die wij ontwierpen, bouwden en verzorgden. Filter op vakgebied en ontdek wat wij voor uw tuin kunnen betekenen, van tuinontwerp en houtbouw tot water, aanleg, onderhoud en boomverzorging."
        img={BRAND.img.pr1}
      />

      {/* ── Filter + grid ── */}
      <section className="py-16 md:py-24" style={{ background: WHITE }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Filterknoppen */}
          <div className="flex flex-wrap gap-2.5 mb-10">
            {CATS.map(c => {
              const on = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)}
                  className="text-sm font-bold px-5 py-2.5 rounded-full transition-all"
                  style={on
                    ? { background: BLUE, color: WHITE, border: `1px solid ${BLUE}` }
                    : { background: WHITE, color: MUTED, border: `1px solid ${LINE}` }}>
                  {c}
                </button>
              );
            })}
          </div>

          {/* Masonry-achtig grid */}
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {zichtbaar.map((p, i) => (
                <motion.button key={p.label} layout
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: (i % 3) * 0.04 }}
                  onClick={() => setLightbox(p)}
                  className="relative overflow-hidden group cursor-pointer rounded-3xl text-left" style={{ height: 360 }}>
                  <img src={p.img} alt={p.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(31,33,19,0.9) 0%, rgba(31,33,19,0.1) 55%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-1 rounded-full" style={{ background: 'rgba(11,157,70,0.9)', color: WHITE }}>{p.type}</span>
                    <p className="text-white font-bold" style={{ fontFamily: FONT_H, fontSize: '1.05rem' }}>{p.label}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

          {zichtbaar.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: MUTED }}>Binnenkort meer projecten in deze categorie.</p>
          )}
        </div>
      </section>

      <CTABand title="Uw tuin het volgende project?" />

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10" style={{ background: 'rgba(15,16,9,0.88)' }}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="relative max-w-4xl w-full">
              <img src={lightbox.img} alt={lightbox.label} className="w-full rounded-2xl shadow-2xl" />
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: BLUE, color: WHITE }}>{lightbox.type}</span>
                <p className="text-white font-bold" style={{ fontFamily: FONT_H }}>{lightbox.label}</p>
              </div>
              <button onClick={() => setLightbox(null)} aria-label="Sluiten"
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: WHITE, color: NAVY }}>
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
