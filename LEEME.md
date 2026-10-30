# Camisetas Futty — página web

Tienda de camisetas con catálogo, consultas por WhatsApp y un **panel de admin** para que el dueño cargue y actualice las camisetas.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La tienda que ven los clientes |
| `admin.html` | El panel del dueño (se entra con correo y contraseña) |
| `css/estilos.css` | Diseño de la tienda (colores, letras, tarjetas) |
| `css/admin.css` | Diseño del panel |
| `js/config.js` | **Los dos datos de Supabase** (lo único que hay que tocar para publicar) |
| `js/comun.js` | Funciones que usan la tienda y el panel |
| `js/datos.js` | Guarda y lee el catálogo (en Supabase o en modo prueba) |
| `js/tienda.js` | Lo que hace la tienda: filtros, búsqueda, consulta por WhatsApp |
| `js/admin.js` | Lo que hace el panel: cargar, editar, borrar, ordenar |
| `js/datos-prueba.js` | Catálogo de ejemplo para el modo prueba |
| `img/` | Logo y fotos de las camisetas actuales |
| `supabase/setup.sql` | Prepara la base de datos (se pega una sola vez) |

## Probarla ya (modo prueba)

Abrí `index.html` con doble clic. Para el panel, abrí `admin.html` y entrá con cualquier correo y contraseña.

En modo prueba los cambios del panel quedan **solo en esa computadora**. Sirve para ver cómo funciona todo.

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

Pegalos en `js/config.js`:

```js
window.FUTTY_CONFIG = {
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseKey: 'eyJhbGciOi...'
};
```

La *anon key* puede estar en la web sin problema: solo sirve para leer el catálogo. Para editar hace falta entrar con la cuenta del dueño. **Nunca** pegues la *service_role key*.

### 3. Subir la web a internet gratis (Netlify)

1. Entrá a <https://app.netlify.com/drop>.
2. Arrastrá **toda la carpeta** `CAMISETAS FUTTY`.
3. Te da una dirección tipo `https://camisetas-futty.netlify.app`. Desde *Site settings* podés cambiarle el nombre o conectar un dominio propio.

Cada vez que cambies archivos (no el catálogo, sino el diseño o el código), volvé a arrastrar la carpeta.

## Cómo usa el panel el dueño

Entra a `https://su-pagina/admin.html` con su correo y contraseña. Desde ahí:

- **Camisetas**: agregar una nueva con foto, cambiar el estado (disponible, reservada, vendida) desde la lista, editar, duplicar, borrar y ordenar con las flechas.
- **Secciones**: crear, renombrar, ordenar y borrar secciones (Retro, Lifestyle, etc.).
- **Ajustes**: número de WhatsApp, Instagram, medios de pago, mostrar u ocultar precios y la sección «Ya vendidas».

Todo se guarda al instante y los clientes lo ven al recargar la página.
