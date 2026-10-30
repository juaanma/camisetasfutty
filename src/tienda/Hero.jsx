/* Encabezado: logo, "¿No está la camiseta que tanto buscás?" y la franja de stock */
import { motion, useScroll, useTransform } from 'framer-motion';
import { enStock, plural } from '../lib/util.js';
import { Contador } from '../lib/ui.jsx';
import { MSG_MEDIDA, useTienda } from './contexto.js';

const suave = [0.2, 0.8, 0.2, 1];
const TITULO = '¿No está la camiseta que tanto buscás?'.split(' ');

export default function Hero({ sinLogo = false }) {
  const { items, wa } = useTienda();
  const n = items.filter(enStock).length;

  // Profundidad: el logo baja más lento que la página
  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 500], [0, 90]);
  const logoO = useTransform(scrollY, [0, 400], [1, 0.25]);

  return (
    <header className="top">
      <h1 className="sr">Camisetas Futty</h1>
      {!sinLogo && <motion.div className="flota-w" style={{ y: logoY, opacity: logoO }}>
        <div className="flota"><motion.img className="logo" src="/img/logo.png" alt="Camisetas Futty" width="1000" height="236"
          initial={{ opacity: 0, y: -40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }} /></div>
      </motion.div>}

      <motion.section className="hero-ask" id="pedidos" aria-labelledby="pedh"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: suave }}>
        <span className="hero-luz" aria-hidden="true" />
        <motion.p className="eyebrow" initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.28em' }} transition={{ duration: 1, delay: 0.3 }}>
          Pedidos a medida
        </motion.p>
        <h2 id="pedh" aria-label={TITULO.join(' ')}>
          {TITULO.map((p, i) => (
            <motion.span key={i} className="palabra" aria-hidden="true"
              initial={{ opacity: 0, y: 30, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.35 + i * 0.07 }}>
              {p}
            </motion.span>
          ))}
        </h2>
        <motion.p className="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}>
          Pedí <b>CUALQUIER</b> camiseta: la que siempre estuviste buscando, de cualquier equipo o época. Personalizala como quieras y encargala en <b>cualquier talle</b>.
        </motion.p>
        <motion.a className="btn btn-wa latido" target="_blank" rel="noopener" href={wa(MSG_MEDIDA)}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 1.05 }}>
          Pedila por WhatsApp
        </motion.a>
        <motion.p className="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
          ¡Mandanos la foto de la camiseta que querés!
        </motion.p>
      </motion.section>

      <motion.a className="stock-big" href="#catalog"
        initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
        <span className="dot" aria-hidden="true" />Stock disponible<span className="dot" aria-hidden="true" />
      </motion.a>
      <motion.p className="fast" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }}>
        <span className="live" aria-hidden="true" />Entrega inmediata · <Contador valor={n} formato={(x) => plural(x, 'camiseta', 'camisetas')} />
      </motion.p>
    </header>
  );
}
