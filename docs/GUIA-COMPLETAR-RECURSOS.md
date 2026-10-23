# Guía por documento: faltantes, carpetas y configuración

Proyecto: **C:/Users/AMD/Desktop/generadores-constancias**.

Configuración única: [abrir recursos-pdf.json](<C:/Users/AMD/Desktop/generadores-constancias/config/recursos-pdf.json>).

Inventario comprobado contra los archivos locales el 22 de octubre de 2026.
Los estados de producción corresponden al último despliegue registrado en
ENTORNO-LOCAL.md; esta guía no realizó consultas ni cambios en el VPS.

## Cómo completar una imagen

1. Guarda tu imagen propia o autorizada en la carpeta indicada, con el nombre
   firma.png o sello.png. Si es JPEG, usa firma.jpg/sello.jpg y la extensión real.
2. Cambia solamente la clave correspondiente en el JSON global.
3. Las rutas del JSON son relativas a src/assets/, con barras /; no escribas C:/...
   ni incluyas src/assets/ en el valor.
4. Deja null si no quieres incorporar esa imagen. No declares un archivo que aún
   no existe: una ruta inexistente detiene la generación.
5. Guarda el JSON y vuelve a generar el PDF para ver el resultado. Los PDF ya
   guardados no cambian al editar la configuración. Cambiar esta PC no actualiza
   automáticamente el servidor ni publica los candidatos locales.

Formatos: PNG/JPEG, hasta 5 MiB por imagen. Los recursos se ajustan
proporcionalmente y centrados en sus cajas; no se giran ni recortan márgenes
blancos automáticamente. Una imagen combinada firma/sello puede ocupar firma
dejando sello en null. Si el recorte tiene mucho espacio blanco, se verá pequeño.
Agregar imágenes no acredita una firma digital ni cambia el estado pendiente.

## Resumen de faltantes

| Documento | Firma | Sello | Médico en JSON global |
| --- | --- | --- | --- |
| CITT MINSA | Ya configurada | Ya configurado | No; datos del payload |
| Constancia MINSA | Ya configurada | Ya configurado | No; datos del payload |
| Receta MINSA v1 (dos columnas) | Vacía (opcional) | Vacío (opcional) | No; datos del payload |
| CITT EsSalud | Ya configurada | Ya configurado | No; datos del payload |
| Certificado EsSalud | Ya configurada | Ya configurado | No; datos del payload |
| Receta EsSalud v1 (azul) | Ya configurada | Ya configurado | No; datos del payload |
| Receta MINSA/SIS v2 (compacta) | Vacía (opcional) | Vacío (opcional) | Sí, nombre/CMP por perfil |
| Receta EsSalud v2 (compacta) | Ya configurada | Vacío (opcional) | Sí, nombre/CMP por perfil |
| Clínica La Luz: certificado | Ya configurada | Vacío (opcional) | Sí, nombre/CMP por perfil |
| Clínica La Luz: receta | Ya configurada | Vacío (opcional) | Sí, nombre/CMP por perfil |
| Clínica La Luz: descanso | Ya configurada | Vacío (opcional) | Sí, nombre/CMP por perfil |

Los once perfiles ya tienen logo configurado y archivo existente. El isotipo de
La Luz descanso también está incluido. No necesitas conseguir esos logos.

## CITT MINSA

Estado: **Último despliegue documentado: producción**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/citt-nuevo-diseno-muestra.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `citt_logo` | `logo_minsa_citt.png` (archivo existente) |
| firma | `citt_firma` | `minsafirma_certificado.png` (archivo existente) |
| sello | `citt_sello` | `sello.png` (archivo existente) |

No falta configurar imágenes en este perfil. Conserva los valores actuales
si no vas a sustituir esos recursos.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
Los campos `medico_nombre` y `medico_cmp` se suministran en el payload del
generador. No añadas claves de médico al JSON esperando que estos renderizadores
las lean automáticamente.
CITT anterior conserva valores de médico/CMP/RNE por defecto en el renderer;
si declaras un profesional en el payload, revisa que corresponda a los recursos.

## Constancia MINSA

Estado: **Último despliegue documentado: producción**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/minsa-nuevo-diseno-muestra.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `minsa_logo` | `logo_minsa_citt.png` (archivo existente) |
| firma | `minsa_firma` | `minsafirma_certificado.png` (archivo existente) |
| sello | `minsa_sello` | `sello.png` (archivo existente) |

No falta configurar imágenes en este perfil. Conserva los valores actuales
si no vas a sustituir esos recursos.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
Los campos `medico_nombre` y `medico_cmp` se suministran en el payload del
generador. No añadas claves de médico al JSON esperando que estos renderizadores
las lean automáticamente.

## Receta MINSA v1 (dos columnas)

Estado: **Último despliegue documentado: producción**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-demostracion-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `receta_minsa_logo` | `logo_minsa_citt.png` (archivo existente) |
| firma_sello | `receta_minsa_firma_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **firma-sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta/firma-sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "receta_minsa_firma_sello": "receta/firma-sello.png"
}
```

Este perfil v1 usa **una sola imagen combinada** de firma/sello, repetida bajo
las tablas de ambas columnas. Sustituye las dos claves independientes anteriores
por receta_minsa_firma_sello. El recuadro y textos que incluya tu imagen se
conservan completos, sin recortarla. La receta compacta v2 mantiene sus claves.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
Los campos `medico_nombre` y `medico_cmp` se suministran en el payload del
generador. No añadas claves de médico al JSON esperando que estos renderizadores
las lean automáticamente.

## CITT EsSalud

Estado: **Último despliegue documentado: producción**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-pendiente-firma.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/citt](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/citt>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `essalud_citt_logo` | `essalud/logo.png` (archivo existente) |
| firma | `essalud_citt_firma` | `essalud/citt/firma.png` (archivo existente) |
| sello | `essalud_citt_sello` | `essalud/citt/sello.png` (archivo existente) |

No falta configurar imágenes en este perfil. Conserva los valores actuales
si no vas a sustituir esos recursos.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
El nombre se envía en el payload como `medico_nombre`; este CITT no tiene campos
separados de CMP/especialidad en su contrato actual.

## Certificado EsSalud

Estado: **Solo local**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-certificado-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/certificado](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/certificado>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `essalud_certificado_logo` | `essalud/certificado/logo.png` (archivo existente) |
| firma | `essalud_certificado_firma` | `essalud/certificado/firma.png` (archivo existente) |
| sello | `essalud_certificado_sello` | `essalud/certificado/sello.png` (archivo existente) |

No falta configurar imágenes en este perfil. Conserva los valores actuales
si no vas a sustituir esos recursos.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
Los campos `medico_nombre` y `medico_cmp` se suministran en el payload del
generador. No añadas claves de médico al JSON esperando que estos renderizadores
las lean automáticamente.
El certificado también admite `medico_especialidad` y `medico_rne` en el payload.

## Receta EsSalud v1 (azul)

Estado: **Solo local; diseño v1 conservado**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-receta-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/receta](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/receta>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `essalud_receta_logo` | `essalud/receta/logo.png` (archivo existente) |
| firma | `essalud_receta_firma` | `essalud/receta/firma.png` (archivo existente) |
| sello | `essalud_receta_sello` | `essalud/receta/sello.png` (archivo existente) |

No falta configurar imágenes en este perfil. Conserva los valores actuales
si no vas a sustituir esos recursos.

Este perfil todavía **no lee el nombre del médico desde el JSON global**.
Los campos `medico_nombre` y `medico_cmp` se suministran en el payload del
generador. No añadas claves de médico al JSON esperando que estos renderizadores
las lean automáticamente.

## Receta MINSA/SIS v2 (compacta)

Estado: **Candidato local; no conectado a API**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-minsa-compacta-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta/compacta](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta/compacta>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `receta_minsa_compacta_logo` | `receta/compacta/logo-sis.png` (archivo existente) |
| firma | `receta_minsa_compacta_firma` | `null` (vacío) |
| sello | `receta_minsa_compacta_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **firma.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta/compacta/firma.png`.
- **sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/receta/compacta/sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "receta_minsa_compacta_firma": "receta/compacta/firma.png",
  "receta_minsa_compacta_sello": "receta/compacta/sello.png"
}
```

Textos editables en el mismo JSON (actualmente vacíos):

```json
{
  "receta_minsa_compacta_medico_nombre": "CALLE PEÑA MOISES ANDRES",
  "receta_minsa_compacta_medico_cmp": "045187"
}
```

Nombre/CMP y demás valores configurados se usan cuando el payload no aporta
un texto no vacío. Un valor explícito del payload prevalece. Cambiar el nombre
no mueve su posición: el renderizador conserva las coordenadas y ajusta el texto
a la caja disponible.

## Receta EsSalud v2 (compacta)

Estado: **Candidato local; no conectado a API**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-essalud-compacta-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/receta/compacta](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/receta/compacta>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `essalud_receta_compacta_logo` | `essalud/receta/compacta/logo.png` (archivo existente) |
| firma | `essalud_receta_compacta_firma` | `essalud/receta/compacta/firma.png` (archivo existente) |
| sello | `essalud_receta_compacta_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/essalud/receta/compacta/sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "essalud_receta_compacta_sello": "essalud/receta/compacta/sello.png"
}
```

Textos editables en el mismo JSON (actualmente vacíos):

```json
{
  "essalud_receta_compacta_medico_nombre": "CALLE PEÑA MOISES ANDRES",
  "essalud_receta_compacta_medico_cmp": "045187"
}
```

Nombre/CMP y demás valores configurados se usan cuando el payload no aporta
un texto no vacío. Un valor explícito del payload prevalece. Cambiar el nombre
no mueve su posición: el renderizador conserva las coordenadas y ajusta el texto
a la caja disponible.

## Clínica La Luz: certificado

Estado: **Candidato local; no conectado a API**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-certificado-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/certificado](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/certificado>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `laluz_certificado_logo` | `clinica-la-luz/certificado/logo.png` (archivo existente) |
| firma | `laluz_certificado_firma` | `clinica-la-luz/certificado/firma.png` (archivo existente) |
| sello | `laluz_certificado_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/certificado/sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "laluz_certificado_sello": "clinica-la-luz/certificado/sello.png"
}
```

Textos editables en el mismo JSON (actualmente vacíos):

```json
{
  "laluz_certificado_medico_nombre": "",
  "laluz_certificado_medico_cmp": "",
  "laluz_certificado_medico_especialidad": "",
  "laluz_certificado_sede": "",
  "laluz_certificado_direccion": "",
  "laluz_certificado_ubicacion": ""
}
```

Nombre/CMP y demás valores configurados se usan cuando el payload no aporta
un texto no vacío. Un valor explícito del payload prevalece. Cambiar el nombre
no mueve su posición: el renderizador conserva las coordenadas y ajusta el texto
a la caja disponible.

En los payloads de muestra La Luz, sede/dirección/ubicación tienen textos de
demostración explícitos. Pon esos campos en null en el payload si quieres
que se tomen del JSON global.

## Clínica La Luz: receta

Estado: **Candidato local; no conectado a API**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-receta-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/receta](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/receta>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `laluz_receta_logo` | `clinica-la-luz/receta/logo.png` (archivo existente) |
| firma | `laluz_receta_firma` | `clinica-la-luz/receta/firma.png` (archivo existente) |
| sello | `laluz_receta_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/receta/sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "laluz_receta_sello": "clinica-la-luz/receta/sello.png"
}
```

Textos editables en el mismo JSON (actualmente vacíos):

```json
{
  "laluz_receta_medico_nombre": "",
  "laluz_receta_medico_cmp": "",
  "laluz_receta_medico_especialidad": "",
  "laluz_receta_sede": "",
  "laluz_receta_direccion": "",
  "laluz_receta_ubicacion": ""
}
```

Nombre/CMP y demás valores configurados se usan cuando el payload no aporta
un texto no vacío. Un valor explícito del payload prevalece. Cambiar el nombre
no mueve su posición: el renderizador conserva las coordenadas y ajusta el texto
a la caja disponible.

En los payloads de muestra La Luz, sede/dirección/ubicación tienen textos de
demostración explícitos. Pon esos campos en null en el payload si quieres
que se tomen del JSON global.

## Clínica La Luz: descanso

Estado: **Candidato local; no conectado a API**.

[Abrir PDF de referencia local](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-descanso-local.pdf>). Es una muestra guardada; puede
ser anterior a los últimos valores del JSON.

Carpeta: [C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/descanso](<C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/descanso>)

| Recurso | Clave exacta en config | Valor actual |
| --- | --- | --- |
| logo | `laluz_descanso_logo` | `clinica-la-luz/descanso/logo.png` (archivo existente) |
| isotipo | `laluz_descanso_isotipo` | `clinica-la-luz/descanso/isotipo.png` (archivo existente) |
| firma | `laluz_descanso_firma` | `receta/compacta/firma.png` (archivo existente) |
| sello | `laluz_descanso_sello` | `null` (vacío) |

Para completar los espacios vacíos, guarda:

- **sello.png** en `C:/Users/AMD/Desktop/generadores-constancias/src/assets/clinica-la-luz/descanso/sello.png`.

Después edita estas claves dentro del JSON existente:

```json
{
  "laluz_descanso_sello": "clinica-la-luz/descanso/sello.png"
}
```

Textos editables en el mismo JSON (actualmente vacíos):

```json
{
  "laluz_descanso_medico_nombre": "",
  "laluz_descanso_medico_cmp": "",
  "laluz_descanso_medico_especialidad": "",
  "laluz_descanso_sede": "",
  "laluz_descanso_direccion": "",
  "laluz_descanso_ubicacion": ""
}
```

Nombre/CMP y demás valores configurados se usan cuando el payload no aporta
un texto no vacío. Un valor explícito del payload prevalece. Cambiar el nombre
no mueve su posición: el renderizador conserva las coordenadas y ajusta el texto
a la caja disponible.

En los payloads de muestra La Luz, sede/dirección/ubicación tienen textos de
demostración explícitos. Pon esos campos en null en el payload si quieres
que se tomen del JSON global.

## Qué no hace falta completar para probar el diseño

Puedes mantener firmas/sellos y médico vacíos en los candidatos recientes.
Logos, QR y maquetación ya están preparados. El código local de una muestra
no existe en la base de producción y no debe interpretarse como validación real.

No cambies las claves de un modelo anterior para configurar otro nuevo:
receta_minsa_* y receta_minsa_compacta_* son perfiles diferentes, igual que
essalud_receta_* y essalud_receta_compacta_*.

## Coordenadas y contratos detallados

- [Recetas compactas MINSA/SIS y EsSalud](<C:/Users/AMD/Desktop/generadores-constancias/docs/RECETAS-COMPACTAS-CANDIDATO.md>).
- [Clínica La Luz: tres documentos y sus coordenadas](<C:/Users/AMD/Desktop/generadores-constancias/docs/LALUZ-CANDIDATOS.md>).
- [Certificado EsSalud](<C:/Users/AMD/Desktop/generadores-constancias/docs/ESSALUD-CERTIFICADO-API.md>).
- [Receta EsSalud anterior](<C:/Users/AMD/Desktop/generadores-constancias/docs/ESSALUD-RECETA-API.md>).
