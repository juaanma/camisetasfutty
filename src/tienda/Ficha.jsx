/* Ficha de la camiseta que está al frente de la vitrina: cambia con una animación suave */
import { AnimatePresence, motion } from 'framer-motion';
import { money } from '../lib/util.js';

const suave = [0.2, 0.8, 0.2, 1];

export default function Ficha({ it, showP }) {
  return (
    <div className="ficha" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={it.id} className="ficha-in"
          initial="fuera" animate="dentro" exit="salida"
          variants={{ salida: { opacity: 0, y: -14, filter: 'blur(4px)', transition: { duration: 0.22 } } }}>
          <motion.p className="ficha-sec" variants={aparece(0)}>{it.section}</motion.p>
          <h2 className="ficha-nom" aria-label={it.name}>
            {[...it.name].map((c, i) => (
              <motion.span key={i} aria-hidden="true"
                variants={{ fuera: { opacity: 0, y: 18, rotateX: -70 }, dentro: { opacity: 1, y: 0, rotateX: 0, transition: { delay: 0.05 + i * 0.025, duration: 0.45, ease: suave } } }}>
                {c === ' ' ? ' ' : c}
              </motion.span>
            ))}
          </h2>
          {it.sub && <motion.p className="ficha-sub" variants={aparece(0.18)}>{it.sub}</motion.p>}
          <motion.div className="ficha-datos" variants={aparece(0.26)}>
            {showP(it) ? <span className="ficha-precio">{money(it.price)}</span> : <span className="ficha-consultar">Precio por WhatsApp</span>}
            <span className="ficha-chip">Talle {it.size}</span>
            {it.isNew && <span className="ficha-chip nuevo">Nuevo</span>}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const aparece = (d) => ({
  fuera: { opacity: 0, y: 12 },
  dentro: { opacity: 1, y: 0, transition: { delay: d, duration: 0.45, ease: suave } }
});
