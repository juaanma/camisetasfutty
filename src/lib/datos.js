/*
 * Dónde se guarda el catálogo. Las dos opciones tienen las mismas funciones:
 *  - "supabase": los datos viven en Supabase y los ven todos los clientes.
 *  - "prueba":   los datos salen de src/data/prueba.json y los cambios quedan
 *                solo en este navegador (para probar sin configurar nada).
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import PRUEBA from '../data/prueba.json';
import { ls } from './util.js';

/* Conversión entre la base (snake_case) y la app */
const itemDesdeFila = (r) => ({
  id: r.id, name: r.name, sub: r.sub || '', section: r.section, size: r.size || '',
  units: r.units || 1, price: r.price == null ? null : Number(r.price), code: r.code || '',
  status: r.status, isNew: !!r.is_new, img: r.img || '', position: r.position || 0,
  imgs: Array.isArray(r.imgs) ? r.imgs : [] // fotos extra: espalda y detalles
});
const filaDesdeItem = (it) => ({
  id: it.id, name: it.name, sub: it.sub, section: it.section, size: it.size,
  units: it.units, price: it.price, code: it.code, status: it.status,
  is_new: it.isNew, img: it.img, position: it.position, imgs: it.imgs || []
});
const ajustesDesdeFila = (r = {}) => ({
  wa: r.wa || '', ig: r.ig || '', pay: r.pay || '',
  showPrices: r.show_prices !== false, showSold: r.show_sold !== false,
  sections: r.sections || []
});
const filaDesdeAjustes = (a) => ({
  id: 1, wa: a.wa, ig: a.ig, pay: a.pay,
  show_prices: a.showPrices, show_sold: a.showSold, sections: a.sections
});
export const ordenar = (items) => items.slice().sort((a, b) => (a.position || 0) - (b.position || 0));

/* ---------- Supabase ---------- */
function crearNube() {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const ok = (res, msg) => {
    if (res.error) {
      console.error(res.error);
      throw new Error(msg || 'No se pudo guardar. Probá de nuevo en unos segundos.');
    }
    return res.data;
  };
  const esAdmin = async () => (await sb.rpc('es_admin')).data === true;

  return {
    modo: 'supabase',

    async cargar() {
      const [a, its] = await Promise.all([
        sb.from('ajustes').select('*').eq('id', 1).maybeSingle(),
        sb.from('items').select('*').order('position', { ascending: true })
      ]);
      return {
        cfg: ajustesDesdeFila(ok(a, 'No se pudo cargar el catálogo.')),
        items: ok(its, 'No se pudo cargar el catálogo.').map(itemDesdeFila)
      };
    },

    async usuario() {
      const s = (await sb.auth.getSession()).data?.session;
      if (!s) return null;
      return (await esAdmin()) ? s.user.email : null;
    },

    async entrar(email, clave) {
      const r = await sb.auth.signInWithPassword({ email, password: clave });
      if (r.error) throw new Error('El correo o la contraseña no coinciden.');
      if (!(await esAdmin())) {
        await sb.auth.signOut();
        throw new Error('Esa cuenta no tiene permiso para editar la tienda.');
      }
      return r.data.user.email;
    },

    salir: () => sb.auth.signOut(),

    async guardarItem(it) {
      const fila = filaDesdeItem(it);
      let r = await sb.from('items').upsert(fila);
      // Si la base todavía no tiene la columna de fotos extra, se guarda igual sin ellas
      if (r.error && /imgs/.test(r.error.message || '')) {
        if (fila.imgs.length) throw new Error('Para guardar más fotos falta actualizar la base: corré en Supabase la línea de «imgs» que está en supabase/setup.sql.');
        delete fila.imgs;
        r = await sb.from('items').upsert(fila);
      }
      ok(r);
    },

    async borrarItem(it) {
      ok(await sb.from('items').delete().eq('id', it.id), 'No se pudo borrar. Probá de nuevo.');
      // Si las fotos estaban en Supabase, también se borran (si falla, no importa)
      const rutas = [it.img, ...(it.imgs || [])].map((u) => String(u || '').match(/\/storage\/v1\/object\/public\/fotos\/(.+)$/)).filter(Boolean).map((m) => decodeURIComponent(m[1]));
      if (rutas.length) sb.storage.from('fotos').remove(rutas).catch(() => {});
    },

    async guardarPosiciones(cambios) {
      const rs = await Promise.all(cambios.map((c) => sb.from('items').update({ position: c.position }).eq('id', c.id)));
      rs.forEach((r) => ok(r));
    },

    async guardarAjustes(a) { ok(await sb.from('ajustes').upsert(filaDesdeAjustes(a))); },

    async renombrarSeccion(viejo, nuevo, a) {
      ok(await sb.from('items').update({ section: nuevo }).eq('section', viejo));
      ok(await sb.from('ajustes').upsert(filaDesdeAjustes(a)));
    },

    async subirFoto(blob) {
      const ruta = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
      ok(await sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }),
        'No se pudo subir la foto. Probá de nuevo.');
      return sb.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
    }
  };
}

/* ---------- Modo prueba (todo en este navegador) ---------- */
function crearPrueba() {
  const CLAVE = 'futty-prueba-v1';
  const leer = () => {
    const s = ls(CLAVE);
    if (s) { try { return JSON.parse(s); } catch (e) { /* datos rotos: se vuelve al ejemplo */ } }
    return JSON.parse(JSON.stringify({ cfg: PRUEBA.settings, items: PRUEBA.items }));
  };
  const escribir = (d) => {
    try { localStorage.setItem(CLAVE, JSON.stringify(d)); }
    catch (e) { throw new Error('El navegador se quedó sin espacio para el modo prueba. Usá «Volver al ejemplo» en Ajustes.'); }
  };
  const cambiar = async (fn) => { const d = leer(); fn(d); escribir(d); };

  return {
    modo: 'prueba',
    cargar: async () => { const d = leer(); return { cfg: d.cfg, items: ordenar(d.items) }; },
    usuario: async () => ls('futty-prueba-sesion'),
    entrar: async (email) => { ls('futty-prueba-sesion', email || 'dueño'); return email || 'dueño'; },
    salir: async () => { ls('futty-prueba-sesion', null); },
    guardarItem: (it) => cambiar((d) => {
      const i = d.items.findIndex((x) => x.id === it.id);
      if (i > -1) d.items[i] = it; else d.items.push(it);
    }),
    borrarItem: (it) => cambiar((d) => { d.items = d.items.filter((x) => x.id !== it.id); }),
    guardarPosiciones: (cambios) => cambiar((d) => {
      cambios.forEach((c) => d.items.forEach((x) => { if (x.id === c.id) x.position = c.position; }));
    }),
    guardarAjustes: (a) => cambiar((d) => { d.cfg = a; }),
    renombrarSeccion: (viejo, nuevo, a) => cambiar((d) => {
      d.items.forEach((x) => { if (x.section === viejo) x.section = nuevo; });
      d.cfg = a;
    }),
    subirFoto: (blob) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    }),
    reiniciar: async () => { ls(CLAVE, null); }
  };
}

export const datos = SUPABASE_URL && SUPABASE_KEY ? crearNube() : crearPrueba();
