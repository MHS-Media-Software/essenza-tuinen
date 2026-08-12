// Zwevende knop linksboven waarmee ingelogde medewerkers direct naar het
// beheer springen. Bezoekers zien hem niet: bij het inloggen wordt naast de
// (HttpOnly) sessiecookie een leesbare hint-cookie gezet, en die is hier het
// enige signaal. Zo hoeft de site voor gewone bezoekers niets aan de server te
// vragen. Alleen wie al ingelogd was vóórdat die cookie bestond, wordt één keer
// per tabblad alsnog nagevraagd.
import { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

const HINT = 'et_beheer';

const heeftHint = () =>
  typeof document !== 'undefined' && document.cookie.split('; ').includes(`${HINT}=1`);

const onthoud = (waarde) => { try { sessionStorage.setItem(HINT, waarde); } catch { /* privémodus */ } };
const onthouden = () => { try { return sessionStorage.getItem(HINT); } catch { return null; } };

export default function BeheerKnop() {
  const [zichtbaar, setZichtbaar] = useState(heeftHint);

  useEffect(() => {
    if (zichtbaar || onthouden() === 'nee') return;
    let gestopt = false;
    fetch('/api/session?kort=1', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => {
        if (gestopt) return;
        if (d && d.authed) setZichtbaar(true); else onthoud('nee');
      })
      .catch(() => {});
    return () => { gestopt = true; };
  }, [zichtbaar]);

  if (!zichtbaar) return null;

  return (
    <a
      href="/admin"
      title="Naar je beheeromgeving"
      className="fixed left-4 z-[60] flex items-center gap-2 h-10 pl-3 pr-4 rounded-full text-white text-[13px] font-bold shadow-xl transition-transform hover:scale-105"
      style={{
        top: 88,
        background: 'rgba(31,33,19,0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(143,217,168,0.35)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <LayoutDashboard className="w-4 h-4" style={{ color: '#8FD9A8' }} />
      Beheer
    </a>
  );
}
