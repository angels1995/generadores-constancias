# Constancias API (MINSA)

API en Node.js + Express que genera constancias en PDF, guarda el código de
verificación en Postgres y devuelve los datos junto al PDF en base64.

## 1. Instalar dependencias

```
npm install
```

Esto instala, entre otras cosas, `puppeteer` (que descarga un Chromium
propio, ~300MB) y `qrcode`. En un VPS con poca memoria, si la instalación
falla por RAM, prueba con `npm install --no-optional` o sube el swap
temporalmente.

## 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa:

- `DATABASE_URL`: tu cadena de conexión Postgres. Si sigues usando la base
  de Supabase, la encuentras en *Project Settings → Database → Connection
  string* (usa la de "Session pooler" o la directa, ambas sirven).
- `PORT`: puerto donde correrá la API.
- `ORIGIN_PERMITIDO`: el dominio de tu frontend en Cloudflare Pages (CORS).
- `VERIFICADOR_URL_BASE`: la URL pública del verificador, se usa para armar
  el link que va dentro del QR.

## 3. Crear la tabla en Postgres

Ejecuta el contenido de `sql/001_constancias_minsa.sql` contra tu base
(en el SQL Editor de Supabase, o con `psql $DATABASE_URL -f sql/001_constancias_minsa.sql`).

Si la tabla `constancias_minsa` ya existía de la versión anterior, solo
necesitas la línea comentada al final del archivo para agregar la columna
`valido_hasta`.

## 4. Colocar las imágenes

Pon estos dos archivos dentro de `src/assets/` (mismo nombre exacto):

- `minsasello_certificado.png`
- `minsafirma_certificado.png`

Ver `src/assets/LEEME.txt` para más detalle.

## 5. Levantar el servidor

```
npm start
```

Deberías ver `API de constancias escuchando en el puerto 3000` (o el puerto
que pusiste). Prueba que responde:

```
curl http://localhost:3000/health
```

## 6. Generar una constancia de prueba

```bash
curl -X POST http://localhost:3000/api/minsa/generar \
  -H "Content-Type: application/json" \
  -d '{
    "hospital": "Hospital Nacional Dos de Mayo",
    "paciente_nombre": "Juan Perez Lopez",
    "paciente_nacimiento": "1990-05-12",
    "paciente_dni": "12345678",
    "fecha_atencion": "2026-06-17",
    "hora_atencion": "09:30",
    "descanso_fin": "2026-06-19",
    "diagnostico": "J00 Resfriado comun",
    "sintomas": ["Fiebre", "Tos", "Dolor de cabeza"]
  }'
```

La respuesta es JSON con `autog`, `valido_hasta`, `datos` (todos los campos
ya formateados que se usaron para llenar el PDF) y `pdf_base64`. Para
guardar el PDF a un archivo desde la terminal:

```bash
curl -s ... | node -e "const d=JSON.parse(require('fs').readFileSync(0));require('fs').writeFileSync('test.pdf', Buffer.from(d.pdf_base64,'base64'))"
```

## 7. Verificar un código

```
curl http://localhost:3000/api/minsa/verificar/MINSA-XXXXXXXX
```

Devuelve el registro guardado más el campo `vigente: true/false`.

## Notas de diseño

- El backend calcula `descanso_inicio` a partir de `fecha_atencion` +
  `hora_atencion` (regla de las 5pm), ya no se confía en lo que mande el
  frontend.
- `valido_hasta = descanso_fin + 1 día`. El verificador (o cualquier
  cliente) decide vigente/vencido comparando la fecha de hoy en Peru
  contra esa columna.
- El PDF se genera con Puppeteer (Chromium headless) cargando la plantilla
  HTML con los datos ya insertados — visualmente es el mismo diseño que
  ya tenías, solo que ahora se renderiza en el servidor en vez del
  navegador del usuario.
- Quité la fuente de Google Fonts (Courier Prime) de la plantilla para que
  el render no dependa de internet; usa Courier New como fallback. Si la
  quieres de vuelta dime y la dejo cacheada localmente como @font-face.
- Pendiente para próximos generadores (CITT, receta, certificado EsSalud):
  pásame su plantilla HTML y su lógica JS actual y los agrego siguiendo el
  mismo patrón en `src/generadores/`.
