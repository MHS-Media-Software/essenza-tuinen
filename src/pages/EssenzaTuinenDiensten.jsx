import React from 'react';
import { motion } from 'framer-motion';
import { Layout, PageHeader, DienstenGrid, USPBar, CTABand, BRAND, fade } from './EssenzaTuinen';

const { NAVY, BLUE, LIGHT, WHITE, MUTED, LINE, FONT_H, FONT_B, img } = BRAND;

export default function EssenzaTuinenDiensten() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Onze diensten"
        title="Zes vakgebieden, onder één dak"
        intro="Van het eerste ontwerp tot en met het jaarlijkse onderhoud. Kies een dienst voor meer informatie, of laat ons het complete traject verzorgen, volledig ontzorgd van A tot Z."
        img={img.d2}
      />
      <DienstenGrid heading={false} />
      <USPBar />
      <CTABand title="Weet u niet welke dienst u nodig heeft?" sub="Geen probleem. Vertel ons over uw tuin en wij adviseren u graag over de beste aanpak." />
    </Layout>
  );
}
