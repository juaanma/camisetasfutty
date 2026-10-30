import { createContext, useContext } from 'react';

export const TiendaCtx = createContext(null);
export const useTienda = () => useContext(TiendaCtx);

export const MSG_MEDIDA = 'Hola! Quiero encargar una camiseta a medida. Les mando la foto o les cuento cuál busco.';
