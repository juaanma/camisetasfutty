/* Detalles que le dan vida a la página */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { IcoWa } from '../lib/iconos.jsx';
import { useTienda } from './contexto.js';

/* Barra dorada arriba que muestra cuánto bajaste */
export function Progreso() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div className="progreso" style={{ scaleX: x }} aria-hidden="true" />;
}

/* Fondo con luces doradas y azules que flotan despacio */
export function Fondo() {
  return (
    <div className="fondo" aria-hidden="true">
      <span className="luz l1" /><span className="luz l2" /><span className="luz l3" />
    </div>
  );
}

/* Botón flotante de WhatsApp: aparece al bajar */
export function WaFlotante() {
  const { wa } = useTienda();
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const f = () => setVer(window.scrollY > 600);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <AnimatePresence>
      {ver && (
        <motion.a className="wa-flota" href={wa('Hola! Tengo una consulta.')} target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp"
          initial={{ scale: 0, rotate: -120 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 120 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }} whileHover="abierto" whileTap={{ scale: 0.9 }}>
          <IcoWa />
          <motion.span className="wa-txt" variants={{ abierto: { width: 'auto', opacity: 1, marginLeft: 8 } }} initial={{ width: 0, opacity: 0, marginLeft: 0 }}>¿Consultas?</motion.span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
