/* Pie: cómo comprar, medios de pago y contacto */
import { motion } from 'framer-motion';
import { igUsuario, waLindo } from '../lib/util.js';
import { IcoIg, IcoWa } from '../lib/iconos.jsx';
import { useTienda } from './contexto.js';

const col = {
  oculto: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 16, delay: i * 0.12 } })
};

export default function Pie() {
  const { cfg: c, wa } = useTienda();
  const pays = String(c.pay || '').split(/\s*(?:,|\by\b|\bo\b|·|\/)\s*/i).filter(Boolean);

  return (
    <footer>
      <motion.div className="wrap" initial="oculto" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
        <motion.div variants={col} custom={0}>
          <h3>Cómo comprar</h3>
          <ol>
            <li>Elegí una o varias camisetas y sumalas a tu consulta.</li>
            <li>Mandanos la consulta por WhatsApp y te confirmamos stock.</li>
            <li>Coordinamos el pago y la entrega por WhatsApp.</li>
          </ol>
        </motion.div>
        {pays.length > 0 && (
          <motion.div variants={col} custom={1}>
            <h3>Medios de pago</h3>
            <div className="pays">{pays.map((p) => <motion.span key={p} whileHover={{ y: -3, borderColor: '#d5b263' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</motion.span>)}</div>
            <p className="m">El pago se arregla por WhatsApp antes de la entrega.</p>
          </motion.div>
        )}
        <motion.div variants={col} custom={2}>
          <h3>Contacto</h3>
          <div className="links">
            <motion.a target="_blank" rel="noopener" href={wa('Hola! Tengo una consulta.')} whileHover={{ x: 6 }}><IcoWa /><span className="num">{waLindo(c)}</span></motion.a>
            {c.ig && <motion.a target="_blank" rel="noopener" href={c.ig} whileHover={{ x: 6 }}><IcoIg />{igUsuario(c)}</motion.a>}
          </div>
        </motion.div>
        <div className="legal"><span>© {new Date().getFullYear()} Camisetas Futty</span><span>Stock actualizado por el equipo de Futty</span></div>
      </motion.div>
    </footer>
  );
}
