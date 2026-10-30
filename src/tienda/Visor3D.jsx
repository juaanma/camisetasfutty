/*
 * Visor 3D de la camiseta: se arrastra para girarla y, al darla vuelta, muestra la
 * foto siguiente (espalda, detalles). Con una sola foto, se inclina en 3D.
 * Tiene lupa para ver de cerca (botón o doble clic).
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';

const etiqueta = (i) => (i === 0 ? 'Frente' : i === 1 ? 'Espalda' : 'Detalle ' + (i - 1));
const resorte = { type: 'spring', stiffness: 110, damping: 17 };

export default function Visor3D({ fotos, alt, layoutId }) {
  const n = fotos.length;
  const giro = useMotionValue(0);          // grados en Y (puede pasar de 360)
  const incl = useMotionValue(0);          // inclinación en X
  const inclS = useSpring(incl, { stiffness: 220, damping: 20 });
  const [cara, setCara] = useState(0);     // qué foto se ve
  const [dorso, setDorso] = useState(false);
  const [zoom, setZoom] = useState(null);  // { x, y } en % o null
  const [usado, setUsado] = useState(false);
  const desde = useRef(0);

  // Precarga las fotos para que no parpadeen al girar
  useEffect(() => { fotos.forEach((s) => { const i = new Image(); i.src = s; }); }, [fotos.join('|')]); // eslint-disable-line

  // Cada media vuelta pasa a la foto siguiente
  useMotionValueEvent(giro, 'change', (v) => {
    const paso = Math.floor((v + 90) / 180);
    setCara(((paso % n) + n) % n);
    setDorso(Math.abs(paso % 2) === 1);
  });

  // Giro de muestra al abrir, para que se note que se puede mover
  useEffect(() => {
    const c = animate(giro, n > 1 ? [0, 38, 0] : [0, 22, -14, 0], { duration: 1.6, delay: 0.7, ease: 'easeInOut' });
    return () => c.stop();
  }, [giro, n]);

  const brillo = useTransform(giro, (v) => {
    const t = (((v % 180) + 180) % 180) / 180 * 100;
    return `linear-gradient(105deg, transparent ${t - 35}%, rgba(255,255,255,.38) ${t}%, transparent ${t + 35}%)`;
  });
  const sombra = useTransform(giro, (v) => 0.45 + 0.55 * Math.abs(Math.cos((v * Math.PI) / 180)));

  const pasoActual = () => Math.round(giro.get() / 180);
  const irA = (i) => {
    setUsado(true);
    const p = pasoActual(), actual = ((p % n) + n) % n;
    animate(giro, (p + ((i - actual + n) % n)) * 180, resorte);
  };

  const arrastre = {
    onPanStart: () => { desde.current = giro.get(); setUsado(true); },
    onPan: (e, info) => {
      let v = desde.current + info.offset.x * 0.55;
      if (n === 1) v = 42 * Math.tanh(v / 42); // con una sola foto, solo se inclina
      giro.set(v);
      incl.set(Math.max(-18, Math.min(18, -info.offset.y * 0.12)));
    },
    onPanEnd: (e, info) => {
      incl.set(0);
      if (n === 1) { animate(giro, 0, resorte); return; }
      const destino = Math.round((giro.get() + info.velocity.x * 0.12) / 180) * 180;
      animate(giro, destino, resorte);
    }
  };

  const ponerZoom = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="v3d">
      <motion.div className="v3d-escena" {...arrastre} onDoubleClick={ponerZoom} style={{ touchAction: 'none' }}>
        <motion.div className="v3d-plano" style={{ rotateY: giro, rotateX: inclS }}>
          <div className="v3d-cara" style={dorso ? { transform: 'scaleX(-1)' } : undefined}>
            <motion.img layoutId={layoutId} src={fotos[cara]} alt={alt + ' · ' + etiqueta(cara)} draggable={false} />
            <motion.span className="v3d-brillo" style={{ background: brillo }} aria-hidden="true" />
          </div>
        </motion.div>
        <motion.span className="v3d-sombra" style={{ scaleX: sombra }} aria-hidden="true" />
      </motion.div>

      <AnimatePresence>
        {!usado && (
          <motion.div className="v3d-hint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
            <motion.span animate={{ x: [-10, 10, -10] }} transition={{ duration: 1.6, repeat: Infinity }}>👆</motion.span>
            {n > 1 ? 'Arrastrá para darla vuelta' : 'Arrastrá para moverla'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="v3d-ctrl">
        {n > 1 && (
          <div className="v3d-puntos">
            {fotos.map((f, i) => (
              <button key={i} className={'v3d-punto' + (cara === i ? ' on' : '')} onClick={() => irA(i)} aria-label={'Ver ' + etiqueta(i)} title={etiqueta(i)}>
                {cara === i && <motion.span layoutId="v3d-punto" className="v3d-punto-on" />}
                <span>{etiqueta(i)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="v3d-btns">
          {n > 1 && <motion.button className="v3d-btn" onClick={() => irA((cara + 1) % n)} whileTap={{ scale: 0.9, rotate: 180 }} aria-label="Girar">↻</motion.button>}
          <motion.button className="v3d-btn" onClick={() => setZoom({ x: 50, y: 40 })} whileTap={{ scale: 0.9 }} aria-label="Ver de cerca">🔍</motion.button>
        </div>
      </div>

      {/* Lupa: la foto agrandada sigue al dedo o al mouse */}
      <AnimatePresence>
        {zoom && (
          <motion.div className="v3d-zoom" style={{ touchAction: 'none' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onPointerDown={ponerZoom} onPointerMove={ponerZoom}
            onPointerUp={(e) => { if (e.pointerType === 'mouse') setZoom(null); }}>
            <button className="v3d-zoom-x" onPointerUp={(e) => { e.stopPropagation(); setZoom(null); }} aria-label="Salir del zoom">✕</button>
            <motion.img src={fotos[cara]} alt="" draggable={false}
              initial={{ scale: 1 }} animate={{ scale: 2.6 }} exit={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }} />
            <span className="v3d-zoom-txt">Mové el dedo o el mouse para recorrerla</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
