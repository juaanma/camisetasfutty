/* Panel admin del dueño */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { datos, ordenar } from '../lib/datos.js';
import { ESTADOS as ST, foto, money, norm, plural } from '../lib/util.js';
import { IcoBuscar } from '../lib/iconos.jsx';
import { Contador, useAviso } from '../lib/ui.jsx';
import FormCamiseta from './FormCamiseta.jsx';
import '../styles/admin.css';

const nuevoId = () => 'i' + Date.now() + Math.random().toString(36).slice(2, 5);

export default function Admin() {
  const [user, setUser] = useState(undefined); // undefined = revisando sesión
  const [errInicial, setErrInicial] = useState('');

  useEffect(() => {
    document.title = 'Panel admin · Camisetas Futty';
    datos.usuario().then((u) => setUser(u || null)).catch((e) => {
      console.error(e);
      setUser(null);
      setErrInicial('No se pudo conectar. Revisá la conexión y probá de nuevo.');
    });
    return () => { document.title = 'Camisetas Futty'; };
  }, []);

  if (user === undefined) return <p className="empty"><b>Cargando panel…</b></p>;
  if (!user) return <Login msgInicial={errInicial} onEntrar={setUser} />;
  return <Panel onSalir={() => datos.salir().then(() => setUser(null))} />;
}

/* ---------- Entrar ---------- */
function Login({ msgInicial, onEntrar }) {
  const prueba = datos.modo === 'prueba';
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(msgInicial || '');
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    if (!prueba && (!email.trim() || !pass)) { setErr('Completá el correo y la contraseña.'); return; }
    setCargando(true);
    setErr('');
    try { onEntrar(await datos.entrar(email.trim(), pass)); }
    catch (x) { setCargando(false); setErr(x?.message || 'No se pudo entrar. Probá de nuevo.'); }
  };

  return (
    <main className="login">
      <motion.form className="login-box form" onSubmit={entrar} noValidate
        initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
        <img className="logo" src="/img/logo.png" alt="Camisetas Futty" width="1000" height="236" />
        <h1>Panel admin</h1>
        <p className="note">{prueba
          ? <>Estás en <b>modo prueba</b>: entrás con cualquier correo y contraseña, y los cambios quedan solo en esta computadora.</>
          : 'Entrá con el correo y la contraseña del dueño.'}</p>
        <label className="fld"><span>Correo</span><input type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="fld"><span>Contraseña</span><input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        <AnimatePresence>{err && <motion.p className="err" role="alert" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }}>{err}</motion.p>}</AnimatePresence>
        <motion.button className="btn btn-gold" disabled={cargando} whileTap={{ scale: 0.96 }}>{cargando ? 'Entrando…' : 'Entrar'}</motion.button>
        <Link className="back" to="/">← Volver a la tienda</Link>
      </motion.form>
    </main>
  );
}

/* ---------- Panel ---------- */
function Panel({ onSalir }) {
  const avisar = useAviso();
  const [D, setD] = useState(null);
  const [tab, setTab] = useState('items');
  const [saving, setSaving] = useState(0);
  const [editando, setEditando] = useState(null); // null | 'nueva' | id

  const recargar = useCallback(() => datos.cargar().then((d) => setD({ cfg: d.cfg, items: ordenar(d.items) })), []);
  useEffect(() => { recargar().catch(() => avisar('No se pudo cargar el catálogo.')); }, [recargar, avisar]);

  // Avisa si se intenta cerrar la pestaña mientras se guarda
  useEffect(() => {
    const f = (e) => { if (saving) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [saving]);

  /* Guarda en la base. Si falla, avisa y recarga lo que hay guardado de verdad. */
  const guardar = useCallback(async (promesa, okMsg) => {
    setSaving((s) => s + 1);
    try {
      await promesa;
      if (okMsg) avisar(okMsg);
    } catch (err) {
      avisar(err?.message || 'No se pudo guardar. Probá de nuevo.');
      await recargar();
    } finally {
      setSaving((s) => s - 1);
    }
  }, [avisar, recargar]);

  if (!D) return <p className="empty"><b>Cargando panel…</b></p>;

  const c = { disponible: 0, reservada: 0, vendida: 0, encargo: 0, val: 0 };
  D.items.forEach((i) => {
    c[i.status] = (c[i.status] || 0) + 1;
    if ((i.status === 'disponible' || i.status === 'reservada') && i.price) c.val += Number(i.price) * (i.units || 1);
  });

  const setItems = (fn) => setD((d) => ({ ...d, items: ordenar(fn(d.items)) }));
  const setCfg = (cfg) => setD((d) => ({ ...d, cfg }));

  return (
    <>
      <div className="adm-top"><div className="wrap">
        <h1>Panel admin</h1>
        <span className={'st' + (saving ? ' dirty' : '')}><i />{saving ? 'Guardando…' : 'Todo guardado'}</span>
        <a className="btn btn-line btn-sm" href="/" target="_blank" rel="noopener">Ver tienda</a>
        <button className="btn btn-line btn-sm" onClick={onSalir}>Salir</button>
      </div></div>

      <div className="wrap adm-body">
        {datos.modo === 'prueba' && (
          <div className="banner"><p><b>Modo prueba.</b> Los cambios se guardan solo en este navegador y los clientes no los ven. Para publicar la tienda de verdad, seguí los pasos de <b>LEEME.md</b>.</p></div>
        )}
        <div className="tiles">
          {[['ok', c.disponible, 'Disponibles'], ['res', c.reservada, 'Reservadas'], ['vend', c.vendida, 'Vendidas'], ['enc', c.encargo, 'A pedido']].map(([k, v, t], n) => (
            <motion.div key={k} className={'tile ' + k} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.06 }}>
              <b><Contador valor={v} /></b><span>{t}</span>
            </motion.div>
          ))}
          <motion.div className="tile val" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <b><Contador valor={c.val} formato={money} /></b><span>Valor en stock</span>
          </motion.div>
        </div>

        <div className="tabs" role="tablist">
          {[['items', 'Camisetas'], ['secs', 'Secciones'], ['set', 'Ajustes']].map(([k, t]) => (
            <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {t}
              {tab === k && <motion.span layoutId="tab-linea" className="tab-linea" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'items' && <PestCamisetas D={D} setItems={setItems} guardar={guardar} editar={setEditando} />}
            {tab === 'secs' && <PestSecciones D={D} setD={setD} setCfg={setCfg} guardar={guardar} />}
            {tab === 'set' && <PestAjustes cfg={D.cfg} setCfg={setCfg} guardar={guardar} recargar={recargar} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <FormCamiseta abierta={editando !== null} id={editando === 'nueva' ? null : editando} D={D}
        onCerrar={() => setEditando(null)}
        onGuardada={(o, nueva) => {
          setItems((its) => (nueva ? [...its, o] : its.map((x) => (x.id === o.id ? o : x))));
          setEditando(null);
          avisar(nueva ? 'Camiseta agregada' : 'Camiseta actualizada');
        }} />
    </>
  );
}

/* --- Pestaña Camisetas --- */
function PestCamisetas({ D, setItems, guardar, editar }) {
  const [aq, setAq] = useState('');
  const [ast, setAst] = useState('');
  const [armada, setArmada] = useState(null);
  const tArm = useRef();
  const q = norm(aq), filtrando = !!(aq || ast);

  const secs = D.cfg.sections.slice();
  // Camisetas con una sección que ya no existe: se muestran igual para poder moverlas
  D.items.forEach((i) => { if (!secs.includes(i.section)) secs.push(i.section); });

  const mover = (it, d) => {
    const same = D.items.filter((i) => i.section === it.section);
    const k = same.indexOf(it), otro = same[k + d];
    if (!otro) return;
    let cambios, nuevos;
    if (it.position === otro.position) {
      // Posiciones repetidas: se renumera todo para que quede prolijo
      const arr = D.items.slice(), a = arr.indexOf(it), b = arr.indexOf(otro);
      arr[a] = otro; arr[b] = it;
      nuevos = arr.map((x, n) => ({ ...x, position: n }));
      cambios = nuevos.map((x) => ({ id: x.id, position: x.position }));
    } else {
      nuevos = D.items.map((x) => (x.id === it.id ? { ...x, position: otro.position } : x.id === otro.id ? { ...x, position: it.position } : x));
      cambios = [{ id: it.id, position: otro.position }, { id: otro.id, position: it.position }];
    }
    setItems(() => nuevos);
    guardar(datos.guardarPosiciones(cambios));
  };

  const duplicar = (o) => {
    const sig = D.items[D.items.indexOf(o) + 1];
    const c = { ...o, id: nuevoId(), status: o.status === 'encargo' ? 'encargo' : 'disponible', position: sig ? (o.position + sig.position) / 2 : o.position + 1 };
    setItems((its) => [...its, c]);
    guardar(datos.guardarItem(c)).then(() => editar(c.id));
  };

  const borrar = (it) => {
    if (armada !== it.id) {
      setArmada(it.id);
      clearTimeout(tArm.current);
      tArm.current = setTimeout(() => setArmada(null), 4000);
      return;
    }
    setArmada(null);
    setItems((its) => its.filter((x) => x.id !== it.id));
    guardar(datos.borrarItem(it), 'Camiseta borrada');
  };

  const estado = (it, v) => {
    const n = { ...it, status: v };
    setItems((its) => its.map((x) => (x.id === it.id ? n : x)));
    guardar(datos.guardarItem(n), it.name + ': ' + ST[v].toLowerCase());
  };

  const grupos = secs.map((s) => {
    const all = D.items.filter((i) => i.section === s);
    const its = all.filter((i) => (!ast || i.status === ast) && (!q || norm(i.name + ' ' + i.sub + ' ' + i.code).includes(q)));
    return { s, all, its };
  }).filter((g) => g.its.length);

  return (
    <>
      <div className="tools">
        <label className="search"><span className="sr">Buscar en el stock</span><IcoBuscar />
          <input type="search" placeholder="Buscar por nombre o código" autoComplete="off" value={aq} onChange={(e) => setAq(e.target.value)} /></label>
        <select className="sel" aria-label="Filtrar por estado" value={ast} onChange={(e) => setAst(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.keys(ST).map((k) => <option key={k} value={k}>{k === 'encargo' ? 'A pedido' : ST[k] + 's'}</option>)}
        </select>
        <motion.button className="btn btn-gold" onClick={() => editar('nueva')} whileTap={{ scale: 0.95 }}>+ Nueva camiseta</motion.button>
      </div>

      {!D.items.length ? (
        <div className="empty"><b>Todavía no hay camisetas</b>Cargá la primera con su foto, talle y precio.<br />
          <button className="btn btn-gold" onClick={() => editar('nueva')}>+ Nueva camiseta</button></div>
      ) : !grupos.length ? (
        <div className="empty"><b>No hay camisetas con ese filtro</b></div>
      ) : grupos.map(({ s, all, its }) => (
        <div key={s} className="grp">
          <h3>{s} <span className="st">{its.length}</span></h3>
          <div className="rows">
            <AnimatePresence initial={false}>
              {its.map((i) => {
                const k = all.indexOf(i);
                return (
                  <motion.div key={i.id} layout className={'it-row' + (i.status === 'vendida' ? ' is-sold' : '')}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0, paddingBlock: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
                    <img src={foto(i.img)} alt="" loading="lazy" />
                    <div className="it-main">
                      <b>{i.name}{i.isNew && <> <span className="flag new">Nuevo</span></>}</b>
                      <span>{i.sub}</span>
                      <span className="meta">{i.status === 'encargo' ? 'A pedido' : 'Talle ' + i.size} · {i.price ? money(i.price) : 'Sin precio'}{i.units > 1 ? ' · ' + i.units + ' unid.' : ''}{i.code ? ' · #' + i.code : ''}{i.imgs?.length ? <span className="fotos"> · ↻ 3D ({i.imgs.length + 1} fotos)</span> : null}</span>
                    </div>
                    <select className={'sel st-sel s-' + i.status} aria-label={'Estado de ' + i.name} value={i.status} onChange={(e) => estado(i, e.target.value)}>
                      {Object.keys(ST).map((x) => <option key={x} value={x}>{ST[x]}</option>)}
                    </select>
                    <div className="it-act">
                      <button className="ib" aria-label="Subir" disabled={k === 0 || filtrando} onClick={() => mover(i, -1)}>↑</button>
                      <button className="ib" aria-label="Bajar" disabled={k === all.length - 1 || filtrando} onClick={() => mover(i, 1)}>↓</button>
                      <button className="ib" onClick={() => editar(i.id)}>Editar</button>
                      <button className="ib" onClick={() => duplicar(i)}>Duplicar</button>
                      <button className={'ib danger' + (armada === i.id ? ' armed' : '')} onClick={() => borrar(i)}>{armada === i.id ? '¿Borrar?' : 'Borrar'}</button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </>
  );
}

/* --- Pestaña Secciones --- */
function PestSecciones({ D, setD, setCfg, guardar }) {
  const avisar = useAviso();
  const [armada, setArmada] = useState(null);
  const [nueva, setNueva] = useState('');
  const secs = D.cfg.sections;
  const guardarSecs = (sections, msg) => {
    const cfg = { ...D.cfg, sections };
    setCfg(cfg);
    guardar(datos.guardarAjustes(cfg), msg);
  };

  const mover = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= secs.length) return;
    const a = secs.slice();
    [a[i], a[j]] = [a[j], a[i]];
    guardarSecs(a);
  };
  const borrar = (i) => {
    if (armada !== i) { setArmada(i); return; }
    setArmada(null);
    guardarSecs(secs.filter((_, n) => n !== i), 'Sección borrada');
  };
  const renombrar = (i, input) => {
    const viejo = secs[i], nuevo = input.value.trim();
    if (!nuevo || (nuevo !== viejo && secs.includes(nuevo))) { input.value = viejo; avisar('Ese nombre está vacío o ya existe.'); return; }
    if (nuevo === viejo) return;
    const cfg = { ...D.cfg, sections: secs.map((s) => (s === viejo ? nuevo : s)) };
    setD((d) => ({ cfg, items: d.items.map((x) => (x.section === viejo ? { ...x, section: nuevo } : x)) }));
    guardar(datos.renombrarSeccion(viejo, nuevo, cfg), 'Sección renombrada');
  };
  const agregar = (e) => {
    e.preventDefault();
    const n = nueva.trim();
    if (!n || secs.includes(n)) { avisar('Ese nombre está vacío o ya existe.'); return; }
    setNueva('');
    guardarSecs([...secs, n], 'Sección agregada');
  };

  return (
    <div className="panel">
      <p className="note" style={{ marginBottom: 14 }}>El orden de esta lista es el orden en la tienda. Para borrar una sección primero mové o borrá sus camisetas.</p>
      <div className="rows">
        <AnimatePresence initial={false}>
          {secs.map((s, i) => {
            const n = D.items.filter((x) => x.section === s).length;
            return (
              <motion.div key={s} layout className="sec-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                <label className="fld"><span className="sr">Nombre de la sección</span>
                  <input defaultValue={s} onBlur={(e) => renombrar(i, e.target)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} /></label>
                <span className="cnt">{plural(n, 'camiseta', 'camisetas')}</span>
                <div className="it-act">
                  <button className="ib" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                  <button className="ib" aria-label="Bajar" disabled={i === secs.length - 1} onClick={() => mover(i, 1)}>↓</button>
                  <button className={'ib danger' + (armada === i ? ' armed' : '')} disabled={n > 0} title={n ? 'Tiene camisetas' : undefined} onClick={() => borrar(i)}>{armada === i ? '¿Borrar?' : 'Borrar'}</button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <form className="tools" style={{ margin: '16px 0 0' }} onSubmit={agregar}>
        <label className="fld" style={{ flex: '1 1 200px' }}><span className="sr">Nueva sección</span>
          <input placeholder="Nombre de la nueva sección" value={nueva} onChange={(e) => setNueva(e.target.value)} /></label>
        <button className="btn btn-gold">+ Agregar sección</button>
      </form>
    </div>
  );
}

/* --- Pestaña Ajustes --- */
function PestAjustes({ cfg: c, setCfg, guardar, recargar }) {
  const avisar = useAviso();
  const guardarCfg = (cambio, msg) => {
    const cfg = { ...c, ...cambio };
    setCfg(cfg);
    guardar(datos.guardarAjustes(cfg), msg);
  };

  return (
    <div className="panel form">
      <label className="fld"><span>WhatsApp</span>
        <input inputMode="numeric" defaultValue={c.wa} placeholder="5493415551234" onBlur={(e) => {
          const w = e.target.value.replace(/\D/g, '');
          if (w === c.wa) return;
          if (w.length < 8) { avisar('Ese número parece incompleto.'); e.target.value = c.wa; return; }
          e.target.value = w;
          guardarCfg({ wa: w }, 'WhatsApp actualizado');
        }} />
        <small>Con código de país, sin + ni espacios.</small></label>
      <label className="fld"><span>Instagram</span>
        <input defaultValue={c.ig} placeholder="https://www.instagram.com/camisetas_futty/" onBlur={(e) => { const v = e.target.value.trim(); if (v !== c.ig) guardarCfg({ ig: v }, 'Instagram actualizado'); }} /></label>
      <label className="fld"><span>Medios de pago</span>
        <input defaultValue={c.pay} placeholder="Efectivo o transferencia" onBlur={(e) => { const v = e.target.value.trim(); if (v !== c.pay) guardarCfg({ pay: v }, 'Medios de pago actualizados'); }} />
        <small>Separalos con comas o con «o». Ej.: Efectivo, transferencia o Mercado Pago</small></label>
      <label className="chk"><input type="checkbox" checked={c.showPrices} onChange={(e) => guardarCfg({ showPrices: e.target.checked }, e.target.checked ? 'Precios visibles' : 'Precios ocultos')} /> Mostrar precios en la tienda</label>
      <label className="chk"><input type="checkbox" checked={c.showSold} onChange={(e) => guardarCfg({ showSold: e.target.checked }, 'Ajuste guardado')} /> Mostrar las vendidas en el catálogo como «Sin stock»</label>
      {datos.modo === 'prueba' && (
        <div>
          <button className="btn btn-line btn-sm" onClick={() => datos.reiniciar().then(recargar).then(() => avisar('Volviste al catálogo de ejemplo'))}>Volver al ejemplo</button>
          <small className="note" style={{ display: 'block', marginTop: 6 }}>Borra los cambios de prueba de este navegador y vuelve al catálogo original.</small>
        </div>
      )}
    </div>
  );
}
