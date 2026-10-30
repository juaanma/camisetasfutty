/* Foto grande: la imagen "vuela" desde la tarjeta, se pasa con flechas o deslizando */
import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { esEncargo, esVendida, foto, money } from '../lib/util.js';
import { IcoDer, IcoIzq, IcoWa, IcoX } from '../lib/iconos.jsx';
import { Ventana } from '../lib/ui.jsx';
import { useTienda } from './contexto.js';
import Visor3D from './Visor3D.jsx';

export default function VistaGrande({ abierta, setAbierta }) {
  const { byId } = useTienda();
  const it = abierta && byId(abierta.id);
  const cerrar = useCallback(() => setAbierta(null), [setAbierta]);

  const lista = abierta?.lista || [];
  const idx = it ? lista.indexOf(it.id) : -1;
  const paso = useCallback((d) => {
    setAbierta((a) => {
      if (!a) return a;
      const l = a.lista || [], i = l.indexOf(a.id);
      if (i < 0 || l.length < 2) return a;
      return { ...a, id: l[(i + d + l.length) % l.length], desdeTarjeta: false, dir: d };
    });
  }, [setAbierta]);
  const tecla = useCallback((e) => { if (e.key === 'ArrowLeft') paso(-1); else if (e.key === 'ArrowRight') paso(1); }, [paso]);

  return (
    <Ventana abierta={!!it} onCerrar={cerrar} className="lb" etiqueta={it ? it.name : ''} onTecla={tecla}>
      {it && <Contenido it={it} abierta={abierta} idx={idx} n={lista.length} paso={paso} cerrar={cerrar} />}
    </Ventana>
  );
}

function Contenido({ it, abierta, idx, n, paso, cerrar }) {
  const { cfg, showP, wa, msgUna, enBag, toggleBag } = useTienda();
  const res = it.status === 'reservada', sold = esVendida(it), enc = esEncargo(it), on = enBag(it.id);
  const dir = abierta.dir || 1;

  return (
    <>
      <button className="x" onClick={cerrar} aria-label="Cerrar"><IcoX /></button>
      <div className="lb-ph">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={it.id} className="lb-slide"
            initial={abierta.desdeTarjeta ? false : { opacity: 0, x: dir * 120 }}
            animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -120 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
            <Visor3D fotos={[it.img, ...(it.imgs || [])].filter(Boolean).map(foto)} alt={it.name + ' ' + it.sub}
              layoutId={abierta.desdeTarjeta ? 'foto-' + it.id : undefined} />
          </motion.div>
        </AnimatePresence>
        {idx > -1 && n > 1 && (
          <>
            <motion.button className="lb-nav prev" onClick={() => paso(-1)} aria-label="Anterior" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}><IcoIzq /></motion.button>
            <motion.button className="lb-nav next" onClick={() => paso(1)} aria-label="Siguiente" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}><IcoDer /></motion.button>
          </>
        )}
      </div>
      <motion.div key={'i' + it.id} className="lb-info"
        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <p className="eyebrow">{it.section}{idx > -1 && n > 1 ? ' · ' + (idx + 1) + ' de ' + n : ''}</p>
        <h3>{it.name}</h3>
        <p className="sub">{it.sub}</p>
        <dl className="facts">
          <dt>Talle</dt><dd>{enc ? 'El que quieras' : it.size}</dd>
          {!enc && it.units > 1 && <><dt>Unidades</dt><dd>{it.units}</dd></>}
          {it.code && <><dt>Código</dt><dd>#{it.code}</dd></>}
          <dt>Estado</dt><dd>{enc ? 'A pedido' : sold ? 'Sin stock' : res ? 'Reservada' : 'Disponible'}</dd>
        </dl>
        {enc ? <p className="note">Se encarga en el talle que quieras. Escribinos y te pasamos precio y demora.</p>
          : sold ? <p className="note">Esta ya se vendió. Escribinos y vemos si te conseguimos una igual.</p>
          : <>
            {showP(it) ? <span className="p">{money(it.price)}</span> : <p className="note">Consultá el precio por WhatsApp.</p>}
            {cfg.pay && <p className="note">Pago: {String(cfg.pay).toLowerCase()}. Se coordina por WhatsApp.</p>}
          </>}
        <div className="act">
          {!res && !sold && !enc && (
            <motion.button className="btn btn-line big" aria-pressed={on} onClick={() => toggleBag(it.id)} whileTap={{ scale: 0.94 }}>
              {on ? '✓ En tu consulta' : '+ Sumar a mi consulta'}
            </motion.button>
          )}
          <motion.a className="btn btn-wa" target="_blank" rel="noopener" href={wa(msgUna(it))} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
            <IcoWa />{enc ? 'Encargala por WhatsApp' : sold ? 'Pedí una igual' : res ? 'Avisame si se libera' : 'Consultar por WhatsApp'}
          </motion.a>
        </div>
      </motion.div>
    </>
  );
}
