/* Funciones compartidas por la tienda y el panel */

export const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
// "encargo" = no está en stock: se muestra abajo, en "Pedidos a encargo"
export const ESTADOS = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida', encargo: 'A pedido' };

export const money = (p) => '$' + Math.round(Number(p)).toLocaleString('es-AR');
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
export const talles = (it) => String(it.size || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);

export const enStock = (it) => it.status === 'disponible' || it.status === 'reservada';
export const esVendida = (it) => it.status === 'vendida';
export const esEncargo = (it) => it.status === 'encargo';

// Las fotos guardadas como "img/..." se sirven desde la raíz del sitio
export const foto = (src) => (!src || /^(https?:|data:|blob:|\/)/.test(src) ? src : '/' + src);

export const waNum = (cfg) => String(cfg.wa || '').replace(/\D/g, '');
export const waLink = (cfg, texto) => 'https://wa.me/' + waNum(cfg) + '?text=' + encodeURIComponent(texto);
export function waLindo(cfg) {
  const n = waNum(cfg);
  if (/^549\d{10}$/.test(n)) return '+54 9 ' + n.slice(3, 6) + ' ' + n.slice(6, 9) + '-' + n.slice(9);
  return '+' + n;
}
export function igUsuario(cfg) {
  const m = String(cfg.ig || '').match(/instagram\.com\/([^/?#]+)/i);
  return m ? '@' + m[1] : String(cfg.ig || '');
}

// localStorage protegido: si el navegador lo bloquea, no rompe nada
export function ls(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (e) { return null; }
  return null;
}
