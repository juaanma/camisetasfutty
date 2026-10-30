/*
 * Portada: vitrina 3D con las camisetas del stock girando en anillo
 * y una ficha con los datos de la que está al frente.
 * Se arrastra para girarla; tocando la del frente se abre.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { enStock, foto } from '../lib/util.js';
import { IcoWa } from '../lib/iconos.jsx';
import { useTienda } from './contexto.js';
import Ficha from './Ficha.jsx';

const medir = (n) => {
  const card = window.innerWidth < 600 ? 128 : 188;
  const R = Math.round((card / (2 * Math.tan(Math.PI / Math.max(n, 3)))) * 1.2);
  return { card, R };
};

export default function Portada3D() {
  const { items, abrir, wa, msgUna, showP } = useTienda();
  const lista = useMemo(() => items.filter((i) => enStock(i) && i.img).slice(0, 12), [items]);
  const N = lista.length, paso = 360 / Math.max(N, 1);
  const [frente, setFrente] = useState(0);
  const [m, setM] = useState(() => medir(N));
  const [tocado, setTocado] = useState(false);
  const anillo = useRef(), tarjetas = useRef([]);
  const s = useRef({ ang: 0, obj: 0, arrastre: null, pausa: false, frente: -1 }).current;

  useEffect(() => {
    const f = () => setM(medir(N));
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [N]);

  // Animación: el anillo se acerca suave a su destino y cada 2,6 s avanza una camiseta
  useEffect(() => {
    if (!N) return;
    let raf, prev = performance.now();
    const avanzar = setInterval(() => { if (!s.arrastre && !s.pausa && !document.hidden) s.obj += paso; }, 2600);
    const loop = (t) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      if (!s.arrastre) s.ang += (s.obj - s.ang) * Math.min(1, dt * 4.5);
      if (anillo.current) anillo.current.style.transform = `translateZ(${-m.R}px) rotateX(-9deg) rotateY(${-s.ang}deg)`;
      tarjetas.current.forEach((el, i) => {
        if (!el) return;
        const rel = ((((i * paso - s.ang) % 360) + 540) % 360) - 180;
        const c = Math.cos((rel * Math.PI) / 180);
        el.style.opacity = (0.12 + 0.88 * Math.max(0, (c + 0.4) / 1.4)).toFixed(3);
        el.style.filter = `brightness(${(0.4 + 0.6 * Math.max(0, c)).toFixed(3)})`;
      });
      const f = ((Math.round(s.ang / paso) % N) + N) % N;
      if (f !== s.frente) { s.frente = f; setFrente(f); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); clearInterval(avanzar); };
  }, [N, paso, m.R, s]);

  if (!N) return null;
  const it = lista[frente];
  const ids = lista.map((i) => i.id);

  /* Arrastrar para girar; un toque sin arrastrar abre la del frente o gira hasta la tocada */
  const bajar = (e) => {
    const card = e.target.closest('[data-i]');
    s.arrastre = { x: e.clientX, ang: s.ang, movido: false, t: performance.now(), lx: e.clientX, v: 0, i: card ? +card.dataset.i : -1 };
    setTocado(true);
  };
  const mover = (e) => {
    const a = s.arrastre;
    if (!a) return;
    const dx = e.clientX - a.x;
    if (Math.abs(dx) > 6) a.movido = true;
    const ahora = performance.now();
    a.v = (e.clientX - a.lx) / Math.max(1, ahora - a.t);
    a.lx = e.clientX; a.t = ahora;
    s.ang = a.ang - dx * 0.32;
  };
  const soltar = (cancelado) => {
    const a = s.arrastre;
    if (!a) return;
    s.arrastre = null;
    if (!a.movido && !cancelado && a.i > -1) {
      if (a.i === s.frente) { abrir(lista[a.i].id, ids, false); return; }
      const actual = Math.round(s.ang / paso);
      let d = (((a.i - (((actual % N) + N) % N)) % N) + N) % N;
      if (d > N / 2) d -= N;
      s.obj = (actual + d) * paso;
      return;
    }
    s.obj = Math.round((s.ang - a.v * 140) / paso) * paso;
  };

  return (
    <section className="portada" aria-label="Vitrina de camisetas">
      <span className="haz h1" aria-hidden="true" /><span className="haz h2" aria-hidden="true" />
      <span className="polvo" aria-hidden="true" />

      <motion.img className="p-logo" src="/img/logo.png" alt="Camisetas Futty" width="1000" height="236"
        initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} />

      <motion.div className="escena" style={{ '--card': m.card + 'px' }}
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        onPointerDown={bajar} onPointerMove={mover} onPointerUp={() => soltar(false)} onPointerCancel={() => soltar(true)}
        onPointerLeave={() => soltar(true)}
        onMouseEnter={() => { s.pausa = true; }} onMouseLeave={() => { s.pausa = false; }}>
        <span className="piso" aria-hidden="true" />
        <div ref={anillo} className="anillo">
          {lista.map((x, i) => (
            <div key={x.id} ref={(el) => { tarjetas.current[i] = el; }} data-i={i}
              className={'p-card' + (i === frente ? ' on' : '')}
              style={{ transform: `rotateY(${i * paso}deg) translateZ(${m.R}px)` }}>
              <img src={foto(x.img)} alt={x.name + ' ' + x.sub} draggable={false} />
            </div>
          ))}
        </div>
        <AnimatePresence>
          {!tocado && (
            <motion.span className="p-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.6 }}>
              <motion.span animate={{ x: [-12, 12, -12] }} transition={{ duration: 1.8, repeat: Infinity }}>👆</motion.span> Deslizá para girar
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="p-info" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
        <Ficha it={it} showP={showP} />
        <div className="p-acc">
          <motion.button className="btn btn-gold" onClick={() => abrir(it.id, ids, false)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>Ver camiseta</motion.button>
          <motion.a className="btn btn-wa" href={wa(msgUna(it))} target="_blank" rel="noopener" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}><IcoWa />Consultar</motion.a>
        </div>
      </motion.div>

      <a className="p-baja" href="#pedidos" aria-label="Ver más">
        <span>Mirá todo el stock</span>
        <motion.span aria-hidden="true" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>↓</motion.span>
      </a>
    </section>
  );
}
