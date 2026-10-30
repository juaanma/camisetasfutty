/* La tienda que ven los clientes */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { datos } from '../lib/datos.js';
import { enStock, esEncargo, esVendida, ls, money, waLink } from '../lib/util.js';
import { useAviso } from '../lib/ui.jsx';
import { TiendaCtx } from './contexto.js';
import Hero from './Hero.jsx';
import Portada3D from './Portada3D.jsx';
import Barra from './Barra.jsx';
import Catalogo from './Catalogo.jsx';
import Encargo from './Encargo.jsx';
import Pie from './Pie.jsx';
import Consulta from './Consulta.jsx';
import VistaGrande from './VistaGrande.jsx';
import { Fondo, Progreso, WaFlotante } from './Extras.jsx';

export default function Tienda({ demo = false }) {
  const [D, setD] = useState(null);
  const [error, setError] = useState(false);
  const [bag, setBag] = useState([]);
  const [filtro, setFiltro] = useState({ q: '', size: '', sec: 'all' });
  const [abierta, setAbierta] = useState(null); // { id, lista, desdeTarjeta }
  const avisar = useAviso();

  useEffect(() => {
    datos.cargar().then((d) => {
      setD(d);
      // Mi consulta: queda guardada solo en el navegador de cada cliente
      try {
        const b = JSON.parse(ls('futty-bag') || '[]');
        setBag(b.filter((id) => d.items.some((it) => it.id === id && it.status === 'disponible')));
      } catch (e) { /* consulta rota: se arranca vacía */ }
    }).catch((e) => { console.error(e); setError(true); });
  }, []);

  useEffect(() => { ls('futty-bag', JSON.stringify(bag)); }, [bag]);
  useEffect(() => { document.body.classList.toggle('has-bag', bag.length > 0); }, [bag.length]);

  const cfg = D ? D.cfg : { sections: [] };
  const items = D ? D.items : [];

  const ctx = useMemo(() => {
    const byId = (id) => items.find((i) => i.id === id);
    const showP = (it) => cfg.showPrices && it.price;
    const wa = (t) => waLink(cfg, t);
    const line = (it) => it.name + ' ' + it.sub + ' · Talle ' + it.size + (it.code ? ' · Cód. #' + it.code : '') + (showP(it) ? ' · ' + money(it.price) : '');
    const msgUna = (it) => {
      if (esEncargo(it)) return 'Hola! Quiero encargar la camiseta ' + it.name + ' ' + it.sub + (it.code ? ' (Cód. #' + it.code + ')' : '') + '. ¿Cuánto sale y en qué talles se puede pedir?';
      if (esVendida(it)) return 'Hola! Vi que la camiseta ' + line(it) + ' está sin stock. ¿Me pueden conseguir una igual?';
      if (it.status === 'reservada') return 'Hola! Vi que la camiseta ' + line(it) + ' está reservada. Si se libera, ¿me avisan?';
      return 'Hola! Me interesa la camiseta ' + line(it) + '. ¿Sigue disponible?' + (showP(it) ? '' : ' ¿Qué precio tiene?');
    };
    const bagItems = bag.map(byId).filter(Boolean);
    const totales = (list) => {
      const pr = list.filter(showP), sum = pr.reduce((a, i) => a + Number(i.price), 0);
      return { sum, all: pr.length === list.length, some: pr.length > 0 };
    };
    const msgBag = () => {
      const t = totales(bagItems);
      let m = 'Hola! Me interesan estas camisetas:\n\n' + bagItems.map((i) => '• ' + line(i)).join('\n');
      if (t.all && t.some) m += '\n\nTotal: ' + money(t.sum);
      else if (t.some) m += '\n\nSubtotal de las que tienen precio: ' + money(t.sum) + '. El resto se los consulto.';
      return m + '\n\n¿Siguen disponibles? ¿Cómo coordinamos el pago?';
    };
    return {
      cfg, items, byId, showP, wa, msgUna, msgBag, bagItems, totales,
      // Las vendidas siguen en el catálogo como "sin stock" (si el dueño lo deja activado)
      listada: (it) => enStock(it) || (esVendida(it) && cfg.showSold),
      enBag: (id) => bag.includes(id),
      filtro, setFiltro, abrir: (id, lista, desdeTarjeta = true) => setAbierta({ id, lista, desdeTarjeta })
    };
  }, [cfg, items, bag, filtro]);

  const toggleBag = useCallback((id) => {
    const esta = bag.includes(id);
    avisar(esta ? 'Sacada de tu consulta' : 'Sumada a tu consulta');
    setBag(esta ? bag.filter((x) => x !== id) : [...bag, id]);
  }, [bag, avisar]);

  if (error) {
    return (
      <div className="empty"><b>No pudimos cargar el catálogo</b>Revisá tu conexión y volvé a intentar.<br />
        <button className="btn btn-line" onClick={() => location.reload()}>Reintentar</button></div>
    );
  }
  if (!D) return <Cargando />;

  return (
    <TiendaCtx.Provider value={{ ...ctx, toggleBag, vaciarBag: () => { setBag([]); avisar('Consulta vacía'); } }}>
      <Fondo />
      <Progreso />
      {demo ? <><Portada3D /><Hero sinLogo /></> : <Hero />}
      <LayoutGroup>
        <Barra />
        <Catalogo />
      </LayoutGroup>
      <Encargo />
      <Pie />
      <Consulta />
      <WaFlotante />
      <VistaGrande abierta={abierta} setAbierta={setAbierta} />
    </TiendaCtx.Provider>
  );
}

function Cargando() {
  return (
    <div className="cargando">
      <img src="/img/logo.png" alt="Camisetas Futty" />
      <span className="barrita"><i /></span>
    </div>
  );
}
