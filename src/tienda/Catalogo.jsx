/* Catálogo: secciones con sus camisetas */
import { AnimatePresence, motion } from 'framer-motion';
import { enStock, norm, plural, talles } from '../lib/util.js';
import { IcoWa } from '../lib/iconos.jsx';
import { MSG_MEDIDA, useTienda } from './contexto.js';
import Tarjeta from './Tarjeta.jsx';

export default function Catalogo() {
  const { cfg, items, listada, filtro, setFiltro, wa } = useTienda();
  const { q, size, sec } = filtro;
  const filtrando = q || size || sec !== 'all';

  const coincide = (it) => {
    if (sec !== 'all' && it.section !== sec) return false;
    if (size && !talles(it).includes(size)) return false;
    if (q) {
      const hay = norm([it.name, it.sub, it.code, it.section].join(' '));
      return norm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
    }
    return true;
  };

  const grupos = (sec === 'all' ? cfg.sections : [sec]).map((s) => {
    const its = items.filter((i) => i.section === s && listada(i) && coincide(i));
    return [s, its.filter(enStock).concat(its.filter((i) => !enStock(i)))]; // las sin stock, al final
  }).filter((g) => g[1].length);
  const visibles = grupos.flatMap((g) => g[1].map((i) => i.id));
  const limpiar = () => setFiltro({ q: '', size: '', sec: 'all' });

  return (
    <main className="wrap" id="catalog" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {filtrando && visibles.length > 0 && (
          <motion.p key="res" className="result" layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {plural(visibles.length, 'camiseta', 'camisetas')}{size ? ' en talle ' + size : ''}{q ? ' para «' + q + '»' : ''} · <button onClick={limpiar}>Ver todas</button>
          </motion.p>
        )}
        {!visibles.length && (
          <motion.div key="vacio" className="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.span className="vacio-ico" aria-hidden="true" animate={{ rotate: [0, -12, 12, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}>👕</motion.span>
            <b>No encontramos esa camiseta en stock</b>Probá con otro talle o búsqueda. Si no la tenemos, te la conseguimos a medida.<br />
            <button className="btn btn-line" onClick={limpiar}>Ver todas</button>{' '}
            <a className="btn btn-wa" target="_blank" rel="noopener" href={wa(MSG_MEDIDA)}><IcoWa />Pedila a medida</a>
          </motion.div>
        )}
        {grupos.map(([s, its]) => (
          <motion.section key={s} className="sec" layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sec-h">
              <motion.h2 initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>{s}</motion.h2>
              <span className="cnt">{plural(its.length, 'modelo', 'modelos')}</span>
              <motion.span className="sec-linea" aria-hidden="true" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }} />
            </div>
            <div className="grid">
              <AnimatePresence mode="popLayout">
                {its.map((it, n) => <Tarjeta key={it.id} it={it} n={n} lista={visibles} />)}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
    </main>
  );
}
