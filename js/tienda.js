/* Camisetas Futty — la tienda que ven los clientes */
(function () {
  'use strict';

  var u = window.Futty.u, $ = u.$, esc = u.esc, money = u.money, plural = u.plural, I = u.I;
  var D = { cfg: { sections: [] }, items: [] };
  var S = { q: '', size: '', sec: 'all', bag: [], visible: [], cur: null };
  var app = $('#app');

  function byId(id) { for (var i = 0; i < D.items.length; i++) if (D.items[i].id === id) return D.items[i]; return null; }
  function avail(it) { return it.status !== 'vendida'; }
  /* Las vendidas siguen en el catálogo como "sin stock" (si el dueño lo deja activado) */
  function listed(it) { return avail(it) || D.cfg.showSold; }
  function showP(it) { return D.cfg.showPrices && it.price; }
  function wa(t) { return u.waLink(D.cfg, t); }

  /* Mi consulta: queda guardada solo en el navegador de cada cliente */
  function loadBag() {
    try {
      var b = JSON.parse(u.ls('futty-bag') || '[]');
      S.bag = b.filter(function (id) { var it = byId(id); return it && it.status === 'disponible'; });
    } catch (e) { S.bag = []; }
  }
  function saveBag() { u.ls('futty-bag', JSON.stringify(S.bag)); }
  function inBag(id) { return S.bag.indexOf(id) > -1; }
  function toggleBag(id) {
    var i = S.bag.indexOf(id);
    if (i > -1) { S.bag.splice(i, 1); u.toast('Sacada de tu consulta'); }
    else { S.bag.push(id); u.toast('Sumada a tu consulta'); }
    saveBag(); syncBagButtons(); renderBag();
  }

  function line(it) {
    return it.name + ' ' + it.sub + ' · Talle ' + it.size + (it.code ? ' · Cód. #' + it.code : '') + (showP(it) ? ' · ' + money(it.price) : '');
  }
  function msgOne(it) {
    if (it.status === 'vendida') return 'Hola! Vi que la camiseta ' + line(it) + ' está sin stock. ¿Me pueden conseguir una igual?';
    if (it.status === 'reservada') return 'Hola! Vi que la camiseta ' + line(it) + ' está reservada. Si se libera, ¿me avisan?';
    return 'Hola! Me interesa la camiseta ' + line(it) + '. ¿Sigue disponible?' + (showP(it) ? '' : ' ¿Qué precio tiene?');
  }
  function bagItems() { return S.bag.map(byId).filter(Boolean); }
  function totals(list) {
    var pr = list.filter(showP), sum = pr.reduce(function (a, i) { return a + Number(i.price); }, 0);
    return { sum: sum, all: pr.length === list.length, some: pr.length > 0 };
  }
  function msgBag() {
    var list = bagItems(), t = totals(list);
    var m = 'Hola! Me interesan estas camisetas:\n\n' + list.map(function (i) { return '• ' + line(i); }).join('\n');
    if (t.all && t.some) m += '\n\nTotal: ' + money(t.sum);
    else if (t.some) m += '\n\nSubtotal de las que tienen precio: ' + money(t.sum) + '. El resto se los consulto.';
    return m + '\n\n¿Siguen disponibles? ¿Cómo coordinamos el pago?';
  }
  var MSG_CUSTOM = 'Hola! Quiero encargar una camiseta a medida. Les mando la foto o les cuento cuál busco.';

  /* ---------- Página ---------- */
  function render() {
    var av = D.items.filter(avail);
    app.innerHTML =
      '<header class="top">' +
        '<h1 class="sr">Camisetas Futty</h1><img class="logo" src="img/logo.png" alt="Camisetas Futty" width="1000" height="236">' +
        '<section class="hero-ask" id="pedidos" aria-labelledby="pedh">' +
          '<p class="eyebrow">Pedidos a medida</p>' +
          '<h2 id="pedh">¿No está la camiseta que tanto buscás?</h2>' +
          '<p class="d">Pedí <b>CUALQUIER</b> camiseta: la que siempre estuviste buscando, de cualquier equipo o época. Personalizala como quieras y encargala en <b>cualquier talle</b>.</p>' +
          '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa(MSG_CUSTOM) + '">Pedila por WhatsApp</a>' +
          '<p class="hint">¡Mandanos la foto de la camiseta que querés!</p>' +
        '</section>' +
        '<a class="stock-big" href="#catalog"><span aria-hidden="true">•</span> Stock disponible <span aria-hidden="true">•</span></a>' +
        '<p class="fast"><span class="live" aria-hidden="true"></span>Entrega inmediata · ' + plural(av.length, 'camiseta', 'camisetas') + '</p>' +
      '</header>' +
      '<div class="bar" role="search"><div class="wrap">' +
        '<label class="search"><span class="sr">Buscar camiseta</span>' + I.search + '<input id="q" type="search" placeholder="Buscá equipo, año o jugador" autocomplete="off"></label>' +
        '<div class="chips" id="chips"></div>' +
      '</div></div>' +
      '<main class="wrap" id="catalog" aria-live="polite"></main>' +
      footerHTML() +
      '<div id="bag" hidden></div>';
    var q = $('#q');
    q.value = S.q;
    q.addEventListener('input', function () { S.q = q.value; renderCatalog(); });
    renderCatalog();
    renderBag();
  }

  function chipsHTML() {
    var av = D.items.filter(listed);
    var h = '<button class="chip" data-sec="all" aria-pressed="' + (S.sec === 'all') + '">Todo<small>' + av.length + '</small></button>';
    D.cfg.sections.forEach(function (s) {
      var n = av.filter(function (i) { return i.section === s; }).length;
      if (!n) return;
      h += '<button class="chip" data-sec="' + esc(s) + '" aria-pressed="' + (S.sec === s) + '">' + esc(s) + '<small>' + n + '</small></button>';
    });
    var have = {};
    av.forEach(function (i) { u.talles(i).forEach(function (z) { have[z] = 1; }); });
    var ts = u.TALLES.filter(function (t) { return have[t]; });
    if (ts.length > 1) {
      h += '<span class="sep" aria-hidden="true"></span><span class="lbl">Talle</span>';
      ts.forEach(function (t) { h += '<button class="chip" data-size="' + t + '" aria-pressed="' + (S.size === t) + '">' + t + '</button>'; });
    }
    return h;
  }

  function match(it) {
    if (S.sec !== 'all' && it.section !== S.sec) return false;
    if (S.size && u.talles(it).indexOf(S.size) < 0) return false;
    if (S.q) {
      var hay = u.norm([it.name, it.sub, it.code, it.section].join(' '));
      var ws = u.norm(S.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < ws.length; i++) if (hay.indexOf(ws[i]) < 0) return false;
    }
    return true;
  }

  function renderCatalog() {
    $('#chips').innerHTML = chipsHTML();
    var secs = S.sec === 'all' ? D.cfg.sections : [S.sec], h = '', vis = [], filtering = S.q || S.size || S.sec !== 'all';
    secs.forEach(function (s, si) {
      var its = D.items.filter(function (i) { return i.section === s && listed(i) && match(i); });
      its = its.filter(avail).concat(its.filter(function (i) { return !avail(i); })); // las sin stock, al final
      if (!its.length) return;
      its.forEach(function (i) { vis.push(i.id); });
      h += '<section class="sec" aria-labelledby="sh' + si + '"><div class="sec-h"><h2 id="sh' + si + '">' + esc(s) + '</h2><span class="cnt">' + plural(its.length, 'modelo', 'modelos') + '</span></div><div class="grid">' + its.map(card).join('') + '</div></section>';
    });
    S.visible = vis;
    if (!vis.length) {
      h = '<div class="empty"><b>No encontramos esa camiseta en stock</b>Probá con otro talle o búsqueda. Si no la tenemos, te la conseguimos a medida.<br>' +
        '<button class="btn btn-line" data-act="clear">Ver todas</button> <a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa(MSG_CUSTOM) + '">' + I.wa + 'Pedila a medida</a></div>';
    } else if (filtering) {
      h = '<p class="result">' + plural(vis.length, 'camiseta', 'camisetas') + (S.size ? ' en talle ' + S.size : '') + (S.q ? ' para «' + esc(S.q) + '»' : '') + ' · <button data-act="clear">Ver todas</button></p>' + h;
    }
    $('#catalog').innerHTML = h;
  }

  function card(it) {
    var res = it.status === 'reservada', sold = !avail(it), on = inBag(it.id);
    return '<article class="card' + (res ? ' is-res' : '') + (sold ? ' is-sold' : '') + '">' +
      '<button class="ph" data-open="' + esc(it.id) + '" aria-label="Ver foto grande: ' + esc(it.name + ' ' + it.sub) + (sold ? ' (sin stock)' : '') + '"><img src="' + esc(it.img) + '" alt="" loading="lazy" decoding="async" width="720" height="720">' +
        '<span class="tag-sz">' + esc(it.size) + '</span>' +
        (sold ? '<span class="stamp">Sin stock</span>' :
          '<span class="flags">' + (res ? '<span class="flag res">Reservada</span>' : '') + (it.isNew && !res ? '<span class="flag new">Nuevo</span>' : '') + (it.units > 1 ? '<span class="flag units">' + it.units + ' unidades</span>' : '') + '</span>') +
      '</button>' +
      '<div class="bd"><h3>' + esc(it.name) + '</h3><p class="sub">' + esc(it.sub) + '</p>' +
        '<div class="ft"><div class="price">' + (sold ? '<span class="ask out">Sin stock</span>' : showP(it) ? '<span class="p">' + money(it.price) + '</span>' : '<span class="ask">Precio por WhatsApp</span>') + (it.code ? '<span class="code">#' + esc(it.code) + '</span>' : '') + '</div>' +
        '<div class="act">' + (res || sold ? '' : '<button class="btn btn-line btn-sm" data-bag="' + esc(it.id) + '" aria-pressed="' + on + '">' + (on ? '✓ Sumada' : '+ Sumar') + '</button>') +
        '<a class="btn ' + (sold ? 'btn-line' : 'btn-wa') + ' btn-sm" target="_blank" rel="noopener" href="' + wa(msgOne(it)) + '">' + (sold ? 'Pedí una igual' : res ? 'Avisame' : 'Consultar') + '</a></div></div>' +
      '</div></article>';
  }

  function syncBagButtons() {
    document.querySelectorAll('[data-bag]').forEach(function (b) {
      var on = inBag(b.dataset.bag);
      b.setAttribute('aria-pressed', on);
      b.textContent = b.classList.contains('big') ? (on ? '✓ En tu consulta' : '+ Sumar a mi consulta') : (on ? '✓ Sumada' : '+ Sumar');
    });
  }

  function footerHTML() {
    var c = D.cfg;
    var pays = String(c.pay || '').split(/\s*(?:,|\by\b|\bo\b|·|\/)\s*/i).filter(Boolean);
    return '<footer><div class="wrap">' +
      '<div><h3>Cómo comprar</h3><ol><li>Elegí una o varias camisetas y sumalas a tu consulta.</li><li>Mandanos la consulta por WhatsApp y te confirmamos stock.</li><li>Coordinamos el pago y la entrega por WhatsApp.</li></ol></div>' +
      (pays.length ? '<div><h3>Medios de pago</h3><div class="pays">' + pays.map(function (p) { return '<span>' + esc(p.charAt(0).toUpperCase() + p.slice(1)) + '</span>'; }).join('') + '</div><p class="m">El pago se arregla por WhatsApp antes de la entrega.</p></div>' : '') +
      '<div><h3>Contacto</h3><div class="links">' +
        '<a target="_blank" rel="noopener" href="' + wa('Hola! Tengo una consulta.') + '">' + I.wa + '<span class="num">' + esc(u.waLindo(c)) + '</span></a>' +
        (c.ig ? '<a target="_blank" rel="noopener" href="' + esc(c.ig) + '">' + I.ig + esc(u.igUsuario(c)) + '</a>' : '') +
      '</div></div>' +
      '<div class="legal"><span>© ' + new Date().getFullYear() + ' Camisetas Futty</span><span>Stock actualizado por el equipo de Futty</span></div>' +
      '</div></footer>';
  }

  function renderBag() {
    var b = $('#bag');
    if (!b) return;
    var list = bagItems();
    if (!list.length) { b.hidden = true; document.body.classList.remove('has-bag'); return; }
    var t = totals(list);
    b.innerHTML = '<div class="wrap"><div class="bag-thumbs" aria-hidden="true">' + list.slice(0, 4).map(function (i) { return '<img src="' + esc(i.img) + '" alt="">'; }).join('') + '</div>' +
      '<div class="bag-txt"><b>Tu consulta: ' + plural(list.length, 'camiseta', 'camisetas') + '</b><span>' + (t.all && t.some ? 'Total ' + money(t.sum) : t.some ? 'Subtotal ' + money(t.sum) + ' + a consultar' : 'Precios por WhatsApp') + '</span></div>' +
      '<button class="btn btn-line btn-sm" data-act="bag">Ver</button><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + wa(msgBag()) + '">' + I.wa + 'Enviar</a></div>';
    b.hidden = false;
    document.body.classList.add('has-bag');
  }

  /* ---------- Ventanas ---------- */
  function openItem(id) {
    var it = byId(id);
    if (!it) return;
    S.cur = id;
    var idx = S.visible.indexOf(id), n = S.visible.length, res = it.status === 'reservada', sold = !avail(it), on = inBag(id);
    var nav = idx > -1 && n > 1 ? '<button class="lb-nav prev" data-nav="-1" aria-label="Anterior">' + I.l + '</button><button class="lb-nav next" data-nav="1" aria-label="Siguiente">' + I.r + '</button>' : '';
    u.abrirModal('<button class="x" data-act="close" aria-label="Cerrar">' + I.x + '</button>' +
      '<div class="lb-ph" id="lbph"><img src="' + esc(it.img) + '" alt="' + esc(it.name + ' ' + it.sub) + '">' + nav + '</div>' +
      '<div class="lb-info"><p class="eyebrow">' + esc(it.section) + (idx > -1 && n > 1 ? ' · ' + (idx + 1) + ' de ' + n : '') + '</p><h3 id="lbt">' + esc(it.name) + '</h3><p class="sub">' + esc(it.sub) + '</p>' +
      '<dl class="facts"><dt>Talle</dt><dd>' + esc(it.size) + '</dd>' + (it.units > 1 ? '<dt>Unidades</dt><dd>' + it.units + '</dd>' : '') + (it.code ? '<dt>Código</dt><dd>#' + esc(it.code) + '</dd>' : '') + '<dt>Estado</dt><dd>' + (sold ? 'Sin stock' : res ? 'Reservada' : 'Disponible') + '</dd></dl>' +
      (sold ? '<p class="note">Esta ya se vendió. Escribinos y vemos si te conseguimos una igual.</p>' :
        (showP(it) ? '<span class="p">' + money(it.price) + '</span>' : '<p class="note">Consultá el precio por WhatsApp.</p>') +
        (D.cfg.pay ? '<p class="note">Pago: ' + esc(String(D.cfg.pay).toLowerCase()) + '. Se coordina por WhatsApp.</p>' : '')) +
      '<div class="act">' + (res || sold ? '' : '<button class="btn btn-line big" data-bag="' + esc(it.id) + '" aria-pressed="' + on + '">' + (on ? '✓ En tu consulta' : '+ Sumar a mi consulta') + '</button>') +
      '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa(msgOne(it)) + '">' + I.wa + (sold ? 'Pedí una igual' : res ? 'Avisame si se libera' : 'Consultar por WhatsApp') + '</a></div></div>',
      'lb', {
        labelledby: 'lbt',
        onKey: function (e) { if (e.key === 'ArrowLeft') step(id, -1); else if (e.key === 'ArrowRight') step(id, 1); }
      });
    var ph = $('#lbph'), x0 = null;
    ph.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ph.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) step(id, dx < 0 ? 1 : -1);
      x0 = null;
    });
  }
  function step(id, d) {
    var n = S.visible.length, i = S.visible.indexOf(id);
    if (i < 0 || n < 2) return;
    openItem(S.visible[(i + d + n) % n]);
  }

  function openBag() {
    var list = bagItems();
    if (!list.length) { u.cerrarModal(); return; }
    var t = totals(list);
    u.abrirModal('<div class="md-h"><h3 id="bt">Tu consulta</h3><button class="x" data-act="close" aria-label="Cerrar" data-autofocus>' + I.x + '</button></div>' +
      '<div class="md-b"><div class="bag-list">' + list.map(function (i) {
        return '<div class="bag-row"><img src="' + esc(i.img) + '" alt=""><div><b>' + esc(i.name) + '</b><span>' + esc(i.sub) + ' · Talle ' + esc(i.size) + '</span></div>' +
          '<div style="text-align:right">' + (showP(i) ? '<span class="p">' + money(i.price) + '</span>' : '<span>A consultar</span>') + '<button class="rm" data-unbag="' + esc(i.id) + '">Sacar</button></div></div>';
      }).join('') + '</div>' +
      (t.some ? '<div class="total"><span>' + (t.all ? 'Total' : 'Subtotal') + '</span><span class="p">' + money(t.sum) + '</span></div>' : '') +
      (t.some && !t.all ? '<p class="note">Las que no tienen precio te las cotizamos por WhatsApp.</p>' : '') +
      '<p class="note" style="margin-top:10px">Al enviar se abre WhatsApp con la lista armada.' + (D.cfg.pay ? ' Pago: ' + esc(String(D.cfg.pay).toLowerCase()) + '.' : '') + '</p></div>' +
      '<div class="md-f"><button class="btn btn-line" data-act="clearbag">Vaciar</button><a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa(msgBag()) + '">' + I.wa + 'Enviar por WhatsApp</a></div>',
      '', { labelledby: 'bt' });
  }

  function toCatalog() {
    var c = $('#catalog');
    if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({ block: 'start' });
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,[data-act]');
    if (!t) return;
    var d = t.dataset;
    if (d.open) openItem(d.open);
    else if (d.nav) step(S.cur, +d.nav);
    else if (d.bag) toggleBag(d.bag);
    else if (d.unbag) { toggleBag(d.unbag); openBag(); }
    else if (d.sec !== undefined) { S.sec = d.sec; renderCatalog(); toCatalog(); }
    else if (d.size !== undefined) { S.size = S.size === d.size ? '' : d.size; renderCatalog(); toCatalog(); }
    else switch (d.act) {
      case 'close': u.cerrarModal(); break;
      case 'bag': openBag(); break;
      case 'clearbag': S.bag = []; saveBag(); syncBagButtons(); renderBag(); u.cerrarModal(); u.toast('Consulta vacía'); break;
      case 'clear': S.q = ''; S.size = ''; S.sec = 'all'; $('#q').value = ''; renderCatalog(); break;
    }
  });

  /* ---------- Arranque ---------- */
  window.Futty.datos.cargar().then(function (d) {
    D = d;
    loadBag();
    render();
  }).catch(function (err) {
    console.error(err);
    app.innerHTML = '<div class="empty"><b>No pudimos cargar el catálogo</b>Revisá tu conexión y volvé a intentar.<br><button class="btn btn-line" onclick="location.reload()">Reintentar</button></div>';
  });
})();
