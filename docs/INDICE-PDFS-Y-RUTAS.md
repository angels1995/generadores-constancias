# PDF por versión y estado de rutas

Proyecto: C:/Users/AMD/Desktop/generadores-constancias.

V1 y v2 distinguen los dos diseños de recetas. V1 no significa eliminado ni
inutilizable: ambos se pueden conservar como generadores diferentes. Esta
nomenclatura solo se aplicó a la documentación; no se renombraron archivos,
claves del config ni rutas existentes.

## Todos los PDF de muestra

Cada enlace abre el PDF que ya existe en el proyecto. Estos archivos guardados
no se actualizan automáticamente al cambiar el config. Los PDF locales pueden
contener identificadores de demostración sin registro público.

| Documento | PDF | Imágenes vacías en el config actual |
| --- | --- | --- |
| CITT MINSA | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/citt-nuevo-diseno-muestra.pdf>) | Ninguna |
| Constancia MINSA | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/minsa-nuevo-diseno-muestra.pdf>) | Ninguna |
| Receta MINSA v1, dos columnas | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-demostracion-local.pdf>) | Una imagen combinada de firma y sello |
| Receta MINSA/SIS v2, compacta | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-minsa-compacta-local.pdf>) | Firma y sello |
| CITT EsSalud | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-pendiente-firma.pdf>) | Firma y sello |
| Certificado EsSalud | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-certificado-local.pdf>) | Firma y sello |
| Receta EsSalud v1, azul | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/essalud-receta-local.pdf>) | Firma y sello |
| Receta EsSalud v2, compacta | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/receta-essalud-compacta-local.pdf>) | Firma y sello |
| Clínica La Luz: certificado | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-certificado-local.pdf>) | Firma y sello |
| Clínica La Luz: receta | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-receta-local.pdf>) | Firma y sello |
| Clínica La Luz: descanso | [Abrir PDF](<C:/Users/AMD/Desktop/generadores-constancias/output/pdf/laluz-descanso-local.pdf>) | Firma y sello |

Logos e isotipo disponibles. Firma/sello pueden permanecer null mientras se
revisa el diseño. Médico/CMP están vacíos en los perfiles v2 y La Luz; la guía
detallada indica cuáles leen esos datos del config y cuáles del payload.

## Rutas que ya existen

No está todo publicado ni todo enrutado. Estado según código local y último
despliegue documentado en ENTORNO-LOCAL.md; no se revalidó el VPS para esta guía.
El panel usa https://api.sin-flower.com; el backend de generadores usa
https://descanso-api.sin-flower.com. Todos los endpoints de generación son POST.

| Documento | Backend actual | Ruta del panel documentada | Estado |
| --- | --- | --- | --- |
| CITT MINSA | /api/citt/generar | /api/descanso-citt | Despliegue documentado |
| Constancia MINSA | /api/minsa/generar | /api/descanso-minsa | Despliegue documentado |
| Receta MINSA v1 | /api/receta/generar | /api/receta-minsa | Despliegue documentado |
| CITT EsSalud | /api/essalud/citt-demo/generar | /api/descanso-essalud | Despliegue documentado |
| Certificado EsSalud | /api/essalud/certificado/generar | Sin alta documentada | Solo endpoint local |
| Receta EsSalud v1 | /api/essalud/receta/generar | Sin alta documentada | Solo endpoint local |
| Receta MINSA/SIS v2 | Sin endpoint | Sin alta | Candidato local |
| Receta EsSalud v2 | Sin endpoint | Sin alta | Candidato local |
| La Luz: certificado | Sin endpoint | Sin alta | Candidato local |
| La Luz: receta | Sin endpoint | Sin alta | Candidato local |
| La Luz: descanso | Sin endpoint | Sin alta | Candidato local |

## Propuesta de nombres para el panel: todavía NO creados

Mantener las cuatro rutas actuales protege a los clientes existentes. Se pueden
añadir rutas o alias separados por versión, sin cambiar los destinos anteriores:

| Documento | Ruta adicional propuesta en el panel |
| --- | --- |
| Receta MINSA v1 | /api/receta-minsa-v1 (alias del generador v1 actual) |
| Receta MINSA/SIS v2 | /api/receta-minsa-v2 |
| Receta EsSalud v1 | /api/receta-essalud-v1 |
| Receta EsSalud v2 | /api/receta-essalud-v2 |
| Certificado EsSalud | /api/certificado-essalud |
| La Luz: certificado | /api/laluz-certificado |
| La Luz: receta | /api/laluz-receta |
| La Luz: descanso | /api/laluz-descanso |

Antes de publicar los candidatos faltan integración HTTP/registro/verificación,
pruebas de contrato, revisión de payloads y alta en el panel con sus permisos.
No se ejecutó ninguna de esas publicaciones al crear este índice. Los nuevos
endpoints deben devolver una URL de verificación coherente con el tipo real de
documento, sin presentar una muestra local como un registro válido.

## Carpetas, nombres de imágenes y claves

[Abrir guía completa de recursos](<C:/Users/AMD/Desktop/generadores-constancias/docs/GUIA-COMPLETAR-RECURSOS.md>)

[Abrir configuración global](<C:/Users/AMD/Desktop/generadores-constancias/config/recursos-pdf.json>)
