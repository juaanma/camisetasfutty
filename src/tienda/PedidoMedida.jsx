/*
 * "¿No está la camiseta que tanto buscás?" con el mismo ambiente de estadio
 * que la vitrina: al lado del texto, una camiseta fantasma (el lugar vacío
 * de la vitrina) con un "?" que brilla.
 */
import { motion } from 'framer-motion';
import { enStock, plural } from '../lib/util.js';
import { Contador } from '../lib/ui.jsx';
import { MSG_MEDIDA, useTienda } from './contexto.js';

const suave = [0.2, 0.8, 0.2, 1];
const TITULO = '¿No está la camiseta que tanto buscás?'.split(' ');
const entra = (d = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.7, delay: d, ease: suave } });

export default function PedidoMedida() {
  const { items, wa } = useTienda();
  const n = items.filter(enStock).length;

  return (
    <header className="medida" id="pedidos">
      <div className="medida-in">
        <motion.div className="fantasma" aria-hidden="true"
          initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 1, ease: suave }}>
          <span className="fantasma-luz" />
          <svg viewBox="-10 -10 180 180" className="fantasma-svg">
            <path className="silueta" d="M30 22 L60 6 Q80 26 100 6 L130 22 L160 52 L136 76 L124 64 L124 156 L36 156 L36 64 L24 76 L0 52 Z" />
            <path className="cuello" d="M60 6 Q80 26 100 6" />
          </svg>
          <motion.span className="fantasma-q" animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>?</motion.span>
          <span className="fantasma-piso" />
          <span className="fantasma-txt">Tu próxima camiseta</span>
        </motion.div>

        <div className="medida-txt">
          <motion.p className="eyebrow" {...entra(0)}>Pedidos a medida</motion.p>
          <h2 aria-label={TITULO.join(' ')}>
            {TITULO.map((p, i) => (
              <motion.span key={i} className="palabra" aria-hidden="true"
                initial={{ opacity: 0, y: 30, rotateX: -80 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 + i * 0.07 }}>
                {p}
              </motion.span>
            ))}
          </h2>
          <motion.p className="d" {...entra(0.4)}>
            ¿No la viste en la vitrina? Pedí <b>CUALQUIER</b> camiseta: la que siempre estuviste buscando, de cualquier equipo o época. Personalizala como quieras y encargala en <b>cualquier talle</b>.
          </motion.p>
          <motion.div {...entra(0.55)}>
            <a className="btn btn-wa latido medida-btn" target="_blank" rel="noopener" href={wa(MSG_MEDIDA)}>Pedila por WhatsApp</a>
          </motion.div>
          <motion.p className="hint" {...entra(0.7)}>¡Mandanos la foto de la camiseta que querés!</motion.p>
        </div>
      </div>

      <motion.a className="stock-big" href="#catalog"
        initial={{ opacity: 0, y: 30, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
        <span className="dot" aria-hidden="true" />Stock disponible<span className="dot" aria-hidden="true" />
      </motion.a>
      <motion.p className="fast" {...entra(0.2)}>
        <span className="live" aria-hidden="true" />Entrega inmediata · <Contador valor={n} formato={(x) => plural(x, 'camiseta', 'camisetas')} />
      </motion.p>
    </header>
  );
}
