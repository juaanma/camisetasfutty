# Camisetas Futty — página web

Tienda de camisetas con catálogo, consultas por WhatsApp y un **panel de admin** para que el dueño cargue y actualice las camisetas.

Hecha con **React + Vite**, animaciones con **Motion** (Framer Motion) y datos en **Supabase**.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `src/config.js` | **Los dos datos de Supabase** (si quedan vacíos, la web corre en modo prueba) |
| `src/main.jsx` | Arranque: la tienda en `/` y el panel en `/admin` |
| `src/tienda/` | La tienda: encabezado, buscador, catálogo, tarjetas, foto grande, consulta, pedidos a encargo, pie |
| `src/admin/` | El panel del dueño y el formulario de camisetas |
| `src/lib/` | Datos (Supabase o prueba), funciones compartidas, ventanas y avisos |
| `src/styles/` | Diseño de la tienda y del panel |
| `src/data/prueba.json` | Catálogo de ejemplo para el modo prueba |
| `public/img/` | Logo y fotos de las camisetas |
| `supabase/setup.sql` | Prepara la base de datos (se pega una sola vez) |
| `_version-html/` | Copia de la versión anterior en HTML (por si hace falta volver) |

## Trabajar en la web

Hace falta tener **Node.js** instalado. La primera vez, en esta carpeta:

```
npm install
```

Para verla mientras la cambiás (se abre sola en el navegador y se actualiza al guardar):

```
npm run dev
```

El panel está en `http://localhost:5173/admin`.

Para armar la versión que se sube a internet:

```
npm run build
```

Eso crea la carpeta `dist/`, que es la que se publica.

## Publicarla de verdad (una sola vez, ~15 minutos)

### 1. Crear la base de datos gratis en Supabase

1. Entrá a <https://supabase.com>, creá una cuenta y un **New project** (cualquier nombre, región *South America (São Paulo)*).
2. Andá a **SQL Editor → New query**, pegá todo el contenido de `supabase/setup.sql` y tocá **Run**. Esto crea las tablas, el lugar para las fotos y carga las 20 camisetas actuales.
3. Andá a **Authentication → Users → Add user → Create new user**. Poné el correo y la contraseña del dueño y marcá *Auto Confirm User*.
4. Volvé al **SQL Editor** y corré esta línea con el correo del dueño:
   ```sql
   insert into public.admins (email) values ('correo-del-dueno@gmail.com');
   ```
5. En **Authentication → Sign In / Providers**, desactivá **Allow new users to sign up**. Así nadie más puede crearse una cuenta. Igual, solo los correos de la tabla `admins` pueden editar.

### 2. Conectar la web con Supabase

En Supabase andá a **Project Settings → API** (o **Data API**) y copiá:

- **Project URL**
- **anon public key**

Pegalos en `src/config.js`:

```js
export const SUPABASE_URL = 'https://xxxxx.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOi...';
```

La *anon key* puede estar en la web sin problema: solo sirve para leer el catálogo. Para editar hace falta entrar con la cuenta del dueño. **Nunca** pegues la *service_role key*.

### 3. Subir la web a internet gratis (Netlify)

1. Corré `npm run build` en esta carpeta.
2. Entrá a <https://app.netlify.com/drop> y arrastrá **la carpeta `dist`** (no toda la carpeta del proyecto).
3. Te da una dirección tipo `https://camisetas-futty.netlify.app`. Desde *Site settings* podés cambiarle el nombre o conectar un dominio propio.

Cada vez que cambies el diseño o el código, repetí los pasos 1 y 2. El catálogo no hace falta: eso se cambia desde el panel.

*Opción automática:* si subís el proyecto a GitHub y lo conectás en Netlify, se publica solo en cada cambio (el archivo `netlify.toml` ya tiene la configuración).

## Cómo usa el panel el dueño

Entra a `https://su-pagina/admin` con su correo y contraseña (la dirección vieja `admin.html` también funciona). Desde ahí:

- **Camisetas**: agregar una nueva con foto, cambiar el estado (disponible, reservada, vendida o **a pedido**) desde la lista, editar, duplicar, borrar y ordenar con las flechas. Las «a pedido» no cuentan como stock: aparecen abajo de todo, en «Pedidos a encargo», dentro de la categoría de su sección.
- **Secciones**: crear, renombrar, ordenar y borrar secciones (Retro, Lifestyle, etc.).
- **Ajustes**: número de WhatsApp, Instagram, medios de pago, mostrar u ocultar precios y mostrar u ocultar las vendidas (aparecen en el catálogo como «Sin stock»).

Todo se guarda al instante y los clientes lo ven al recargar la página.
