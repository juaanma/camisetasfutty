/* Cartel de aeropuerto (split-flap): cada letra gira hasta caer en la nueva */
import { useEffect, useRef, useState } from 'react';

const CH = ' ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789$./-';

// Mayúsculas, sin tildes (menos la Ñ) y centrado en la cantidad de casilleros
function casilleros(texto, n) {
  let t = String(texto || '').toUpperCase().replace(/Ñ/g, '\u0001')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ')
    .replace(/·/g, '-').replace(/[^A-ZÑ0-9$./\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  // Si no entra, se corta en una palabra entera (no a la mitad)
  if (t.length > n) {
    const corte = t.slice(0, n + 1).lastIndexOf(' ');
    t = (corte > n / 2 ? t.slice(0, corte) : t.slice(0, n)).replace(/[\s\-/.]+$/, '');
  }
  const izq = Math.floor((n - t.length) / 2);
  return (' '.repeat(izq) + t).padEnd(n, ' ').split('');
}

function useColumnas() {
  const calc = () => (window.innerWidth < 600 ? 13 : 16);
  const [c, setC] = useState(calc);
  useEffect(() => {
    const f = () => setC(calc());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return c;
}

export default function Tablero({ lineas }) {
  const cols = useColumnas();
  return (
    <div className="tablero" style={{ '--cols': cols }} aria-live="polite" aria-label={lineas.join(' · ')}>
      {lineas.map((l, f) => (
        <div key={f} className={'fila f' + f} aria-hidden="true">
          {casilleros(l, cols).map((c, i) => <Letra key={i} c={c} i={i + f * 3} />)}
        </div>
      ))}
    </div>
  );
}

function Letra({ c, i }) {
  const [v, setV] = useState(c);
  const [k, setK] = useState(0);
  const actual = useRef(c);
  useEffect(() => {
    if (c === actual.current) return;
    let n = 0, t;
    const pasos = 3 + ((i * 7) % 5);
    const tick = () => {
      n++;
      const sig = n >= pasos ? c : CH[1 + Math.floor(Math.random() * (CH.length - 1))];
      actual.current = sig;
      setV(sig);
      setK((x) => x + 1);
      if (n < pasos) t = setTimeout(tick, 60);
    };
    t = setTimeout(tick, i * 22);
    return () => clearTimeout(t);
  }, [c, i]);
  return <span className="flap"><span key={k} className="flap-c">{v === ' ' ? ' ' : v}</span></span>;
}
