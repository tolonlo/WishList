# Nuestra wishlist · Biblioteca de deseos en pareja

Aplicación web para que dos personas escriban su lista de deseos y consulten la del otro en silencio, marcando en secreto qué regalos ya compraron. Inspirada en el lenguaje editorial de *Cerebro Helsinki* (estante de carpetas-libro + pliegos a doble página).

---

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v4 + Framer Motion**
- **Fuentes**: `Cormorant Garamond` (serif editorial) + `Manrope` (sans geométrica) vía `next/font/google`
- **Base de datos**: **Neon / Vercel Postgres** (`@neondatabase/serverless`) — con respaldo automático a **PGlite** en `./.pglite` cuando `DATABASE_URL` está vacío en desarrollo local
- **Imágenes**: **Vercel Blob** (`@vercel/blob`) — con respaldo automático a `./public/uploads` en desarrollo local y compresión/redimensionado previo en el navegador (`<= 1600px` WebP/JPEG)
- **Autenticación**: 2 usuarios definidos en variables de entorno, cookie `httpOnly` firmada con `jose` (HS256, 30 días), protegida en `src/proxy.ts` y verificada en cada Route Handler

---

## Variables de entorno (`.env.example`)

| Variable | Obligatoria en Vercel | Descripción |
| --- | --- | --- |
| `USER1_NAME` | Sí | Nombre visible del primer miembro de la pareja (ej. `Tomás`) |
| `USER1_PASS` | Sí | Contraseña del primer usuario |
| `USER2_NAME` | Sí | Nombre visible del segundo miembro de la pareja (ej. `Valentina`) |
| `USER2_PASS` | Sí | Contraseña del segundo usuario |
| `AUTH_SECRET` | Sí | Secreto de al menos 32 caracteres para firmar el JWT (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |
| `DATABASE_URL` | Sí | Cadena de conexión de Neon / Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | Sí | Token de lectura/escritura de Vercel Blob |

---

## Desarrollo local

1. Copia las variables de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
   *(En local no necesitas rellenar `DATABASE_URL` ni `BLOB_READ_WRITE_TOKEN`: la app crea sola una base Postgres embebida en `./.pglite` aplicando `db/migrations/001_init.sql` y guarda imágenes en `./public/uploads`).*

2. Instala dependencias y arranca el servidor:
   ```bash
   npm install
   npm run dev
   ```

3. Abre `http://localhost:3000`.

---

## Paso a paso para desplegar en Vercel

1. **Subir el repositorio a GitHub / GitLab / Bitbucket** e importarlo como proyecto nuevo en [vercel.com/new](https://vercel.com/new).
2. **Crear la base de datos Postgres (Neon)**:
   - En el panel del proyecto en Vercel ve a **Storage → Create Database → Neon Postgres** (Serverless Postgres).
   - Al conectarla al proyecto, Vercel inyecta automáticamente `DATABASE_URL`.
   - Abre la consola SQL de Neon (pestaña **Query** en Vercel Storage o consola de Neon) y pega el contenido completo de [`db/migrations/001_init.sql`](./db/migrations/001_init.sql) para crear las tablas `items`, `item_images` y `purchase_status`.
3. **Crear el almacenamiento de imágenes (Vercel Blob)**:
   - En **Storage → Create Database → Blob** crea un store **Public**.
   - Al conectarlo al proyecto, Vercel añade automáticamente `BLOB_READ_WRITE_TOKEN`.
4. **Configurar las variables de autenticación**:
   - En **Settings → Environment Variables** añade:
     - `USER1_NAME` y `USER1_PASS`
     - `USER2_NAME` y `USER2_PASS`
     - `AUTH_SECRET` (mínimo 32 caracteres aleatorios)
5. **Desplegar**:
   - Haz clic en **Deploy** (o haz push a `main`).

---

## Garantía de privacidad del estado de compra

- El estado (`pendiente` / `comprado`) vive en una tabla independiente `purchase_status (item_id, buyer, status)`.
- Las consultas del dueño (`listarMios` en `src/lib/items.ts`) **jamás hacen `JOIN` ni leen `purchase_status`**: ni el HTML ni las respuestas de `/api/items?libro=mio` incluyen ese campo.
- El endpoint `PUT /api/purchases/[itemId]` exige en SQL que `items.owner = otro` (no permite marcar items propios) y guarda siempre `buyer = sesion.yo`.
