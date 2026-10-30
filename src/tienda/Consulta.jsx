/* "Tu consulta": barra de abajo que sube con resorte, y su ventana */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { foto, money, plural } from '../lib/util.js';
import { IcoWa, IcoX } from '../lib/iconos.jsx';
import { Ventana } from '../lib/ui.jsx';
import { useTienda } from './contexto.js';

export default function Consulta() {
  const { cfg, bagItems: list, totales, showP, wa, msgBag, toggleBag, vaciarBag } = useTienda();
  const [ver, setVer] = useState(false);
  const t = totales(list);
  const abierta = ver && list.length > 0;

  return (
    <>
      <AnimatePresence>
        {list.length > 0 && (
          <motion.div id="bag" initial={{ y: 140 }} animate={{ y: 0 }} exit={{ y: 140 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <div className="wrap">
              <div className="bag-thumbs" aria-hidden="true">
                <AnimatePresence initial={false}>
                  {list.slice(0, 4).map((i) => (
                    <motion.img key={i.id} src={foto(i.img)} alt="" layout
                      initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="bag-txt">
                <b>Tu consulta: <motion.span key={list.length} className="bag-n" initial={{ scale: 1.8, color: '#ead08f' }} animate={{ scale: 1, color: '#f4efe2' }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>{plural(list.length, 'camiseta', 'camisetas')}</motion.span></b>
                <span>{t.all && t.some ? 'Total ' + money(t.sum) : t.some ? 'Subtotal ' + money(t.sum) + ' + a consultar' : 'Precios por WhatsApp'}</span>
              </div>
              <motion.button className="btn btn-line btn-sm" onClick={() => setVer(true)} whileTap={{ scale: 0.92 }}>Ver</motion.button>
              <motion.a className="btn btn-wa btn-sm" target="_blank" rel="noopener" href={wa(msgBag())} whileTap={{ scale: 0.92 }}><IcoWa />Enviar</motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Ventana abierta={abierta} onCerrar={() => setVer(false)} etiqueta="Tu consulta">
        <div className="md-h"><h3>Tu consulta</h3><button className="x" onClick={() => setVer(false)} aria-label="Cerrar" data-autofocus><IcoX /></button></div>
        <div className="md-b">
          <div className="bag-list">
            <AnimatePresence initial={false}>
              {list.map((i) => (
                <motion.div key={i.id} className="bag-row" layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, paddingBottom: 0 }}>
                  <img src={foto(i.img)} alt="" />
                  <div><b>{i.name}</b><span>{i.sub} · Talle {i.size}</span></div>
                  <div style={{ textAlign: 'right' }}>
                    {showP(i) ? <span className="p">{money(i.price)}</span> : <span>A consultar</span>}
                    <button className="rm" onClick={() => toggleBag(i.id)}>Sacar</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {t.some && <div className="total"><span>{t.all ? 'Total' : 'Subtotal'}</span><span className="p">{money(t.sum)}</span></div>}
          {t.some && !t.all && <p className="note">Las que no tienen precio te las cotizamos por WhatsApp.</p>}
          <p className="note" style={{ marginTop: 10 }}>Al enviar se abre WhatsApp con la lista armada.{cfg.pay ? ' Pago: ' + String(cfg.pay).toLowerCase() + '.' : ''}</p>
        </div>
        <div className="md-f">
          <button className="btn btn-line" onClick={() => { vaciarBag(); setVer(false); }}>Vaciar</button>
          <a className="btn btn-wa" target="_blank" rel="noopener" href={wa(msgBag())}><IcoWa />Enviar por WhatsApp</a>
        </div>
      </Ventana>
    </>
  );
}
