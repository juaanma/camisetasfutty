/* Buscador y filtros (secciones y talles) */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TALLES, enStock, talles } from '../lib/util.js';
import { IcoBuscar, IcoX } from '../lib/iconos.jsx';
import { useTienda } from './contexto.js';

const BASE = 'Buscá equipo, año o jugador';

export default function Barra() {
  const { cfg, items, listada, filtro, setFiltro } = useTienda();
  const barra = useRef();
  const [pegada, setPegada] = useState(false);

  // La barra toma sombra cuando queda pegada arriba
  useEffect(() => {
    const f = () => setPegada(window.scrollY > 0 && barra.current.getBoundingClientRect().top <= 1);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const lista = items.filter(listada);
  const secs = cfg.sections.map((s) => [s, lista.filter((i) => i.section === s).length]).filter((x) => x[1]);
  const ts = useMemo(() => {
    const hay = {};
    lista.forEach((i) => talles(i).forEach((z) => { hay[z] = 1; }));
    return TALLES.filter((t) => hay[t]);
  }, [lista]);

  const irAlCatalogo = () => {
    const c = document.getElementById('catalog');
    if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({ block: 'start' });
  };
  const elegir = (cambio) => { setFiltro((f) => ({ ...f, ...cambio })); irAlCatalogo(); };

  return (
    <div ref={barra} className={'bar' + (pegada ? ' stuck' : '')} role="search">
      <div className="wrap">
        <Buscador nombres={items.filter(enStock).map((i) => i.name)} q={filtro.q}
          setQ={(q) => setFiltro((f) => ({ ...f, q }))} />

        <div className="chips">
          <Chip activo={filtro.sec === 'all'} grupo="sec" onClick={() => elegir({ sec: 'all' })}>Todo<small>{lista.length}</small></Chip>
          {secs.map(([s, n]) => (
            <Chip key={s} activo={filtro.sec === s} grupo="sec" onClick={() => elegir({ sec: s })}>{s}<small>{n}</small></Chip>
          ))}
          {ts.length > 1 && (
            <>
              <span className="sep" aria-hidden="true" /><span className="lbl">Talle</span>
              {ts.map((t) => (
                <Chip key={t} activo={filtro.size === t} grupo="size" onClick={() => elegir({ size: filtro.size === t ? '' : t })}>{t}</Chip>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Buscador({ nombres, q, setQ }) {
  const input = useRef();
  const placeholder = useTextoQueSeEscribe(input, nombres, q);
  return (
    <label className="search">
      <span className="sr">Buscar camiseta</span>
      <IcoBuscar />
      <input ref={input} type="search" placeholder={placeholder} autoComplete="off" value={q}
        onChange={(e) => setQ(e.target.value)} />
      <AnimatePresence>
        {q && (
          <motion.button type="button" className="q-x" aria-label="Borrar búsqueda"
            initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}
            onClick={() => { setQ(''); input.current.focus(); }}>
            <IcoX />
          </motion.button>
        )}
      </AnimatePresence>
    </label>
  );
}

/* El fondo dorado del filtro elegido se desliza de un botón al otro */
function Chip({ activo, grupo, onClick, children }) {
  return (
    <motion.button className={'chip' + (activo ? ' on' : '')} aria-pressed={activo} onClick={onClick}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.92 }}>
      {activo && <motion.span layoutId={'chip-' + grupo} className="chip-fondo" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
      {children}
    </motion.button>
  );
}

/* Ejemplos que se escriben solos en el buscador (con nombres del stock) */
function useTextoQueSeEscribe(input, nombres, valor) {
  const [txt, setTxt] = useState(BASE);
  const ej = useMemo(() => [...new Set(nombres)].slice(0, 8), [nombres.join('|')]); // eslint-disable-line
  useEffect(() => {
    if (!ej.length) return;
    let i = 0, c = 0, borrando = false;
    const t = setInterval(() => {
      if (document.activeElement === input.current || input.current?.value) { setTxt(BASE); return; }
      const w = ej[i];
      if (!borrando) { c++; if (c > w.length + 14) borrando = true; }
      else { c -= 2; if (c <= 0) { c = 0; borrando = false; i = (i + 1) % ej.length; } }
      setTxt('Buscá ' + w.slice(0, Math.min(c, w.length)));
    }, 90);
    return () => clearInterval(t);
  }, [ej, input]);
  return valor ? BASE : txt;
}
