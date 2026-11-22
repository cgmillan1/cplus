# C Plus LLC · Sitio web animado y apps de proyectos

Un sitio web público y dos apps que comparten la misma base de datos:

- **`index.html` (sitio web):** portada con la pérgola en 3D, recorrido 3D por los proyectos al bajar, servicios, portafolio con filtros donde cada foto se abre en 3D, cómo trabajamos, la app y el formulario de cotización. Las solicitudes llegan al panel del contratista.

- **`admin.html` (contratista):** varios proyectos, presupuesto y gastos con fotos de recibos, cobros y calendario de pagos, órdenes de cambio, pasos, avances con fotos, mensajes con el cliente, plantillas e impresión del estimado.
- **`proyecto.html?p=...` (cliente):** cada cliente tiene su propio enlace privado. Ve su estimado (materiales y mano de obra), cuánto ha pagado y cuánto falta, el calendario de pagos, los cambios para aprobar o rechazar, los materiales comprados, los pasos, los avances con fotos y los mensajes. Nunca ve tus costos ni tus gastos.

Todo se guarda al momento. No hay que subir archivos cada vez.

---

## Configuración (una sola vez, unos 15 minutos)

### 1. Crea el proyecto en Supabase
1. Entra a **supabase.com** y crea una cuenta gratis.
2. Presiona **New project**. Nombre: `cplus`. Pon una contraseña de base de datos (guárdala) y elige la región **West US**.
3. Espera a que termine de crearse (1 o 2 minutos).

### 2. Crea las tablas
1. En el menú de la izquierda abre **SQL Editor** y presiona **New query**.
2. Abre el archivo `schema.sql`, copia **todo** su contenido y pégalo.
3. Presiona **Run**. Debe decir *Success*.

### 3. Crea tu usuario de contratista
1. Ve a **Authentication > Users** y presiona **Add user > Create new user**.
2. Escribe el correo y la contraseña con los que vas a entrar. Marca **Auto Confirm User** y presiona crear.
3. **Importante:** en la configuración de Authentication (sección **Sign In / Providers**), **desactiva "Allow new users to sign up"**. Así nadie más puede crear una cuenta.

### 4. Conecta la app
1. Ve a **Project Settings > API Keys** (o **Data API**).
2. Copia la **Project URL** y la llave **publishable** (o **anon public**).
3. Abre `config.js` y pégalas entre las comillas:
   ```js
   window.CPLUS_CONFIG = {
     url: "https://TU-PROYECTO.supabase.co",
     key: "sb_publishable_..."
   };
   ```
   Usa solo la llave publishable o anon. **Nunca** pongas la llave *secret* o *service_role*: esa da acceso total.

### 5. Súbelo a GitHub
En el repositorio `cplus`, presiona **Add file > Upload files** y sube **todos** estos archivos (reemplazan a los anteriores):

todo el contenido de la carpeta, incluida la carpeta `img/` completa: `index.html`, `site.css`, `site.js`, `depth3d.js`, `proyecto.html`, `admin.html`, `client.js`, `admin.js`, `config.js`, `api.js`, `shared.js`, `styles.css`, `manifest.webmanifest`, los íconos, los logos, `DESIGN.md` y `README.md`.

Para subir la carpeta `img/` en GitHub: en la página de subir archivos, arrastra la carpeta completa (no solo las fotos), para que queden dentro de `img/`.

(`schema.sql` puede quedarse fuera del repositorio. No pasa nada si lo subes.)

---

## Cómo se usa

- **Sitio web:** `https://cgmillan1.github.io/cplus/`. Los enlaces viejos de clientes (`index.html?p=...`) se redirigen solos a `proyecto.html`.
- **Solicitudes de estimado:** aparecen arriba en el panel del contratista. **Crear proyecto** convierte la solicitud en un proyecto con los datos del cliente ya llenos.

- **Contratista:** `https://cgmillan1.github.io/cplus/admin.html`. Entra con el correo y la contraseña del paso 3.
- **Primer proyecto:** presiona **Crear proyecto de ejemplo** para ver cómo funciona todo, o **+ Nuevo proyecto** para empezar uno real.
- **Enlace del cliente:** en la pestaña **Proyecto** está su enlace privado, con botones para copiarlo o mandarlo por WhatsApp.
- **Plantillas:** **Duplicar como plantilla** copia el estimado, los materiales, los pasos, el presupuesto y el calendario de pagos a un proyecto nuevo.
- **Órdenes de cambio:** se crean como borrador. Al presionar **Enviar al cliente**, el cliente las aprueba o rechaza con su nombre. Las aprobadas se suman al total.
- **Calendario de pagos:** el estado de cada pago (pagado, siguiente, pendiente) se calcula solo con los pagos registrados.
- **PDF del estimado:** el botón **Imprimir / PDF del estimado** abre la ventana de impresión. Elige "Guardar como PDF".
- **Mensajes:** el número rojo en cada proyecto indica mensajes nuevos del cliente.

## Ponerlo en el iPhone como app
Abre `admin.html` en **Safari**, toca **Compartir** y luego **Agregar a pantalla de inicio**. Queda con el ícono de C Plus y se abre sin la barra del navegador. El cliente puede hacer lo mismo con su enlace.

## Actualizar la base de datos
Si ya habías corrido `schema.sql` antes, vuelve a correrlo completo cuando haya una versión nueva. Se puede correr las veces que sea sin perder datos.

## Seguridad

- Tus costos, gastos, recibos y presupuesto solo se pueden leer con tu usuario.
- El cliente solo ve su proyecto a través de su enlace. Si alguien más consigue el enlace, puede ver ese proyecto (no tus costos). Mándalo solo al cliente.
- Las fotos de los avances son públicas con nombres imposibles de adivinar. Los recibos son privados.
- Cada archivo queda en la carpeta de su proyecto, y solo el dueño del proyecto puede subir, ver o borrar sus archivos.
- Si un enlace de cliente llega a otra persona, en la pestaña **Proyecto** presiona **Crear enlace nuevo**. El anterior deja de funcionar.
- Los montos no pueden ser negativos, y el cliente puede mandar hasta 10 mensajes cada 10 minutos.

## Documentos y contratos
- En cada proyecto, la pestaña **Documentos** descarga el **estimado en PDF**, crea el **contrato** y, al final, el **documento de terminación** con cada monto agregado o cambiado desde el contrato.
- Antes del primer contrato, llena **Datos de la empresa para contratos** (nombre legal, número de licencia DOPL, dirección y garantía).
- Cada documento guarda una copia exacta de los montos del día en que se creó. Márcalo como **Enviado** o **Firmado** para que el cliente lo vea en su página.
- El contrato es una plantilla general, no asesoría legal: revísalo con un abogado de Utah antes de usarlo.

## Fotos y efecto 3D
Las fotos están en `img/`. Cada foto tiene su **mapa de profundidad** (`NOMBRE-d.jpg`, en blanco y negro: lo claro está cerca, lo oscuro lejos), hecho con un modelo de IA (Depth Anything). `depth3d.js` usa los dos para mover una cámara virtual: lo cercano se mueve más que lo lejano y la foto se ve como una escena 3D. No usa servicios pagados.
Para agregar fotos nuevas, mándamelas y genero su mapa de profundidad. Luego se agregan a la lista `P` al principio de `site.js`.
Si alguien tiene activado "reducir movimiento" en su teléfono, el sitio muestra las fotos normales sin animación.

## Bueno saber

- El plan gratis de Supabase incluye 500 MB de base de datos y 1 GB de fotos. La app reduce las fotos antes de subirlas, así que alcanzan para muchos proyectos.
- Si nadie usa el proyecto de Supabase por una semana, Supabase lo puede pausar. Se reactiva desde su panel con un clic.

## Pendiente con C Plus
- Ciudades donde trabajan (el sitio viejo no lo dice) y número de licencia de Utah, para el pie de página y los contratos.
- Confirmar el teléfono: el sitio viejo muestra (385) 358-6145, pero el enlace marca 404-542-0606. Aquí se usa (385) 358-6145 en todo.
- Reseñas: el sitio solo dice "5 estrellas en Google". Si nos pasan el enlace de su perfil de Google, se puede poner.
