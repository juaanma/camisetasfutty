/* Formulario para agregar o editar una camiseta */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { datos } from '../lib/datos.js';
import { ESTADOS as ST, TALLES, foto, talles } from '../lib/util.js';
import { IcoX } from '../lib/iconos.jsx';
import { Ventana } from '../lib/ui.jsx';

const nuevoId = () => 'i' + Date.now() + Math.random().toString(36).slice(2, 5);

export default function FormCamiseta({ abierta, id, D, onCerrar, onGuardada }) {
  return (
    <Ventana abierta={abierta} onCerrar={onCerrar} etiqueta={id ? 'Editar camiseta' : 'Nueva camiseta'}>
      {abierta && <Form key={id || 'nueva'} id={id} D={D} onCerrar={onCerrar} onGuardada={onGuardada} />}
    </Ventana>
  );
}

function Form({ id, D, onCerrar, onGuardada }) {
  const old = id ? D.items.find((x) => x.id === id) : null;
  const base = old || { name: '', sub: '', section: D.cfg.sections[0] || '', size: '', units: 1, price: null, code: '', status: 'disponible', isNew: true, img: '' };
  const secs = D.cfg.sections.slice();
  if (base.section && !secs.includes(base.section)) secs.push(base.section);

  const [f, setF] = useState({
    name: base.name, sub: base.sub, section: base.section, status: base.status,
    sel: talles(base).filter((z) => TALLES.includes(z)),
    otro: String(base.size || '').split(/\s*\/\s*/).filter((z) => z && !TALLES.includes(z.toUpperCase())).join(' / '),
    price: base.price || '', units: base.units || 1, code: base.code, isNew: base.isNew
  });
  const [img, setImg] = useState(null); // { blob, url } de la foto nueva
  // Fotos extra (la primera es la espalda): { src } guardada o { blob, url } nueva
  const [extras, setExtras] = useState(() => (old?.imgs || []).map((src) => ({ src })));
  const sumarExtras = async (files) => {
    const imgs = [...files].filter((x) => /^image\//.test(x.type));
    if (!imgs.length) return;
    setErr('Procesando fotos…');
    try {
      const nuevas = await Promise.all(imgs.map(async (x) => { const blob = await fotoCuadrada(x); return { blob, url: URL.createObjectURL(blob) }; }));
      setExtras((e) => [...e, ...nuevas]);
      setErr('');
    } catch (e) { setErr('No pudimos leer alguna de las fotos. Probá con otra.'); }
  };
  const moverExtra = (i, d) => setExtras((e) => {
    const a = e.slice(), j = i + d;
    if (j < 0 || j >= a.length) return e;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  });
  const [err, setErr] = useState('');
  const [sobre, setSobre] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const tomarFoto = (file) => {
    if (!/^image\//.test(file.type)) { setErr('Ese archivo no es una imagen. Probá con JPG, PNG o WEBP.'); return; }
    setErr('Procesando foto…');
    fotoCuadrada(file).then((blob) => { setImg({ blob, url: URL.createObjectURL(blob) }); setErr(''); },
      () => setErr('No pudimos leer esa foto. Probá con otra.'));
  };

  // Pegar una foto con Ctrl+V mientras está abierto el formulario
  useEffect(() => {
    const pegar = (e) => {
      const file = e.clipboardData?.files?.[0];
      if (file) { e.preventDefault(); tomarFoto(file); }
    };
    document.addEventListener('paste', pegar);
    return () => document.removeEventListener('paste', pegar);
  }, []);

  if (!secs.length) {
    return <div className="md-b"><p>Primero creá una sección en la pestaña «Secciones».</p><button className="btn btn-line" onClick={onCerrar}>Cerrar</button></div>;
  }

  const guardar = async () => {
    const size = f.sel.concat(f.otro.trim() ? [f.otro.trim()] : []).join(' / ');
    const esEnc = f.status === 'encargo';
    const e = !f.name.trim() ? 'Falta el nombre del equipo o modelo.' : !size && !esEnc ? 'Elegí al menos un talle.' : !(img || (old && old.img)) ? 'Falta la foto.' : '';
    if (e) { setErr(e); return; }
    const o = {
      id: old ? old.id : nuevoId(),
      name: f.name.trim(), sub: f.sub.trim(), section: f.section, size,
      units: Math.max(1, parseInt(f.units, 10) || 1),
      price: String(f.price).trim() ? Math.max(0, Math.round(Number(f.price))) : null,
      code: String(f.code || '').trim().replace(/^#/, ''), status: f.status, isNew: f.isNew,
      img: old ? old.img : '',
      position: old ? old.position : (D.items.length ? Math.min(...D.items.map((x) => x.position)) - 1 : 0)
    };
    setGuardando(true);
    setErr(img ? 'Subiendo foto…' : 'Guardando…');
    try {
      if (img) o.img = await datos.subirFoto(img.blob);
      o.imgs = await Promise.all(extras.map((x) => (x.blob ? datos.subirFoto(x.blob) : x.src)));
      await datos.guardarItem(o);
      onGuardada(o, !old);
    } catch (x) {
      setGuardando(false);
      setErr(x?.message || 'No se pudo guardar. Probá de nuevo.');
    }
  };

  const prev = img ? img.url : old?.img ? foto(old.img) : '';

  return (
    <>
      <div className="md-h"><h3>{old ? 'Editar camiseta' : 'Nueva camiseta'}</h3><button className="x" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button></div>
      <form className="md-b form" noValidate onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <div className={'drop' + (sobre ? ' over' : '')}
          onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); const file = e.dataTransfer.files[0]; if (file) tomarFoto(file); }}>
          {prev ? <motion.img key={prev} src={prev} alt="" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} /> : <div className="ph0">Sin foto</div>}
          <div>
            <label className="btn btn-line btn-sm">{prev ? 'Cambiar foto' : 'Elegir foto'}
              <input type="file" accept="image/*" className="sr" onChange={(e) => { if (e.target.files[0]) tomarFoto(e.target.files[0]); }} /></label>
            <p>También podés arrastrar o pegar la foto. Se recorta cuadrada.</p>
          </div>
        </div>
        <div className="fld">
          <span>Más fotos para la vista 3D (opcional)</span>
          <div className="extras">
            {extras.map((x, i) => (
              <motion.div key={x.src || x.url} className="extra" layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <img src={x.url || foto(x.src)} alt="" />
                <b>{i === 0 ? 'Espalda' : 'Detalle ' + i}</b>
                <div className="extra-act">
                  <button type="button" className="ib" aria-label="Mover antes" disabled={i === 0} onClick={() => moverExtra(i, -1)}>←</button>
                  <button type="button" className="ib" aria-label="Mover después" disabled={i === extras.length - 1} onClick={() => moverExtra(i, 1)}>→</button>
                  <button type="button" className="ib danger" aria-label="Quitar foto" onClick={() => setExtras((e) => e.filter((_, n) => n !== i))}>✕</button>
                </div>
              </motion.div>
            ))}
            <label className="extra extra-add">
              <span>＋</span><b>{extras.length ? 'Agregar' : 'Agregar espalda'}</b>
              <input type="file" accept="image/*" multiple className="sr" onChange={(e) => { sumarExtras(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
          <small>La primera es la <b>espalda</b> y las demás son detalles (escudo, número, etiqueta). En la tienda el cliente la gira en 3D para verlas.</small>
        </div>
        <label className="fld"><span>Equipo o modelo</span><input value={f.name} onChange={set('name')} placeholder="Ej. Barcelona" data-autofocus /></label>
        <label className="fld"><span>Detalle</span><input value={f.sub} onChange={set('sub')} placeholder="Ej. Home 2014/15 · Neymar" /></label>
        <div className="two">
          <label className="fld"><span>Sección</span><select value={f.section} onChange={set('section')}>{secs.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="fld"><span>Estado</span><select value={f.status} onChange={set('status')}>{Object.keys(ST).map((k) => <option key={k} value={k}>{ST[k]}</option>)}</select></label>
        </div>
        <p className="note">Elegí <b>«A pedido»</b> para las camisetas que se encargan: aparecen abajo de todo, en «Pedidos a encargo», dentro de la categoría de su sección. Para esas, el talle es opcional.</p>
        <div className="fld"><span>Talle</span>
          <div className="sizes">{TALLES.map((t) => {
            const on = f.sel.includes(t);
            return (
              <motion.button type="button" key={t} className={'chip' + (on ? ' on' : '')} aria-pressed={on} whileTap={{ scale: 0.9 }}
                onClick={() => setF((x) => ({ ...x, sel: on ? x.sel.filter((z) => z !== t) : TALLES.filter((z) => z === t || x.sel.includes(z)) }))}>
                {on && <motion.span className="chip-fondo" initial={{ scale: 0 }} animate={{ scale: 1 }} />}{t}
              </motion.button>
            );
          })}</div>
        </div>
        <label className="fld"><span>Otro talle (opcional)</span><input value={f.otro} onChange={set('otro')} placeholder="Ej. 12 años" /></label>
        <div className="two">
          <label className="fld"><span>Precio</span><input type="number" inputMode="numeric" min="0" step="100" value={f.price} onChange={set('price')} placeholder="Vacío = precio por WhatsApp" /></label>
          <label className="fld"><span>Unidades</span><input type="number" inputMode="numeric" min="1" value={f.units} onChange={set('units')} /></label>
        </div>
        <label className="fld"><span>Código interno (opcional)</span><input value={f.code} onChange={set('code')} placeholder="Ej. 0230" /></label>
        <label className="chk"><input type="checkbox" checked={f.isNew} onChange={set('isNew')} /> Mostrar etiqueta «Nuevo»</label>
        {err && <p className="err" role="alert">{err}</p>}
        <button type="submit" hidden />
      </form>
      <div className="md-f">
        <button className="btn btn-line" onClick={onCerrar}>Cancelar</button>
        <motion.button className="btn btn-gold" disabled={guardando} onClick={guardar} whileTap={{ scale: 0.95 }}>{old ? 'Guardar camiseta' : 'Agregar camiseta'}</motion.button>
      </div>
    </>
  );
}

// Recorta la foto al centro, cuadrada, hasta 860 px, en JPG liviano
function fotoCuadrada(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(im.width, im.height), N = Math.min(860, s);
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, N, N);
      x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, N, N);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej()), 'image/jpeg', 0.82);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(); };
    im.src = url;
  });
}
