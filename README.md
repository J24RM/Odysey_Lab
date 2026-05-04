# Odissey_Technologies_Team

En el documento se describen las tecnologías, el entorno y la arquitectura del proyecto "Sistema de Preventa PPG Horizon" desarrollado por:

Jesus Rodríguez Mendoza
Dante Hernandez Ramírez
Nicolas Bravo Miguel 
José Juan Nava Ramírez

---

## Sistema de Preventa PPG "Horizon"

Aplicación web B2B de gestión de pedidos para distribuidores de PPG Industries. Permite a clientes realizar solicitudes de productos a través de un catálogo con campañas activas, y a administradores gestionar el inventario, analizar estadísticas y configurar campañas comerciales.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Servidor | Node.js + Express 5 |
| Vistas | EJS (renderizado en servidor) |
| Base de datos | PostgreSQL vía **Supabase** |
| Sesiones | `express-session` + `connect-pg-simple` (tabla `session` en Postgres) |
| Archivos | Multer (imágenes y CSV) |
| Correo | **Resend API** (`resend` npm) |
| Exportaciones | PDFKit (comprobantes) + ExcelJS (reportes) |
| Despliegue | **Railway** |

---

## Configuración de entorno

Requiere un archivo `.env` en la raíz con las siguientes variables:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=          # Cadena de conexión directa a Postgres (para sesiones)
SESSION_SECRET=
RESEND_API_KEY=
PORT=3000
```

**Supabase** actúa como capa de base de datos: todas las consultas se realizan con el SDK JS (`utils/supabase.js`). La tabla `session` se usa como store de sesiones HTTP. El esquema y migraciones de referencia están en `supabase_sql/`.

**Resend** envía el correo de confirmación al registrar una orden (ver `controllers/orden.controller.js` → `registrarOrden`). El remitente por defecto usa el dominio sandbox de onboarding de Resend.

**Railway** sirve como plataforma de despliegue. El comando de inicio es `node app.js` (`npm start`). No hay paso de build; Railway detecta el `package.json` y ejecuta directamente.

---

## Arquitectura

El proyecto sigue un patrón **MVC clásico** sin bundler ni transpilación:

```
app.js                  ← Entrada: middleware, rutas, servidor
routes/                 ← Solo registran URLs y conectan con controllers
admin/                  ← Rutas protegidas (id_rol = 2)
cliente/                ← Rutas protegidas (id_rol = 1)
controllers/            ← Lógica de negocio y manejo de peticiones
models/                 ← Todas las consultas a Supabase/Postgres
views/                  ← Plantillas EJS (admin/ y cliente/)
public/                 ← CSS, JS cliente, imágenes estáticas
uploads/                ← Imágenes de producto subidas por el admin
utils/
supabase.js             ← Cliente Supabase singleton
logger.js               ← Log con zona horaria México
cartcount.js            ← Middleware: inyecta conteo del carrito en vistas
```

Hay dos árboles de rutas separados por rol. Todo lo que entra por `/admin/*` pasa por el middleware `requireAdmin`; `/cliente/*` por `requireCliente`. El token CSRF y la configuración de campaña activa se inyectan como `res.locals` en cada petición protegida (`app.js` líneas 104–185).

El flujo de un pedido va: carrito (`estado = 'carrito'`) → confirmación con el RPC `confirmar_orden` en Supabase → correo vía Resend → exportable como PDF u hoja Excel.