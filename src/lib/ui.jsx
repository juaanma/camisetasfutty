/* Piezas de interfaz compartidas: avisos, ventanas y números que cuentan solos */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useInView } from 'framer-motion';

/* ---------- Avisos (toast) ---------- */
const AvisoCtx = createContext(() => {});
export const useAviso = () => useContext(AvisoCtx);

export function AvisoProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const avisar = useCallback((texto) => {
    setMsg({ texto, k: Date.now() });
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <div className="toast-zona" role="status" aria-live="polite">
        <AnimatePresence>
          {msg && (
            <motion.div key={msg.k} className="toast"
              initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
              {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AvisoCtx.Provider>
  );
}

/* ---------- Ventana (modal) con foco atrapado y cierre con Escape ---------- */
export function Ventana({ abierta, onCerrar, children, className = '', etiqueta, onTecla }) {
  return createPortal(
    <AnimatePresence>
      {abierta && (
        <VentanaAbierta onCerrar={onCerrar} className={className} etiqueta={etiqueta} onTecla={onTecla}>
          {children}
        </VentanaAbierta>
      )}
    </AnimatePresence>,
    document.body
  );
}

function VentanaAbierta({ onCerrar, children, className, etiqueta, onTecla }) {
  const ref = useRef();
  // Se guardan en refs para no re-enfocar la ventana en cada render
  const cb = useRef({ onCerrar, onTecla });
  cb.current = { onCerrar, onTecla };
  useEffect(() => {
    const onCerrar = () => cb.current.onCerrar();
    const onTecla = (e) => cb.current.onTecla && cb.current.onTecla(e);
    const antes = document.activeElement;
    document.body.classList.add('lock');
    const f = ref.current.querySelector('[data-autofocus]') || ref.current;
    f.focus({ preventScroll: true });
    const tecla = (e) => {
      if (e.key === 'Escape') { onCerrar(); return; }
      if (!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) onTecla(e);
      if (e.key === 'Tab') {
        const f = [...ref.current.querySelectorAll('button,a[href],input,select,textarea')].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.classList.remove('lock');
      if (antes && document.contains(antes)) antes.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div className="ov" onMouseDown={(e) => { if (e.target === e.currentTarget) cb.current.onCerrar(); }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div ref={ref} className={'md ' + className} role="dialog" aria-modal="true" aria-label={etiqueta} tabIndex={-1}
        initial={{ opacity: 0, y: 50, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------- Número que cuenta desde 0 cuando aparece ---------- */
export function Contador({ valor, formato = (n) => n }) {
  const ref = useRef();
  const visto = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visto) return;
    const c = animate(0, valor, { duration: 1.4, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [visto, valor]);
  return <span ref={ref}>{formato(n)}</span>;
}
