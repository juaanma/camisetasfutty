import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AvisoProvider } from './lib/ui.jsx';
import Tienda from './tienda/Tienda.jsx';
import './styles/tienda.css';

// El panel se descarga solo cuando alguien entra a /admin
const Admin = lazy(() => import('./admin/Admin.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Las animaciones corren siempre, aunque la compu tenga apagados los "efectos de animación" */}
    <MotionConfig reducedMotion="never">
      <AvisoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Tienda />} />
            {/* Demo de la portada nueva (vitrina 3D + cartel de aeropuerto) */}
            <Route path="/demo" element={<Tienda demo />} />
            <Route path="/admin" element={<Suspense fallback={<p className="empty"><b>Cargando panel…</b></p>}><Admin /></Suspense>} />
            <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AvisoProvider>
    </MotionConfig>
  </StrictMode>
);
