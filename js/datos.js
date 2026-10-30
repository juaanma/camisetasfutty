/*
 * Camisetas Futty — dónde se guarda el catálogo.
 *
 * Futty.datos tiene las mismas funciones en los dos modos:
 *  - "supabase": los datos viven en Supabase y los ven todos los clientes.
 *  - "prueba":   los datos salen de js/datos-prueba.js y los cambios quedan
 *                solo en este navegador (sirve para probar sin configurar nada).
 */
(function () {
  'use strict';

  var cfg = window.FUTTY_CONFIG || {};
  var hayNube = !!(cfg.supabaseUrl && cfg.supabaseKey);
  var u = window.Futty.u;

  /* Conversión entre la base (snake_case) y la app */
  function itemDesdeFila(r) {
    return {
      id: r.id, name: r.name, sub: r.sub || '', section: r.section, size: r.size || '',
      units: r.units || 1, price: r.price == null ? null : Number(r.price), code: r.code || '',
      status: r.status, isNew: !!r.is_new, img: r.img || '', position: r.position || 0
    };
  }
  function filaDesdeItem(it) {
    return {
      id: it.id, name: it.name, sub: it.sub, section: it.section, size: it.size,
      units: it.units, price: it.price, code: it.code, status: it.status,
      is_new: it.isNew, img: it.img, position: it.position
    };
  }
  function ajustesDesdeFila(r) {
    r = r || {};
    return {
      wa: r.wa || '', ig: r.ig || '', pay: r.pay || '',
      showPrices: r.show_prices !== false, showSold: r.show_sold !== false,
      sections: r.sections || []
    };
  }
  function filaDesdeAjustes(a) {
    return {
      id: 1, wa: a.wa, ig: a.ig, pay: a.pay,
      show_prices: a.showPrices, show_sold: a.showSold, sections: a.sections
    };
  }
  function ordenar(items) {
    return items.slice().sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
  }

  /* ---------- Modo Supabase ---------- */
  function crearNube() {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('No se pudo cargar Supabase. Revisá la conexión a internet.');
    }
    var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

    function ok(res, msg) {
      if (res.error) {
        console.error(res.error);
        throw new Error(msg || 'No se pudo guardar. Probá de nuevo en unos segundos.');
      }
      return res.data;
    }

    return {
      modo: 'supabase',

      cargar: function () {
        return Promise.all([
          sb.from('ajustes').select('*').eq('id', 1).maybeSingle(),
          sb.from('items').select('*').order('position', { ascending: true })
        ]).then(function (r) {
          var a = ok(r[0], 'No se pudo cargar el catálogo.');
          var its = ok(r[1], 'No se pudo cargar el catálogo.');
          return { cfg: ajustesDesdeFila(a), items: its.map(itemDesdeFila) };
        });
      },

      usuario: function () {
        return sb.auth.getSession().then(function (r) {
          var s = r.data && r.data.session;
          if (!s) return null;
          return sb.rpc('es_admin').then(function (x) {
            return x.data === true ? s.user.email : null;
          });
        });
      },

      entrar: function (email, clave) {
        return sb.auth.signInWithPassword({ email: email, password: clave }).then(function (r) {
          if (r.error) throw new Error('El correo o la contraseña no coinciden.');
          return sb.rpc('es_admin').then(function (x) {
            if (x.data !== true) {
              return sb.auth.signOut().then(function () {
                throw new Error('Esa cuenta no tiene permiso para editar la tienda.');
              });
            }
            return r.data.user.email;
          });
        });
      },

      salir: function () { return sb.auth.signOut(); },

      guardarItem: function (it) {
        return sb.from('items').upsert(filaDesdeItem(it)).then(function (r) { ok(r); });
      },

      borrarItem: function (it) {
        return sb.from('items').delete().eq('id', it.id).then(function (r) {
          ok(r, 'No se pudo borrar. Probá de nuevo.');
          // Si la foto estaba en Supabase, también se borra (si falla, no importa)
          var m = String(it.img || '').match(/\/storage\/v1\/object\/public\/fotos\/(.+)$/);
          if (m) sb.storage.from('fotos').remove([decodeURIComponent(m[1])]).catch(function () {});
        });
      },

      guardarPosiciones: function (cambios) {
        return Promise.all(cambios.map(function (c) {
          return sb.from('items').update({ position: c.position }).eq('id', c.id);
        })).then(function (rs) { rs.forEach(function (r) { ok(r); }); });
      },

      guardarAjustes: function (a) {
        return sb.from('ajustes').upsert(filaDesdeAjustes(a)).then(function (r) { ok(r); });
      },

      renombrarSeccion: function (viejo, nuevo, a) {
        return sb.from('items').update({ section: nuevo }).eq('section', viejo).then(function (r) {
          ok(r);
          return sb.from('ajustes').upsert(filaDesdeAjustes(a)).then(function (r2) { ok(r2); });
        });
      },

      subirFoto: function (blob) {
        var ruta = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        return sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
          .then(function (r) {
            ok(r, 'No se pudo subir la foto. Probá de nuevo.');
            return sb.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
          });
      }
    };
  }

  /* ---------- Modo prueba (todo en este navegador) ---------- */
  function crearPrueba() {
    var CLAVE = 'futty-prueba-v1';

    function leer() {
      var s = u.ls(CLAVE);
      if (s) { try { return JSON.parse(s); } catch (e) { /* datos rotos: se vuelve al ejemplo */ } }
      var base = window.FUTTY_PRUEBA || { settings: { sections: [] }, items: [] };
      return JSON.parse(JSON.stringify({ cfg: base.settings, items: base.items }));
    }
    function escribir(d) {
      try { localStorage.setItem(CLAVE, JSON.stringify(d)); }
      catch (e) { throw new Error('El navegador se quedó sin espacio para el modo prueba. Usá «Volver al ejemplo» en Ajustes.'); }
    }
    function cambiar(fn) {
      return new Promise(function (res) { var d = leer(); fn(d); escribir(d); res(); });
    }

    return {
      modo: 'prueba',
      cargar: function () { var d = leer(); return Promise.resolve({ cfg: d.cfg, items: ordenar(d.items) }); },
      usuario: function () { return Promise.resolve(u.ls('futty-prueba-sesion')); },
      entrar: function (email) {
        u.ls('futty-prueba-sesion', email || 'dueño');
        return Promise.resolve(email || 'dueño');
      },
      salir: function () { u.ls('futty-prueba-sesion', null); return Promise.resolve(); },
      guardarItem: function (it) {
        return cambiar(function (d) {
          var i = d.items.findIndex(function (x) { return x.id === it.id; });
          if (i > -1) d.items[i] = it; else d.items.push(it);
        });
      },
      borrarItem: function (it) {
        return cambiar(function (d) { d.items = d.items.filter(function (x) { return x.id !== it.id; }); });
      },
      guardarPosiciones: function (cambios) {
        return cambiar(function (d) {
          cambios.forEach(function (c) {
            d.items.forEach(function (x) { if (x.id === c.id) x.position = c.position; });
          });
        });
      },
      guardarAjustes: function (a) { return cambiar(function (d) { d.cfg = a; }); },
      renombrarSeccion: function (viejo, nuevo, a) {
        return cambiar(function (d) {
          d.items.forEach(function (x) { if (x.section === viejo) x.section = nuevo; });
          d.cfg = a;
        });
      },
      subirFoto: function (blob) {
        return new Promise(function (res, rej) {
          var r = new FileReader();
          r.onload = function () { res(r.result); };
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
      },
      reiniciar: function () { u.ls(CLAVE, null); return Promise.resolve(); }
    };
  }

  window.Futty.datos = hayNube ? crearNube() : crearPrueba();
})();
