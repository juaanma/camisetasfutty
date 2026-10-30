/* Tarjeta de camiseta: aparece al bajar, se inclina en 3D con el mouse y tiene un reflejo */
import { forwardRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { esEncargo, esVendida, foto, money } from '../lib/util.js';
import { useTienda } from './contexto.js';

const Tarjeta = forwardRef(function Tarjeta({ it, n = 0, lista }, ref) {
  const { showP, wa, msgUna, enBag, toggleBag, abrir } = useTienda();
  const res = it.status === 'reservada', sold = esVendida(it), enc = esEncargo(it), on = enBag(it.id);

  // Inclinación 3D siguiendo el mouse
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 220, damping: 20 });
  const gx = useTransform(mx, [0, 1], [0, 100]), gy = useTransform(my, [0, 1], [0, 100]);
  const reflejo = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.22), transparent 55%)`;
  const mover = (e) => {
    if (e.pointerType !== 'mouse' || sold) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const soltar = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div ref={ref} className="card-w" layout
      initial={{ opacity: 0, y: 50, scale: 0.94 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-30px' }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, delay: (n % 4) * 0.06 }}>
      <motion.article className={'card' + (res ? ' is-res' : '') + (sold ? ' is-sold' : '') + (enc ? ' is-enc' : '')}
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        onPointerMove={mover} onPointerLeave={soltar} whileHover={sold ? {} : { y: -6 }}>
        <button className="ph" onClick={() => abrir(it.id, lista)} aria-label={'Ver foto grande: ' + it.name + ' ' + it.sub + (sold ? ' (sin stock)' : '')}>
          <span className="zoom">
            {/* Se balancea como colgada de una percha; cada una con su ritmo */}
            <span className={'cuelga' + (sold ? ' quieta' : '')} style={ritmo(it.id)}>
              <motion.img layoutId={'foto-' + it.id} src={foto(it.img)} alt="" loading="lazy" decoding="async" width="720" height="720" />
            </span>
          </span>
          {!sold && <motion.span className="reflejo" style={{ background: reflejo }} aria-hidden="true" />}
          <span className="tag-sz">{enc ? 'A pedido' : it.size}</span>
          {sold ? <span className="stamp">Sin stock</span> : (
            <span className="flags">
              {res && <span className="flag res">Reservada</span>}
              {it.isNew && !res && <span className="flag new">Nuevo</span>}
              {it.imgs?.length > 0 && <span className="flag v3d-flag">↻ 3D</span>}
              {it.units > 1 && <span className="flag units">{it.units} unidades</span>}
            </span>
          )}
        </button>
        <div className="bd">
          <h3>{it.name}</h3>
          <p className="sub">{it.sub}</p>
          <div className="ft">
            <div className="price">
              {sold ? <span className="ask out">Sin stock</span> : showP(it) ? <span className="p">{money(it.price)}</span> : <span className="ask">Precio por WhatsApp</span>}
              {it.code && <span className="code">#{it.code}</span>}
            </div>
            <div className="act">
              {!res && !sold && !enc && (
                <motion.button className="btn btn-line btn-sm" aria-pressed={on} onClick={() => toggleBag(it.id)}
                  whileTap={{ scale: 0.9 }} animate={on ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
                  {on ? '✓ Sumada' : '+ Sumar'}
                </motion.button>
              )}
              <motion.a className={'btn ' + (sold ? 'btn-line' : 'btn-wa') + ' btn-sm'} target="_blank" rel="noopener" href={wa(msgUna(it))} whileTap={{ scale: 0.92 }}>
                {enc ? 'Encargar' : sold ? 'Pedí una igual' : res ? 'Avisame' : 'Consultar'}
              </motion.a>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
});

// Duración y desfase distintos para cada camiseta (siempre los mismos para la misma)
function ritmo(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { animationDuration: 3.2 + (h % 15) / 10 + 's', animationDelay: -((h >> 4) % 40) / 10 + 's' };
}

export default Tarjeta;
