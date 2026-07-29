// MHS Media portfolio — echte voorbeelden van foto- & videowerk, getoond in het
// voorstel (pop-up) bij Fotografie en Videografie. Globaal (zelfde voor elk voorstel).

export const PORTFOLIO_FOTO = [
  {
    project: 'Eksteen',
    sector: 'Bouw & gevelwerk',
    fotos: ['/portfolio/eksteen-1.jpg', '/portfolio/eksteen-2.jpg', '/portfolio/eksteen-3.jpg', '/portfolio/eksteen-4.jpg', '/portfolio/eksteen-5.jpg', '/portfolio/eksteen-6.jpg'],
  },
  {
    project: 'De Duiksehoef',
    sector: 'Recreatie & vastgoed',
    fotos: ['/portfolio/duiksehoef-1.jpg', '/portfolio/duiksehoef-2.jpg', '/portfolio/duiksehoef-3.jpg', '/portfolio/duiksehoef-4.jpg', '/portfolio/duiksehoef-5.jpg', '/portfolio/duiksehoef-6.jpg'],
  },
  {
    project: 'Bedrijfsarts Totaal',
    sector: 'Zakelijk & corporate',
    fotos: ['/portfolio/bedrijfsarts-1.jpg', '/portfolio/bedrijfsarts-2.jpg', '/portfolio/bedrijfsarts-3.jpg', '/portfolio/bedrijfsarts-4.jpg', '/portfolio/bedrijfsarts-5.jpg', '/portfolio/bedrijfsarts-6.jpg'],
  },
  {
    project: 'Slingerland',
    sector: 'Vloeren & afbouw',
    fotos: ['/portfolio/slingerland-1.jpg', '/portfolio/slingerland-2.jpg', '/portfolio/slingerland-3.jpg', '/portfolio/slingerland-4.jpg', '/portfolio/slingerland-5.jpg', '/portfolio/slingerland-6.jpg'],
  },
];

// Alle portfolio-foto's plat (voor grids/fallbacks)
export const PORTFOLIO_FOTO_FLAT = PORTFOLIO_FOTO.flatMap((p) => p.fotos);

export const PORTFOLIO_VIDEO = [
  { id: '5Foa4mWwlzs', title: 'Videoproductie' },
  { id: '9Wv5YA5uNmY', title: 'Videoproductie' },
  { id: 'V08RwADyWxk', title: 'Videoproductie' },
  { id: 'SHVz7CpK1P4', title: 'Videoproductie' },
  { id: '9_9j987oEuk', title: 'Videoproductie' },
];
