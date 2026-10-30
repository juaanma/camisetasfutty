/* Camisetas Futty — funciones compartidas por la tienda y el panel */
(function () {
  'use strict';

  var TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  var ESTADOS = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida' };

  var ICONOS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
  };

  function $(s, r) { return (r || document).querySelector(s); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(p) { return '$' + Math.round(Number(p)).toLocaleString('es-AR'); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  function talles(it) { return String(it.size || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean); }

  function waNum(cfg) { return String(cfg.wa || '').replace(/\D/g, ''); }
  function waLink(cfg, texto) { return 'https://wa.me/' + waNum(cfg) + '?text=' + encodeURIComponent(texto); }
  function waLindo(cfg) {
    var n = waNum(cfg);
    if (/^549\d{10}$/.test(n)) return '+54 9 ' + n.slice(3, 6) + ' ' + n.slice(6, 9) + '-' + n.slice(9);
    return '+' + n;
  }
  function igUsuario(cfg) {
    var m = String(cfg.ig || '').match(/instagram\.com\/([^/?#]+)/i);
    return m ? '@' + m[1] : String(cfg.ig || '');
  }

  function toast(t) {
    var e = $('#toast');
    if (!e) return;
    e.textContent = t;
    e.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { e.classList.remove('on'); }, 2800);
  }

  // localStorage protegido: si el navegador lo bloquea, no rompe nada
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  /* Ventanas (modales) con foco atrapado y cierre con Escape */
  var modal = { ov: null, last: null, onKey: null, onClose: null };
  function abrirModal(html, cls, opts) {
    opts = opts || {};
    var ov = modal.ov || (modal.ov = $('#ov'));
    if (ov.hidden) modal.last = document.activeElement;
    ov.innerHTML = '<div class="md ' + (cls || '') + '" role="dialog" aria-modal="true" tabindex="-1">' + html + '</div>';
    ov.hidden = false;
    document.body.classList.add('lock');
    modal.onKey = opts.onKey || null;
    modal.onClose = opts.onClose || null;
    if (opts.labelledby) ov.querySelector('.md').setAttribute('aria-labelledby', opts.labelledby);
    var f = ov.querySelector('[data-autofocus]') || ov.querySelector('.md');
    f.focus({ preventScroll: true });
  }
  function cerrarModal() {
    var ov = modal.ov;
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    ov.innerHTML = '';
    document.body.classList.remove('lock');
    modal.onKey = null;
    if (modal.onClose) { var c = modal.onClose; modal.onClose = null; c(); }
    if (modal.last && document.contains(modal.last)) modal.last.focus({ preventScroll: true });
  }
  function modalAbierto() { return !!(modal.ov && !modal.ov.hidden); }

  document.addEventListener('click', function (e) {
    if (modal.ov && e.target === modal.ov) cerrarModal();
  });
  document.addEventListener('keydown', function (e) {
    if (!modalAbierto()) return;
    if (e.key === 'Escape') { cerrarModal(); return; }
    if (modal.onKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) modal.onKey(e);
    if (e.key === 'Tab') {
      var f = [].filter.call(modal.ov.querySelectorAll('button,a[href],input,select,textarea'), function (x) {
        return !x.disabled && x.offsetParent !== null;
      });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  window.Futty = window.Futty || {};
  window.Futty.u = {
    TALLES: TALLES, ESTADOS: ESTADOS, I: ICONOS,
    $: $, esc: esc, money: money, norm: norm, plural: plural, talles: talles,
    waNum: waNum, waLink: waLink, waLindo: waLindo, igUsuario: igUsuario,
    toast: toast, ls: ls,
    abrirModal: abrirModal, cerrarModal: cerrarModal, modalAbierto: modalAbierto
  };
})();
