# C Plus LLC · Sitio web animado y apps de proyectos

Un sitio web público y dos apps que comparten la misma base de datos:

- **`index.html` (sitio web):** portada con la pérgola en 3D, recorrido 3D por los proyectos al bajar, servicios, portafolio con filtros donde cada foto se abre en 3D, cómo trabajamos, la app y el formulario de cotización. Las solicitudes llegan al panel del contratista.

- **`admin.html` (contratista):** varios proyectos, presupuesto y gastos con fotos de recibos, cobros y calendario de pagos, órdenes de cambio, pasos, avances con fotos, mensajes con el cliente, plantillas e impresión del estimado.
- **`proyecto.html?p=...` (cliente):** cada cliente tiene su propio enlace privado. Ve su estimado (materiales y mano de obra), cuánto ha pagado y cuánto falta, el calendario de pagos, los cambios para aprobar o rechazar, los materiales comprados, los pasos, los avances con fotos y los mensajes. Nunca ve tus costos ni tus gastos.

Todo se guarda al momento. No hay que subir archivos cada vez.

---

## Equipo y roles
| Rol | Qué ve y qué hace |
|---|---|
| **Admin** | Todo: proyectos, dinero, solicitudes, datos de la empresa y el **Equipo** (agrega personas, cambia roles y contraseñas, quita personas). |
| **Project manager** | Todos los proyectos, cotizaciones, pagos, presupuesto y gastos, solicitudes del sitio. **Asigna** cada proyecto a un contratista. |
| **Contratista** | Solo los proyectos que le asignan: pasos, materiales, avances con fotos, mensajes con el cliente y los datos del trabajo. **Nunca ve precios, pagos, presupuesto ni gastos.** |

La base de datos hace cumplir estas reglas, no solo la pantalla: aunque un contratista intente leer otra cosa, no la recibe.

### Primera vez: crear el admin
1. Abre `admin.html` y toca **¿Primera vez? Crear la cuenta del admin**.
2. Escribe el **código de configuración**, tu nombre, correo y una contraseña. El código sirve una sola vez.

### Agregar al project manager y a los contratistas
1. Entra como admin. Abajo, en **Equipo**, escribe nombre, correo, rol y la contraseña temporal (ya viene una sugerida).
2. Presiona **Agregar persona**. Aparece un mensaje listo con el enlace, el correo y la contraseña: cópialo o mándalo por WhatsApp.
3. Cada persona puede cambiar su contraseña en **Mi cuenta**.

### Asignar proyectos
En cada proyecto, arriba, **Asignado a** elige Contractor 1 o Contractor 2. En la lista de proyectos hay filtros por contratista y **Sin asignar**.

## Base de datos
Ya está creada en Supabase (proyecto `cplus`) y conectada en `config.js`. La función `team` (en `supabase/functions/team`) crea las cuentas, porque eso necesita una llave secreta que nunca va en el sitio.
Recomendado: en Supabase > **Authentication > Sign In / Providers**, apaga **Allow new users to sign up**.

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

## Google, reseñas y español (versión 4)
- **Dos páginas:** `index.html` (inglés) y `es.html` (español), cada una con su título y descripción, enlazadas entre sí para que Google muestre la correcta. Los botones ES/EN cambian de página. `es.html` se genera desde `index.html` con `tools/build-es.py`: si cambias textos, pídeme regenerarla.
- **Datos para Google:** nombre, teléfono, dirección de South Jordan, servicios y ciudades del Condado de Utah y Salt Lake (dentro de `index.html`), más `sitemap.xml` y `robots.txt`. Si el sitio se pasa a cplusllc.com, hay que cambiar la dirección `https://cgmillan1.github.io/cplus/` en esos archivos.
- **Reseñas:** 5.0 con 7 reseñas en Google, y los botones abren su ficha de Google. Recomendado: que C Plus **reclame su perfil de Google** ("Own this business?").
- **Fotos en la cotización:** el cliente puede subir hasta 5 fotos. Se guardan privadas y se ven en las solicitudes del panel.

## Aviso por correo de cada solicitud
La base de datos llama a la función `lead-alert` con cada solicitud nueva. Para que mande correos:
1. Crea una cuenta gratis en resend.com y una **API key**.
2. En Supabase: **Edge Functions > Secrets** agrega `RESEND_API_KEY` con esa llave.
3. Mientras no verifiques el dominio cplusllc.com en Resend, solo puede enviar al correo con el que abriste Resend. Para mandarlo al project manager, verifica el dominio y agrega `RESEND_FROM` = `C Plus <avisos@cplusllc.com>`.
Por defecto avisa al admin y a los project managers del Equipo (no a las cuentas demo). Para otra lista, agrega el secreto `ALERT_TO` con correos separados por comas.
