import React from 'react';
import { Layout, PageHeader, ContactBlok, BRAND } from './EssenzaTuinen';

const { img } = BRAND;

export default function EssenzaTuinenContact() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Contact"
        title="Vraag uw offerte aan"
        intro="Wilt u uw tuin laten ontwerpen, aanleggen of onderhouden? Neem contact op. Wij komen graag bij u langs voor een persoonlijk advies en een heldere offerte op maat, in heel Zeeland en West-Brabant."
        img={img.pr1}
      />
      <ContactBlok />
    </Layout>
  );
}
