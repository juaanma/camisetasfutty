/* Abajo de todo: cinta "Encargá la tuya" y "Pedidos a encargo" por categoría */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { esEncargo, foto, plural } from '../lib/util.js';
import { IcoWa } from '../lib/iconos.jsx';
import { MSG_MEDIDA, useTienda } from './contexto.js';
import Tarjeta from './Tarjeta.jsx';

// Descripción según el nombre de la sección
const desc = (s) => {
  const n = s.toLowerCase();
  if (n.includes('retro')) return 'Clásicas de época';
  if (n.includes('lifestyle')) return 'Estilo urbano';
  if (n.includes('actual')) return 'De esta temporada';
  return 'A pedido';
};
const CINTA = '★ ENCARGÁ LA TUYA ★ CUALQUIER TALLE ★ PERSONALIZADA ★ ENCARGÁ LA TUYA ★ CUALQUIER TALLE ★ PERSONALIZADA ';

export default function Encargo() {
  const { cfg, items, wa } = useTienda();
  const [sel, setSel] = useState(null);
  const encargos = items.filter(esEncargo);
  const lista = sel ? encargos.filter((i) => i.section === sel) : [];

  return (
    <section className="enc" id="encargo" aria-labelledby="ench">
      <div className="mq" aria-hidden="true"><div className="mqt"><span>{CINTA}</span><span>{CINTA}</span></div></div>
      <div className="wrap enc-w">
        <motion.div className="enc-h" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 100, damping: 16 }}>
          <h2 id="ench">Pedidos a encargo</h2>
          <p>Elegí una categoría y mirá lo que podés encargar</p>
        </motion.div>

        <div className="etiles">
          {cfg.sections.map((s, k) => (
            <Categoria key={s} nombre={s} k={k} its={encargos.filter((i) => i.section === s)}
              activa={sel === s} onClick={() => setSel(sel === s ? null : s)} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {sel && (
            <motion.div key={sel} className="enc-g" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
              <h3 className="enc-t">{sel} · a pedido</h3>
              {lista.length ? (
                <div className="grid">{lista.map((it, n) => <Tarjeta key={it.id} it={it} n={n} lista={lista.map((i) => i.id)} />)}</div>
              ) : (
                <p className="enc-empty">Todavía no cargamos modelos acá, pero podés pedirnos la que quieras por WhatsApp.<br />
                  <a className="btn btn-wa" target="_blank" rel="noopener" href={wa(MSG_MEDIDA)}><IcoWa />Pedila por WhatsApp</a></p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Categoria({ nombre, k, its, activa, onClick }) {
  // Las fotos de cada categoría van pasando solas
  const [c, setC] = useState(0);
  useEffect(() => {
    if (its.length < 2) return;
    const t = setInterval(() => setC((x) => (x + 1) % Math.min(its.length, 4)), 3000);
    return () => clearInterval(t);
  }, [its.length]);

  return (
    <motion.button className={'etile t-' + (k % 3) + (activa ? ' on' : '')} aria-pressed={activa} onClick={onClick}
      initial={{ opacity: 0, y: 60, rotate: k % 2 ? 4 : -4 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay: k * 0.1 }}
      whileHover={{ y: -8, rotate: k % 2 ? 1.5 : -1.5, scale: 1.03 }} whileTap={{ scale: 0.95 }}>
      <span className="tbg">
        <span className="tbase" />
        {its.slice(0, 4).map((i, n) => <img key={i.id} className={'sl' + (n === c ? ' on' : '')} src={foto(i.img)} alt="" loading="lazy" />)}
      </span>
      <span className="tin">
        <b>{nombre}</b>
        <small>{desc(nombre)}</small>
        <em>{plural(its.length, 'modelo', 'modelos')}</em>
      </span>
    </motion.button>
  );
}
