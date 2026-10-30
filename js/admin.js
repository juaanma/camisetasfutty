/* Camisetas Futty — panel admin del dueño */
(function () {
  'use strict';

  var u = window.Futty.u, $ = u.$, esc = u.esc, money = u.money, plural = u.plural, I = u.I;
  var db = window.Futty.datos;
  var ST = u.ESTADOS;
  var app = $('#app');

  var D = { cfg: { sections: [] }, items: [] };
  var S = { user: null, tab: 'items', aq: '', ast: '', armed: null, saving: 0, edImg: null };

  function byId(id) { for (var i = 0; i < D.items.length; i++) if (D.items[i].id === id) return D.items[i]; return null; }
  function ordenar() { D.items.sort(function (a, b) { return a.position - b.position; }); }
  function nuevoId() { return 'i' + Date.now() + Math.random().toString(36).slice(2, 5); }

  /* Guarda en la base. Si falla, avisa y recarga lo que hay guardado de verdad. */
  function guardar(promesa, okMsg) {
    S.saving++;
    pintarEstado();
    return promesa.then(function () {
      S.saving--;
      pintarEstado();
      if (okMsg) u.toast(okMsg);
    }, function (err) {
      S.saving--;
      u.toast(err && err.message ? err.message : 'No se pudo guardar. Probá de nuevo.');
      return db.cargar().then(function (d) { D = d; render(); });
    });
  }

  /* ---------- Entrar ---------- */
  function renderLogin(msg) {
    var prueba = db.modo === 'prueba';
    app.innerHTML =
      '<main class="login"><form class="login-box form" id="login" novalidate>' +
        '<img class="logo" src="img/logo.png" alt="Camisetas Futty" width="1000" height="236">' +
        '<h1>Panel admin</h1>' +
        (prueba
          ? '<p class="note">Estás en <b>modo prueba</b>: entrás con cualquier correo y contraseña, y los cambios quedan solo en esta computadora.</p>'
          : '<p class="note">Entrá con el correo y la contraseña del dueño.</p>') +
        '<label class="fld"><span>Correo</span><input id="l-email" type="email" autocomplete="username" required data-autofocus></label>' +
        '<label class="fld"><span>Contraseña</span><input id="l-pass" type="password" autocomplete="current-password" required></label>' +
        '<p class="err" id="l-err" role="alert">' + esc(msg || '') + '</p>' +
        '<button class="btn btn-gold" id="l-btn">Entrar</button>' +
        '<a class="back" href="index.html">← Volver a la tienda</a>' +
      '</form></main>';
    $('#l-email').focus();
  }

  function entrar(e) {
    e.preventDefault();
    var email = $('#l-email').value.trim(), pass = $('#l-pass').value, err = $('#l-err'), btn = $('#l-btn');
    if (db.modo !== 'prueba' && (!email || !pass)) { err.textContent = 'Completá el correo y la contraseña.'; return; }
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    err.textContent = '';
    db.entrar(email, pass).then(function (user) {
      S.user = user;
      return cargarPanel();
    }).catch(function (x) {
      btn.disabled = false;
      btn.textContent = 'Entrar';
      err.textContent = x && x.message ? x.message : 'No se pudo entrar. Probá de nuevo.';
    });
  }

  function cargarPanel() {
    return db.cargar().then(function (d) { D = d; ordenar(); render(); });
  }

  /* ---------- Panel ---------- */
  function counts() {
    var c = { disponible: 0, reservada: 0, vendida: 0, val: 0 };
    D.items.forEach(function (i) {
      c[i.status] = (c[i.status] || 0) + 1;
      if (i.status !== 'vendida' && i.price) c.val += Number(i.price) * (i.units || 1);
    });
    return c;
  }

  function pintarEstado() {
    var e = $('#st');
    if (!e) return;
    e.className = 'st' + (S.saving ? ' dirty' : '');
    e.innerHTML = '<i></i>' + (S.saving ? 'Guardando…' : 'Todo guardado');
  }

  function render() {
    var c = counts();
    app.innerHTML =
      '<div class="adm-top"><div class="wrap"><h1>Panel admin</h1>' +
        '<span id="st" class="st"></span>' +
        '<a class="btn btn-line btn-sm" href="index.html" target="_blank" rel="noopener">Ver tienda</a>' +
        '<button class="btn btn-line btn-sm" data-act="salir">Salir</button>' +
      '</div></div>' +
      '<div class="wrap adm-body">' +
        (db.modo === 'prueba' ? '<div class="banner"><p><b>Modo prueba.</b> Los cambios se guardan solo en este navegador y los clientes no los ven. Para publicar la tienda de verdad, seguí los pasos de <b>LEEME.md</b>.</p></div>' : '') +
        '<div class="tiles">' +
          '<div class="tile ok"><b>' + c.disponible + '</b><span>Disponibles</span></div>' +
          '<div class="tile res"><b>' + c.reservada + '</b><span>Reservadas</span></div>' +
          '<div class="tile vend"><b>' + c.vendida + '</b><span>Vendidas</span></div>' +
          '<div class="tile val"><b>' + money(c.val) + '</b><span>Valor en stock</span></div>' +
        '</div>' +
        '<div class="tabs" role="tablist">' + [['items', 'Camisetas'], ['secs', 'Secciones'], ['set', 'Ajustes']].map(function (t) {
          return '<button class="tab" role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>';
        }).join('') + '</div>' +
        '<div id="pane"></div>' +
      '</div>';
    pintarEstado();
    if (S.tab === 'items') paneItems();
    else if (S.tab === 'secs') paneSecs();
    else paneSet();
  }

  /* --- Pestaña Camisetas --- */
  function paneItems() {
    $('#pane').innerHTML =
      '<div class="tools"><label class="search"><span class="sr">Buscar en el stock</span>' + I.search + '<input id="aq" type="search" placeholder="Buscar por nombre o código" autocomplete="off"></label>' +
      '<select class="sel" id="ast" aria-label="Filtrar por estado"><option value="">Todos los estados</option>' + Object.keys(ST).map(function (k) {
        return '<option value="' + k + '"' + (S.ast === k ? ' selected' : '') + '>' + ST[k] + 's</option>';
      }).join('') + '</select>' +
      '<button class="btn btn-gold" data-act="new">+ Nueva camiseta</button></div><div id="alist"></div>';
    var q = $('#aq');
    q.value = S.aq;
    q.addEventListener('input', function () { S.aq = q.value; listItems(); });
    $('#ast').addEventListener('change', function (e) { S.ast = e.target.value; listItems(); });
    listItems();
  }

  function listItems() {
    var q = u.norm(S.aq), h = '', filtrando = !!(S.aq || S.ast);
    var secs = D.cfg.sections.slice();
    // Camisetas con una sección que ya no existe: se muestran igual para poder moverlas
    D.items.forEach(function (i) { if (secs.indexOf(i.section) < 0) secs.push(i.section); });
    secs.forEach(function (s) {
      var all = D.items.filter(function (i) { return i.section === s; });
      var its = all.filter(function (i) {
        return (!S.ast || i.status === S.ast) && (!q || u.norm(i.name + ' ' + i.sub + ' ' + i.code).indexOf(q) > -1);
      });
      if (!its.length) return;
      h += '<div class="grp"><h3>' + esc(s) + ' <span class="st">' + its.length + '</span></h3><div class="rows">' + its.map(function (i) {
        var k = all.indexOf(i);
        return '<div class="it-row' + (i.status === 'vendida' ? ' is-sold' : '') + '">' +
          '<img src="' + esc(i.img) + '" alt="" loading="lazy">' +
          '<div class="it-main"><b>' + esc(i.name) + (i.isNew ? ' <span class="flag new">Nuevo</span>' : '') + '</b><span>' + esc(i.sub) + '</span>' +
            '<span class="meta">Talle ' + esc(i.size) + ' · ' + (i.price ? money(i.price) : 'Sin precio') + (i.units > 1 ? ' · ' + i.units + ' unid.' : '') + (i.code ? ' · #' + esc(i.code) : '') + '</span></div>' +
          '<select class="sel st-sel s-' + i.status + '" data-st="' + esc(i.id) + '" aria-label="Estado de ' + esc(i.name) + '">' + Object.keys(ST).map(function (x) {
            return '<option value="' + x + '"' + (i.status === x ? ' selected' : '') + '>' + ST[x] + '</option>';
          }).join('') + '</select>' +
          '<div class="it-act">' +
            '<button class="ib" data-mv="' + esc(i.id) + '" data-d="-1" aria-label="Subir"' + (k === 0 || filtrando ? ' disabled' : '') + '>↑</button>' +
            '<button class="ib" data-mv="' + esc(i.id) + '" data-d="1" aria-label="Bajar"' + (k === all.length - 1 || filtrando ? ' disabled' : '') + '>↓</button>' +
            '<button class="ib" data-edit="' + esc(i.id) + '">Editar</button>' +
            '<button class="ib" data-dup="' + esc(i.id) + '">Duplicar</button>' +
            '<button class="ib danger' + (S.armed === i.id ? ' armed' : '') + '" data-del="' + esc(i.id) + '">' + (S.armed === i.id ? '¿Borrar?' : 'Borrar') + '</button>' +
          '</div></div>';
      }).join('') + '</div></div>';
    });
    if (!D.items.length) {
      h = '<div class="empty"><b>Todavía no hay camisetas</b>Cargá la primera con su foto, talle y precio.<br><button class="btn btn-gold" data-act="new">+ Nueva camiseta</button></div>';
    }
    $('#alist').innerHTML = h || '<div class="empty"><b>No hay camisetas con ese filtro</b></div>';
  }

  function moverItem(id, d) {
    var it = byId(id);
    var same = D.items.filter(function (i) { return i.section === it.section; });
    var k = same.indexOf(it), otro = same[k + d];
    if (!otro) return;
    var cambios;
    if (it.position === otro.position) {
      // Posiciones repetidas: se renumera todo para que quede prolijo
      var a = D.items.indexOf(it), b = D.items.indexOf(otro);
      D.items[a] = otro; D.items[b] = it;
      cambios = D.items.map(function (x, n) { x.position = n; return { id: x.id, position: n }; });
    } else {
      var p = it.position;
      it.position = otro.position;
      otro.position = p;
      cambios = [{ id: it.id, position: it.position }, { id: otro.id, position: otro.position }];
    }
    ordenar();
    listItems();
    guardar(db.guardarPosiciones(cambios));
  }

  function duplicar(id) {
    var o = byId(id), c = JSON.parse(JSON.stringify(o));
    var sig = D.items[D.items.indexOf(o) + 1];
    c.id = nuevoId();
    c.status = 'disponible';
    c.position = sig ? (o.position + sig.position) / 2 : o.position + 1;
    D.items.push(c);
    ordenar();
    render();
    guardar(db.guardarItem(c)).then(function () { editItem(c.id); });
  }

  function borrar(id) {
    if (S.armed !== id) {
      S.armed = id;
      listItems();
      setTimeout(function () { if (S.armed === id) { S.armed = null; if (S.tab === 'items' && $('#alist')) listItems(); } }, 4000);
      return;
    }
    S.armed = null;
    var it = byId(id);
    D.items = D.items.filter(function (i) { return i.id !== id; });
    render();
    guardar(db.borrarItem(it), 'Camiseta borrada');
  }

  function cambiarEstado(id, valor) {
    var it = byId(id);
    it.status = valor;
    render();
    guardar(db.guardarItem(it), it.name + ': ' + ST[valor].toLowerCase());
  }

  /* --- Formulario de camiseta --- */
  function sizeChips(sel) {
    return u.TALLES.map(function (t) {
      return '<button type="button" class="chip" data-tsz="' + t + '" aria-pressed="' + (sel.indexOf(t) > -1) + '">' + t + '</button>';
    }).join('');
  }

  function editItem(id) {
    var it = byId(id) || { id: null, name: '', sub: '', section: D.cfg.sections[0] || '', size: '', units: 1, price: null, code: '', status: 'disponible', isNew: true, img: '' };
    var sel = u.talles(it).filter(function (z) { return u.TALLES.indexOf(z) > -1; });
    var otro = String(it.size || '').split(/\s*\/\s*/).filter(function (z) { return z && u.TALLES.indexOf(z.toUpperCase()) < 0; }).join(' / ');
    var secs = D.cfg.sections.slice();
    if (it.section && secs.indexOf(it.section) < 0) secs.push(it.section);
    S.edImg = null;
    if (!secs.length) { u.toast('Primero creá una sección en la pestaña «Secciones».'); return; }

    u.abrirModal('<div class="md-h"><h3 id="et">' + (it.id ? 'Editar camiseta' : 'Nueva camiseta') + '</h3><button class="x" data-act="close" aria-label="Cerrar">' + I.x + '</button></div>' +
      '<form id="edform" class="md-b form" novalidate>' +
        '<div class="drop" id="drop">' + (it.img ? '<img id="e-prev" src="' + esc(it.img) + '" alt="">' : '<div class="ph0" id="e-prev">Sin foto</div>') +
          '<div><label class="btn btn-line btn-sm" for="e-file">' + (it.img ? 'Cambiar foto' : 'Elegir foto') + '</label><input id="e-file" type="file" accept="image/*" class="sr">' +
          '<p>También podés arrastrar o pegar la foto. Se recorta cuadrada.</p></div></div>' +
        '<label class="fld"><span>Equipo o modelo</span><input id="e-name" value="' + esc(it.name) + '" placeholder="Ej. Barcelona" data-autofocus></label>' +
        '<label class="fld"><span>Detalle</span><input id="e-sub" value="' + esc(it.sub) + '" placeholder="Ej. Home 2014/15 · Neymar"></label>' +
        '<div class="two"><label class="fld"><span>Sección</span><select id="e-sec">' + secs.map(function (s) {
          return '<option' + (s === it.section ? ' selected' : '') + '>' + esc(s) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="fld"><span>Estado</span><select id="e-st">' + Object.keys(ST).map(function (k) {
          return '<option value="' + k + '"' + (it.status === k ? ' selected' : '') + '>' + ST[k] + '</option>';
        }).join('') + '</select></label></div>' +
        '<div class="fld"><span>Talle</span><div class="sizes" id="e-sizes">' + sizeChips(sel) + '</div></div>' +
        '<label class="fld"><span>Otro talle (opcional)</span><input id="e-other" value="' + esc(otro) + '" placeholder="Ej. 12 años"></label>' +
        '<div class="two"><label class="fld"><span>Precio</span><input id="e-price" type="number" inputmode="numeric" min="0" step="100" value="' + (it.price || '') + '" placeholder="Vacío = precio por WhatsApp"></label>' +
        '<label class="fld"><span>Unidades</span><input id="e-units" type="number" inputmode="numeric" min="1" value="' + (it.units || 1) + '"></label></div>' +
        '<label class="fld"><span>Código interno (opcional)</span><input id="e-code" value="' + esc(it.code) + '" placeholder="Ej. 0230"></label>' +
        '<label class="chk"><input type="checkbox" id="e-new"' + (it.isNew ? ' checked' : '') + '> Mostrar etiqueta «Nuevo»</label>' +
        '<p class="err" id="e-err" role="alert"></p>' +
      '</form>' +
      '<div class="md-f"><button class="btn btn-line" data-act="close">Cancelar</button><button class="btn btn-gold" id="e-save" data-act="edsave" data-id="' + esc(it.id || '') + '">' + (it.id ? 'Guardar camiseta' : 'Agregar camiseta') + '</button></div>',
      '', { labelledby: 'et', onClose: function () { S.edImg = null; } });

    var drop = $('#drop');
    $('#e-file').addEventListener('change', function (e) { if (e.target.files[0]) tomarFoto(e.target.files[0]); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('over');
      var f = e.dataTransfer.files[0];
      if (f) tomarFoto(f);
    });
    $('#edform').addEventListener('submit', function (e) { e.preventDefault(); });
  }

  function tomarFoto(file) {
    var err = $('#e-err');
    if (!/^image\//.test(file.type)) { err.textContent = 'Ese archivo no es una imagen. Probá con JPG, PNG o WEBP.'; return; }
    err.textContent = 'Procesando foto…';
    fotoCuadrada(file).then(function (blob) {
      S.edImg = blob;
      var p = $('#e-prev');
      if (p.tagName !== 'IMG') { var im = document.createElement('img'); im.id = 'e-prev'; im.alt = ''; p.replaceWith(im); p = im; }
      p.src = URL.createObjectURL(blob);
      err.textContent = '';
    }, function () { err.textContent = 'No pudimos leer esa foto. Probá con otra.'; });
  }

  // Recorta la foto al centro, cuadrada, hasta 860 px, en JPG liviano
  function fotoCuadrada(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(im.width, im.height), N = Math.min(860, s);
        var c = document.createElement('canvas');
        c.width = c.height = N;
        var x = c.getContext('2d');
        x.fillStyle = '#fff';
        x.fillRect(0, 0, N, N);
        x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, N, N);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { if (b) res(b); else rej(); }, 'image/jpeg', 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(); };
      im.src = url;
    });
  }

  function guardarItem(id) {
    var old = byId(id), v = function (k) { return $('#' + k).value.trim(); };
    var sel = [].map.call(document.querySelectorAll('#e-sizes [aria-pressed="true"]'), function (b) { return b.dataset.tsz; });
    var otro = v('e-other'), size = sel.concat(otro ? [otro] : []).join(' / ');
    var err = !v('e-name') ? 'Falta el nombre del equipo o modelo.' : !size ? 'Elegí al menos un talle.' : !(S.edImg || (old && old.img)) ? 'Falta la foto.' : '';
    var errEl = $('#e-err'), btn = $('#e-save');
    if (err) { errEl.textContent = err; return; }

    var o = {
      id: old ? old.id : nuevoId(),
      name: v('e-name'), sub: v('e-sub'), section: $('#e-sec').value, size: size,
      units: Math.max(1, parseInt(v('e-units'), 10) || 1),
      price: v('e-price') ? Math.max(0, Math.round(Number(v('e-price')))) : null,
      code: v('e-code').replace(/^#/, ''), status: $('#e-st').value, isNew: $('#e-new').checked,
      img: old ? old.img : '',
      position: old ? old.position : (D.items.length ? D.items[0].position - 1 : 0)
    };

    btn.disabled = true;
    errEl.textContent = S.edImg ? 'Subiendo foto…' : 'Guardando…';
    var subir = S.edImg ? db.subirFoto(S.edImg) : Promise.resolve(o.img);
    subir.then(function (url) {
      o.img = url;
      return db.guardarItem(o);
    }).then(function () {
      if (old) D.items[D.items.indexOf(old)] = o; else D.items.push(o);
      ordenar();
      u.cerrarModal();
      render();
      u.toast(old ? 'Camiseta actualizada' : 'Camiseta agregada');
    }).catch(function (x) {
      btn.disabled = false;
      errEl.textContent = x && x.message ? x.message : 'No se pudo guardar. Probá de nuevo.';
    });
  }

  /* --- Pestaña Secciones --- */
  function paneSecs() {
    $('#pane').innerHTML = '<div class="panel"><p class="note" style="margin-bottom:14px">El orden de esta lista es el orden en la tienda. Para borrar una sección primero mové o borrá sus camisetas.</p><div class="rows">' +
      D.cfg.sections.map(function (s, i) {
        var n = D.items.filter(function (x) { return x.section === s; }).length, k = 's' + i;
        return '<div class="sec-row"><label class="fld"><span class="sr">Nombre de la sección</span><input data-ren="' + i + '" value="' + esc(s) + '"></label>' +
          '<span class="cnt">' + plural(n, 'camiseta', 'camisetas') + '</span>' +
          '<div class="it-act">' +
            '<button class="ib" data-smv="' + i + '" data-d="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button class="ib" data-smv="' + i + '" data-d="1" aria-label="Bajar"' + (i === D.cfg.sections.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button class="ib danger' + (S.armed === k ? ' armed' : '') + '" data-sdel="' + i + '"' + (n ? ' disabled title="Tiene camisetas"' : '') + '>' + (S.armed === k ? '¿Borrar?' : 'Borrar') + '</button>' +
          '</div></div>';
      }).join('') +
      '</div><form id="addsec" class="tools" style="margin:16px 0 0"><label class="fld" style="flex:1 1 200px"><span class="sr">Nueva sección</span><input id="newsec" placeholder="Nombre de la nueva sección"></label><button class="btn btn-gold">+ Agregar sección</button></form></div>';
  }

  /* --- Pestaña Ajustes --- */
  function paneSet() {
    var c = D.cfg;
    $('#pane').innerHTML = '<div class="panel form">' +
      '<label class="fld"><span>WhatsApp</span><input id="set-wa" inputmode="numeric" value="' + esc(c.wa) + '" placeholder="5493415551234"><small>Con código de país, sin + ni espacios. Ahora: ' + esc(u.waLindo(c)) + '</small></label>' +
      '<label class="fld"><span>Instagram</span><input id="set-ig" value="' + esc(c.ig) + '" placeholder="https://www.instagram.com/camisetas_futty/"></label>' +
      '<label class="fld"><span>Medios de pago</span><input id="set-pay" value="' + esc(c.pay) + '" placeholder="Efectivo o transferencia"><small>Separalos con comas o con «o». Ej.: Efectivo, transferencia o Mercado Pago</small></label>' +
      '<label class="chk"><input type="checkbox" id="set-prices"' + (c.showPrices ? ' checked' : '') + '> Mostrar precios en la tienda</label>' +
      '<label class="chk"><input type="checkbox" id="set-sold"' + (c.showSold ? ' checked' : '') + '> Mostrar la sección «Ya vendidas»</label>' +
      (db.modo === 'prueba' ? '<div><button class="btn btn-line btn-sm" data-act="reset">Volver al ejemplo</button><small class="note" style="display:block;margin-top:6px">Borra los cambios de prueba de este navegador y vuelve al catálogo original.</small></div>' : '') +
      '</div>';
  }

  function guardarAjustes(msg) { return guardar(db.guardarAjustes(D.cfg), msg); }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,[data-act]');
    if (!t) return;
    var d = t.dataset;
    if (d.tsz) { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true'); }
    else if (d.tab) { S.tab = d.tab; S.armed = null; render(); }
    else if (d.edit) editItem(d.edit);
    else if (d.dup) duplicar(d.dup);
    else if (d.del) borrar(d.del);
    else if (d.mv) moverItem(d.mv, +d.d);
    else if (d.smv !== undefined) {
      var i = +d.smv, j = i + (+d.d), a = D.cfg.sections;
      if (j < 0 || j >= a.length) return;
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      paneSecs();
      guardarAjustes();
    }
    else if (d.sdel !== undefined) {
      var k = 's' + d.sdel;
      if (S.armed === k) { S.armed = null; D.cfg.sections.splice(+d.sdel, 1); paneSecs(); guardarAjustes('Sección borrada'); }
      else { S.armed = k; paneSecs(); }
    }
    else switch (d.act) {
      case 'close': u.cerrarModal(); break;
      case 'new': editItem(null); break;
      case 'edsave': guardarItem(d.id); break;
      case 'salir': db.salir().then(function () { S.user = null; renderLogin(); }); break;
      case 'reset':
        if (db.reiniciar) db.reiniciar().then(cargarPanel).then(function () { u.toast('Volviste al catálogo de ejemplo'); });
        break;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target, d = t.dataset, c = D.cfg;
    if (d.st) cambiarEstado(d.st, t.value);
    else if (d.ren !== undefined) {
      var i = +d.ren, viejo = c.sections[i], nuevo = t.value.trim();
      if (!nuevo || (nuevo !== viejo && c.sections.indexOf(nuevo) > -1)) { t.value = viejo; u.toast('Ese nombre está vacío o ya existe.'); return; }
      if (nuevo === viejo) return;
      c.sections[i] = nuevo;
      D.items.forEach(function (x) { if (x.section === viejo) x.section = nuevo; });
      guardar(db.renombrarSeccion(viejo, nuevo, c), 'Sección renombrada');
    }
    else if (t.id === 'set-wa') {
      var w = t.value.replace(/\D/g, '');
      if (w.length < 8) { u.toast('Ese número parece incompleto.'); t.value = c.wa; return; }
      c.wa = w;
      t.value = w;
      guardarAjustes('WhatsApp actualizado').then(function () { if (S.tab === 'set') paneSet(); });
    }
    else if (t.id === 'set-ig') { c.ig = t.value.trim(); guardarAjustes('Instagram actualizado'); }
    else if (t.id === 'set-pay') { c.pay = t.value.trim(); guardarAjustes('Medios de pago actualizados'); }
    else if (t.id === 'set-prices') { c.showPrices = t.checked; guardarAjustes(t.checked ? 'Precios visibles' : 'Precios ocultos'); }
    else if (t.id === 'set-sold') { c.showSold = t.checked; guardarAjustes('Ajuste guardado'); }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'login') entrar(e);
    else if (e.target.id === 'addsec') {
      e.preventDefault();
      var n = $('#newsec').value.trim();
      if (!n || D.cfg.sections.indexOf(n) > -1) { u.toast('Ese nombre está vacío o ya existe.'); return; }
      D.cfg.sections.push(n);
      paneSecs();
      guardarAjustes('Sección agregada');
    }
  });

  // Pegar una foto con Ctrl+V mientras está abierto el formulario
  document.addEventListener('paste', function (e) {
    if (!u.modalAbierto() || !$('#drop')) return;
    var f = e.clipboardData && e.clipboardData.files && e.clipboardData.files[0];
    if (f) { e.preventDefault(); tomarFoto(f); }
  });

  window.addEventListener('beforeunload', function (e) {
    if (S.saving) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- Arranque ---------- */
  db.usuario().then(function (user) {
    if (!user) return renderLogin();
    S.user = user;
    return cargarPanel();
  }).catch(function (err) {
    console.error(err);
    renderLogin('No se pudo conectar. Revisá la conexión y probá de nuevo.');
  });
})();
