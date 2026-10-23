## Preparación de Git (22 de octubre de 2026)

- Revisados ENTORNO, diff local completo y copia del código remoto. Sin secretos en el paquete de revisión. Copias privadas PC en tmp/alineacion-git/ y VPS en /root/alineacion-codigo-20261022.tar.gz; antes de alinear se crea además respaldo completo privado del servidor.
- El JSON activo config/recursos-pdf.json y las imágenes locales se conservan intactos. JSON activo excluido de Git; plantilla versionada config/recursos-pdf.example.json basada en producción. El despliegue instala la plantilla únicamente cuando cambia en un commit.
- Imágenes profesionales nuevas de referencia excluidas de la publicación inicial; no se borran. Recursos propios/autorizados excluidos requieren add -f deliberado. No cambia el estado de firma.
- Script usa acceso SSH GitHub existente de root para fetch, checkout como appuser, Python explícito y ambas migraciones aditivas. Conserva payloads y rutas del panel.
- Verificador publicado 04b483a: eliminada fila duplicada de estado en receta y pendientes; cabecera pendiente conservada. No se añadió interruptor para acreditar validación ficticia. Prueba navegador de cinco tipos, XSS, códigos inválidos y móvil aprobada.

# Carpeta principal de trabajo

## Tarjeta del verificador y guía Git (22 de octubre de 2026)

- Aceptado por el usuario: recuperar estructura visual anterior con estado
  pendiente. DOC/EsSalud usan tarjeta con cabecera azul, icono reloj, filas y botón
  Nueva consulta. Texto resumido: registro interno encontrado, pendiente de
  validación y firma profesional. No presenta documentos como válidos/auténticos
  ni publica identidad o clínica. El pie mantiene la ausencia de acreditación.
- Verificador publicado en descanso_pages, commit faabe79 con trailer
  Intervenido-por: Codex (ChatGPT). Pruebas navegador de cinco tipos, XSS/404/móvil
  y revisión visual escritorio/móvil aprobadas. CITT/MINSA previos preservados.
- docs/GIT-IMAGENES.md ahora muestra add de config y todo src/assets/; no se
  ejecutó Git sobre recursos ni config del usuario. Sigue pendiente alinear los
  árboles para poder usar el .bat. .gitignore también oculta descargas DOC-*.pdf
  del cliente en la raíz, sin borrarlas.

## Limpieza Git y cliente Python (22 de octubre de 2026)

- .gitignore ampliado para tmp/output/respaldos, archivos de entorno privados,
  llaves y cachés. No se borró ni dejó de seguir ningún archivo; no hubo add,
  commits, pushes, despliegue o reinicios en este ajuste.
- Se reprodujo 403 Cloudflare 1010 con Python-urllib; agente legítimo del cliente
  generadores-constancias/1.0 llega al panel y devuelve 401 sin token. Sin cambios
  a las reglas Cloudflare, permisos o whitelist.
- Cliente muestra detail/data anidados, código y CF-Ray cuando existen, sin
  volcar cuerpo/credenciales. Tres pruebas Python aprobadas; prueba de red sin
  token ni generación real. Guía docs/GIT-IMAGENES.md incluye add selectivo y
  aclara el bloqueo actual del .bat por repositorios pendientes de alinear.

## Publicación versionada y panel (22 de octubre de 2026)

- Backend publicado mediante paquete de 41 archivos explícitos, sobre app.js del
  VPS revisado; no se sobrescribieron cambios ajenos. Respaldo privado
  /root/constancias-backup-versionados-20261023-043601/originales.tar.
- Siete tipos nuevos POST /api/documentos/:tipo/generar, GET
  /api/documentos/verificar/:autog. Tabla aditiva documentos_pendientes: código,
  tipo, estado fijo pendiente, huella y fecha; sin identidad ni contenido clínico.
- Panel: ids 133..140, slugs receta-minsa-v1 (alias del anterior), receta-minsa-v2,
  receta-essalud-v1, receta-essalud-v2, certificado-essalud, laluz-certificado,
  laluz-receta y laluz-descanso, asignados únicamente a sinflower. Rutas 87/88/131/132
  preservadas. Respaldo /home/mainuser/.cache/codex-versionados-20261022-a1/.
- Recursos locales manualmente añadidos por el usuario se conservaron. No se
  activaron en producción las firmas/sellos copiados de plantillas: perfiles
  nuevos firma/sello null y médico por defecto vacío. Config local y config VPS
  difieren intencionalmente; no desplegar a ciegas el JSON local.
- Verificador compartido admite ?documento=DOC-32HEX, con tipo/estado/huella sin
  paciente o diagnóstico y sin atribución institucional. Commit 83f5300 publicado
  solo en descanso_pages. Sin commits/pushes en generadores, sin credenciales en Git.
- 58 pruebas locales y 55 sobre copia aislada VPS aprobadas, siete generaciones
  ficticias con registro mínimo, verificación pública real Chrome/móvil y destinos
  desde panel comprobados. Permisos sinflower comprobados por separado en BD.
  Token técnico RENIEC recibió 403: no se disponía del token de sinflower para
  una prueba autenticada integral, ni se ampliaron permisos a otra cuenta.
- Solo se reinició constancias-api; health 200. Contratos, payloads y cliente Python
  estándar: docs/RUTAS-PRODUCCION-Y-PYTHON.md, docs/rutas-publicacion.json,
  docs/payloads-publicacion/ y scripts/consumir-generadores.py.
- El .bat de Git todavía se detiene por los árboles con cambios sin commit. Hay
  que revisar/versionar/alinear PC y VPS antes del primer despliegue por pull.
  Sustituir solo una imagen ya configurada en el servidor se lee al generar el
  siguiente PDF; no requiere reinicio de PM2.

## Receta MINSA v1: imagen combinada de firma/sello (solo local)

- A pedido del usuario, sustituidas las claves receta_minsa_firma y
  receta_minsa_sello por receta_minsa_firma_sello, null por defecto. Archivo
  sugerido src/assets/receta/firma-sello.png; valor receta/firma-sello.png.
- Se imprime la misma imagen completa bajo la tabla de cada columna, centrada
  en caja de 294x106.5 px como el recurso combinado de referencia (392x142).
  No se extrajo ni activó la firma/sello del médico del PDF aportado.
- Payload, registro y QR no cambian. Receta v2 y demás perfiles no se alteran.
  Actualizados renderer, pruebas, README y guías; muestra v1 regenerada.
- Ocho pruebas dirigidas y renders Chrome reales 1/9/30 aprobados (BD simulada,
  sin RENIEC). Sin despliegue, commits ni pushes. Antes de desplegar, publicar
  juntos renderer y JSON revisados: el servidor conserva sus claves anteriores.

## Clínica La Luz: tres muestras locales (22 de octubre de 2026)

- Preparados certificado, receta de dos columnas y descanso en
  prototipos/clinica-la-luz/. PDF revisados en output/pdf/laluz-*-local.pdf.
  Pendientes de validación/firma; códigos LOCAL-* sin registro público.
- Logos nativos extraídos sin recomprimir; carpetas src/assets/clinica-la-luz/
  certificado, receta y descanso. Isotipo adicional para descanso. No se copiaron
  imágenes de firma/sello del profesional de referencia.
- config/recursos-pdf.json incorpora perfiles laluz_certificado_*, laluz_receta_*
  y laluz_descanso_*: imágenes, médico/CMP/especialidad, sede/dirección/ubicación.
  Textos y firma/sello vacíos por defecto. Coordenadas en docs/LALUZ-CANDIDATOS.md.
- Validación de fechas/horas declaradas sin regla de las 17:00; edad calculada
  al atender desde nacimiento si se aporta, RENIEC optativo y simulado en pruebas.
  Receta reutiliza validarReceta/ATC, separa seguro/atención y pagina ambas columnas.
- 56 pruebas Node aprobadas; renders reales, ajustes con imagen neutra, rechazo de
  exceso en documentos de una página y recetas 1/9/30 productos completas en ambas
  columnas (1/5/15 páginas con la pauta ficticia extensa). Revisión visual final.
- Payloads docs/laluz-*-payload.json y contrato docs/LALUZ-CANDIDATOS.md.
  Manual español CIE-10-ES revisado como referencia; no se implementó un buscador
  ni se cambiaron lain-core, rutas activas, BD, dependencias o producción.
  No hubo consultas reales RENIEC, commits, pushes ni despliegue en esta tarea.

## Candidatos compactos de recetas (local, 22 de octubre de 2026)

- Revisión posterior: fuentes Liberation 2.1.5 aportadas por el usuario integradas
  en src/assets/fonts/liberation/ con licencia; ambas recetas incrustan Sans
  regular/bold y Mono bold. Configuración global ampliada con médico_nombre/CMP
  por perfil compacto y farmacia por defecto 15856189-FARMACIA PRINCIPAL.
- AUTOG./H/C con referencias internas INT-* estables por DNI de muestra, acto
  interno aleatorio por preparación; no son numeración oficial ni historias reales.
  Edad detallada calculada desde nacimiento para la fecha de atención. Sin consultas
  RENIEC reales. Nombre del médico conserva x=70/y=730 pt; las imágenes conservan
  sus cajas y proporciones. Todo sigue local, sin integrar estos candidatos a las APIs.
- Revisión completada: 52 pruebas Node aprobadas, seis renders de paginación con
  fuentes incrustadas y validación de la posición del médico en todas sus páginas.
  Muestras finales de ambos perfiles revisadas visualmente. Sin despliegue.

- Nuevas referencias RECETA_MINSA-44445555.pdf y RECETA_ESSALUD-44445555.pdf:
  implementadas como candidatos aislados en prototipos/recetas-compactas/.
  Muestras output/pdf/receta-minsa-compacta-local.pdf y receta-essalud-compacta-local.pdf.
- Logos nativos extraídos a src/assets/receta/compacta/ y
  src/assets/essalud/receta/compacta/. Perfiles aditivos en config/recursos-pdf.json,
  firma/sello null; sin extraer como recursos reutilizables las firmas de referencia.
- Sin sustitución de renderizadores activos, despliegue, BD, RENIEC, commits o pushes.
  Contrato propuesto y campos nuevos en docs/RECETAS-COMPACTAS-CANDIDATO.md.
  Los campos adicionales todavía no son consumidos por las APIs activas.
- 49 pruebas Node aprobadas; seis renders adicionales (1/9/30 productos por perfil),
  contenido completo y enlaces coherentes; revisión visual de ambos modelos y última
  página multipágina. Códigos LOCAL-* sin registro público ni datos de pacientes reales.

Abrir en VS Code: `C:\Users\AMD\Desktop\generadores-constancias`.

Repositorio: `git@github.com:angels1995/generadores-constancias.git`.
Rama de trabajo: `trabajo/generadores`.

## Base conservada

- Último commit de GitHub al preparar esta carpeta: `439677c`.
- `package.json` y `package-lock.json`: copiados del VPS para conservar la dependencia `express-rate-limit`.
- `src/lib/pdf.js`: conserva el cambio local pendiente de la copia anterior.
- Los tres archivos anteriores quedan sin commit para revisarlos antes de publicar.

## Copias de referencia

- Copia local anterior, intacta: `C:\Users\AMD\Desktop\generadores\salud\constancias-api`.
- Copia del código del VPS, intacta: `C:\Users\AMD\Desktop\generadores-vps`.
- `C:\Users\AMD\Desktop\constancias-api` es una copia anterior sin Git.

## Desarrollo

1. Copiar `.env.example` a `.env` y configurar una base PostgreSQL local de desarrollo. Revisar las migraciones en `sql/`.
2. Instalar el navegador de Puppeteer si no está disponible: `npx puppeteer browsers install chrome`.
3. Ejecutar `npm run dev`. Consultar `/health` en el puerto configurado.

No se copiaron credenciales del VPS. La instalación inicial de dependencias omite la descarga del navegador. No hay un script de pruebas automatizadas configurado; los archivos `test-minsa.js` y `test-citt.js` son pruebas manuales y deben revisarse antes de ejecutarlos.

## Archivos principales

- `src/generadores/`: lógica de los generadores.
- `src/templates/`: plantillas HTML.
- `src/routes/generar.js`: rutas de generación.
- `src/routes/verificar.js`: rutas de verificación.
- `src/lib/`: PDF, QR, base de datos y utilidades compartidas.
- `sql/`: migraciones.

## GitHub y despliegue

Revisar `git status` y `git diff` antes de crear commits. Publicar una rama de trabajo con `git push -u origin trabajo/generadores` cuando los cambios estén revisados.

El VPS está en `62.171.156.216:22`; el proyecto está en `/var/www/constancias-api`. Actualmente PM2 ejecuta la API y el túnel de Cloudflare como `root`. El túnel publica `descanso-api.sin-flower.com` hacia el puerto 3000.

Subir a GitHub no despliega automáticamente. Antes del próximo despliegue hay que conservar los cambios sin commit del servidor, revisar las diferencias, actualizar dependencias si corresponde y validar la API tras reiniciarla. No se hizo ningún despliegue al preparar este entorno.

## Integración verificada con el panel (22 de octubre de 2026)

El alias SSH `panel-vps` conecta como `mainuser` a `75.119.155.26:22`. El backend del panel está en `/home/mainuser/sinflower-backend` y PM2 lo ejecuta como `sinflower-backend`.

Las rutas están configuradas en la tabla `routes` de PostgreSQL. Se consultaron únicamente los metadatos de las rutas relacionadas:

| Ruta del panel | Método | Destino del proxy | Estado |
| --- | --- | --- | --- |
| `/api/descanso-citt` (id 87) | POST | `https://descanso-api.sin-flower.com/api/citt/generar` | Activa |
| `/api/descanso-minsa` (id 88) | POST | `https://descanso-api.sin-flower.com/api/minsa/generar` | Activa |

`src/modules/proxy/proxy.routes.js` del panel resuelve el slug en la base de datos y comprueba token, IP, permisos y límites. `proxy.service.js` reenvía método y cuerpo JSON al destino configurado y devuelve el estado y contenido de la respuesta. Mantener la compatibilidad de estos endpoints al modificar los generadores.

Se verificó desde el VPS del panel que el `/health` del túnel responde `{"ok":true}`. No se invocaron las rutas de generación ni se modificaron datos o servicios del panel. Agregar otro generador al backend requerirá configurar su ruta y permisos en el panel si se quiere exponer por ese canal.

## Despliegue RENIEC (22 de octubre de 2026)

- Integración instalada en el VPS de generadores mediante archivos, sin commits ni pushes. Se reinició únicamente `constancias-api`; el túnel siguió activo.
- Solo `usar_reniec: true` consulta RENIEC. Nombre, nacimiento y edad pueden omitirse o enviarse vacíos/null en ese modo. Sin ese campo se conserva el modo manual, incluida la edad opcional de CITT.
- Token configurado en `.env` privado local y remoto; no copiarlo a Git. `.env` remoto quedó con permisos 600 y propietario appuser.
- Se aplicaron cambios puntuales sobre el código remoto en 31d512d. No se copiaron los generadores locales completos (la base local contiene ajustes adicionales de sanitización), ni dependencias, plantillas o `src/lib/pdf.js`.
- Respaldo remoto previo al despliegue activo: `/root/constancias-backup-reniec-20261022-121503/originales.tar`. Contiene `.env`: mantener privado. Hubo dos intentos anteriores revertidos automáticamente antes del despliegue final.
- Cinco pruebas con RENIEC, PDF y BD simulados pasaron en el VPS; `/health` local y público respondieron `{"ok":true}` después del reinicio. No se generaron constancias reales ni se escribieron registros de prueba en producción.
- Acceso RENIEC validado después de que el usuario autorizara IPv6 `2a02:c207:2339:1612::1` e IPv4 `62.171.156.216` en el panel. Se probó el helper desplegado desde el VPS con salida predeterminada y preferencia IPv4: ambas consultas devolvieron DNI coincidente, nombre, nacimiento y edad válidos. `/health` local y público respondieron HTTP 200. No se generaron constancias ni se escribieron registros en BD para esta comprobación.
- `lain-core` solo fue inspeccionado: rechaza actualmente paciente vacío/null, envía edad vacía y nacimiento fijo en MINSA. El formulario conversacional y la consulta previa del DNI aún no están implementados. No hay endpoint nuevo de preconsulta RENIEC en generadores.

## Prototipo CITT v2 (local, no desplegado)

- Demostración: `output/pdf/citt-nuevo-diseno-muestra.pdf`, con datos ficticios y marca de muestra. Candidato aislado en `prototipos/citt-v2/`; no reemplaza el generador activo.
- Catálogos entregados por el usuario conservados en `data/establecimientos/`: MINSA (8.902 filas) y EsSalud (410 filas).
- Valores acordados: seguro OTRO y contingencia ENFERMEDAD COMÚN si faltan o llegan null/vacíos. DIRIS y todos los acumulados quedan en blanco. Total de días actual sí se calcula. Registro: JUAN PEREZ; firma y sello existentes.
- Contrato propuesto y coordinación del bot: `docs/CITT-V2-CONTRATO-BOT.md`. Todos los campos nuevos son opcionales. La propuesta aún debe integrarse al endpoint y desplegarse después de revisar el diseño.
- Se volvió a inspeccionar lain-core: el otro chat ya tiene cambios locales en el motor/formulario y `docs/FORMULARIOS.md`. La nota previa sobre formulario pendiente es histórica; este trabajo no modificó sus archivos.
- Ocho pruebas aisladas aprobadas (RENIEC y opciones del prototipo). PDF revisado visualmente: una página A4. Sin consultas reales ni escrituras a BD para la demostración.

## CITT v2 desplegado (22 de octubre de 2026)

- El usuario aprobó el diseño tras revisar la muestra con RENIEC y autorizó subirlo a producción.
- Activos: `src/generadores/citt.js`, `src/templates/citt.html`, `src/lib/citt-render.js`, `src/lib/citt-opciones.js`, el logo `src/assets/logo_minsa_citt.png` y los dos catálogos de `data/establecimientos/`.
- El payload anterior sigue funcionando. Los campos nuevos son opcionales y admiten ausencia/null/texto vacío/espacios. Código de catálogo no vacío sí requiere catálogo y coincidencia válidos. Opciones no vacías fuera de las listas se rechazan con 400.
- No se alteraron BD, dependencias, `.env`, MINSA, rutas o librería PDF en el VPS; se comprobaron hashes. Nuevo diseño sin marcas de muestra; fecha/hora de emisión reales en Lima y QR por registro. Se conservan los identificadores y la regla de otorgamiento previa.
- Respaldo: `/root/constancias-backup-citt-v2-20261022-131843/originales.tar` (privado, incluye .env). El despliegue reemplazó solo versiones con hashes revisados; tiene reversión automática ante fallos.
- Doce pruebas aprobadas en el VPS y tres PDFs con Chrome real (payload antiguo, null, catálogo), con BD simulada y sin RENIEC. `/health` local y público respondieron correctamente tras reiniciar únicamente constancias-api. No se insertaron registros de prueba en producción.
- Los campos nuevos se imprimen y se devuelven en data.input; no se añadieron columnas al verificador. El contrato vigente para el bot está en `docs/CITT-V2-CONTRATO-BOT.md`. Botones pendientes del siguiente prompt; lain-core no se modificó desde este chat.

## MINSA v2 desplegado (22 de octubre de 2026)

- Aprobación explícita del usuario tras revisar `output/pdf/minsa-nuevo-diseno-muestra.pdf`.
- Desplegados: `src/generadores/minsa.js`, `src/templates/minsa.html`, `src/lib/minsa-render.js` y pruebas MINSA. Se reutilizan normalización, catálogos y logo del despliegue CITT, sin modificarlos.
- Payload y rutas anteriores compatibles. Seguro OTRO por defecto, DIRIS y observaciones vacíos por defecto. Campos nuevos opcionales admiten null/vacío/ausencia. Hora final opcional `descanso_hora_fin` HH:MM; no se inventa si falta.
- Fecha/hora de emisión reales en America/Lima, separadas de hora_atencion. QR usa ?minsa=AUTOG, igual que el enlace de la respuesta. No se crearon registros reales durante las validaciones.
- 17 pruebas y tres renders Chrome aprobados en el VPS con BD simulada. CITT, .env, dependencias, rutas y librería PDF conservaron sus hashes. Se reinició solo constancias-api y se verificaron health local/público.
- Respaldo privado previo: `/root/constancias-backup-minsa-v2-20261022-133617/originales.tar`.
- Contrato del bot: `docs/MINSA-V2-CONTRATO-BOT.md`. Sin migraciones ni cambios al bot. No hubo commits o pushes.

## Corrección observaciones MINSA (22 de octubre de 2026)

- A solicitud del usuario, se restauró el párrafo automático de la plantilla original con DNI, fecha/hora de atención, síntomas, diagnóstico sin CIE, días y recomendaciones del texto original. Observaciones opcionales se añaden debajo; no hace falta enviarlas para obtener el párrafo.
- Se ajustó el flujo de firma y emisión debajo de la caja para evitar superposiciones. El diseño nuevo continúa activo; no se revirtió.
- Desplegado con respaldo `/root/constancias-backup-minsa-observaciones-20261022-134256/originales.tar`. 18 pruebas y tres renders Chrome aprobados en el VPS, con BD simulada y sin red externa. Health local y público correctos tras reinicio. CITT, dependencias, .env y rutas conservados por hash.

## Fuente original de observaciones (22 de octubre de 2026)

- A solicitud del usuario se restauró el estilo del código anterior en la caja MINSA: Courier New con alternativas Courier/monospace, 13px, peso normal, interlineado 1.6, justificado y mayúsculas. No se copiaron archivos de fuentes ni se agregaron dependencias.
- Se desplegó únicamente `src/templates/minsa.html`. Tres renders Chrome con BD simulada aprobados en el VPS; health local y público correctos. El payload y lógica conservaron sus hashes.
- Respaldo: `/root/constancias-backup-minsa-fuente-20261022-134754/originales.tar`.

## Recetas independientes desplegadas (22 de octubre de 2026)

- Nueva API `POST /api/receta/generar`, catálogo de los ocho códigos ATC aportados `GET /api/receta/catalogo-atc`, consulta pública `GET /api/receta/verificar/:autog` y página `/receta/verificar?codigo=...`. Documentación: `docs/RECETA-API.md`.
- Genera **borradores** con firma en blanco, sin copiar firma/sello del PDF ni atribuir emisión a MINSA. No completa tratamientos desde DDD. Clasifica las coincidencias inequívocas de los códigos aportados y enlaza sus fichas de referencia; no descarga el índice ATC.
- Hasta 30 medicamentos, columnas sincronizadas con paginación según altura real. RENIEC optativo y catálogos locales reutilizados. Opcionales admiten null/vacío. Nuevo payload exclusivo para recetas; CITT/MINSA mantienen sus payloads.
- Migración aditiva `sql/003_recetas_minsa.sql`, tabla independiente `recetas_minsa`. El verificador público excluye identidad y datos clínicos. No se crearon registros clínicos de prueba en producción.
- Respaldo del despliegue: `/root/constancias-backup-receta-20261022/originales.tar` (app.js anterior). Manifest de hashes preservados y logs en el mismo directorio. Guardas de hash, copia de seguridad y reversión automática del código; una tabla aditiva confirmada se conserva ante reversión para proteger posibles registros.
- Solo cambió `src/app.js` compartido y se añadieron archivos de recetas. Se comprobaron hashes de .env, dependencias, generadores/plantillas/rutas CITT y MINSA, helpers compartidos y catálogos antes/después. Se reinició únicamente constancias-api. Túnel activo.
- 25 pruebas aprobadas en local y VPS; renders Chrome con 1/9/30 medicamentos (BD simulada y sin red externa), verificador Chrome con registro/404/error/código inválido y móvil. Muestra ficticia local: `output/pdf/receta-demostracion-local.pdf`, sin registro real de su QR.
- Panel: ruta **131**, slug `receta-minsa`, POST, activa, destino `https://descanso-api.sin-flower.com/api/receta/generar`. Rutas 87/88 preservadas. A petición expresa se asignó permiso activo a **sinflower** (userId 5), sin vencimiento ni límite adicional de ruta; conserva los límites generales de la cuenta. No se concedió a otros usuarios.
- Preparación/respaldos de metadatos en el panel: `/home/mainuser/.cache/codex-receta/` (privado). No se modificó ni reinició el backend del panel.
- Health público, catálogo y página QR responden 200. POST inválido desde el VPS del panel llega al generador y responde 400 de validación; sin token, el panel responde 401. Desde esta PC, Cloudflare rechazó un POST directo al upstream con 403, aunque desde el VPS del panel llegó correctamente. No se cambiaron reglas de Cloudflare ni se deshabilitaron protecciones.
- Sin commits ni pushes en generadores. El bot no se modificó ni desplegó.

## Ajuste de diseño y verificador compartido de recetas (22 de octubre de 2026)

- A petición expresa se acercó la maquetación al PDF de referencia: logo MINSA en ambas columnas, rótulos y posiciones de paciente/seguro/atención/especialidad/historia/diagnóstico/CIE-10, títulos RECETA ÚNICA ESTANDARIZADA e INDICACIONES, tablas y bloque gráfico de firma/sello. Se reutilizaron `logo_minsa_citt.png`, `minsafirma_certificado.png` y `sello.png`; no faltaban imágenes. Imágenes de firma/sello identificadas como **REFERENCIA - SIN VALOR DE FIRMA**, manteniendo el borrador.
- La API de recetas ahora toma **VERIFICADOR_URL_BASE**, igual que CITT/MINSA. Valor remoto comprobado: `https://minsa.servicios-enlinea.net.pe`. QR y `verificador_url` usan `?receta=RECETA-...`; ya no se imprimen enlaces nuevos a la página del dominio de API. La página anterior sigue disponible para enlaces previos.
- Verificador compartido en `C:\Users\AMD\Desktop\verificador-pages`, repo `angels1995/descanso_pages`: se revisó limpio, coincidente con el JS público y main remoto. Se añadió únicamente soporte de receta en `verificador.js`, con estado BORRADOR, datos mínimos y escritura segura como texto. Commit publicado **26e38fe** con trailer Intervenido-por: Codex (ChatGPT). Se confirmó que el JS publicado reconoce recetas.
- Pruebas del sitio con APIs simuladas: CITT/MINSA, receta, registro ausente, consulta manual, código inválido, protección frente a HTML y móvil. Navegador real contra el sitio público: el código de la muestra local devuelve registro no encontrado (404) sin errores JS; no se insertó en producción.
- Desplegados únicamente generador/renderer/paginador de recetas, pruebas y documentación; sin migraciones, cambios de payload, permisos, .env o dependencias. Se reinició únicamente constancias-api. Respaldo: `/root/constancias-backup-receta-diseno-20261022/originales.tar`, con hashes de archivos preservados y logs.
- 25 pruebas y renders de 1/9/30 medicamentos aprobados en VPS; verificador compartido probado también allí. Health público 200. Muestra local actualizada `output/pdf/receta-demostracion-local.pdf` (2 páginas, datos ficticios, QR sin registro real).

## Formularios del bot y síntomas no consignados: preparado en local, sin desplegar

- En `C:\Users\AMD\Desktop\lain-core` se creó el comando **/remin** (ruta receta-minsa) y mejoras administrativas de /citt y /dminsa. Commit local **7b56516**, con trailer Intervenido-por: Codex (ChatGPT). No se modificó el motor de formularios, no se iniciaron bots ni se desplegó. Pruebas de formularios, TypeScript y batería completa `npm run test:local` aprobadas con PostgreSQL local Docker en 55432.
- En esta copia de generadores se añadió el campo optativo `sintomas_no_consignados: true` con `sintomas: []`: MINSA expresa que no se consignan síntomas sin inferirlos, CITT lo añade a observaciones; ambos devuelven `input.sintomas_estado: "NO_CONSIGNADOS"`. Clientes anteriores conservan sus textos. No hay cambios de BD, rutas, tokens o dependencias. 28 pruebas aisladas aprobadas.
- **Este ajuste del generador sigue solo en local**, sin commit para no mezclar cambios previos ni despliegue. El bot comprueba el acuse del generador antes de entregar/cobrar esta opción; revisar y desplegar el parche del generador antes de activar esa opción en el bot.
- Parche aditivo de cinco archivos separado de los cambios anteriores: `C:\Users\AMD\Desktop\lain-core\docs\revision-generador-no-consignados.patch`. Comprobado contra la copia local; el parche ya está aplicado aquí. Orden de revisión: `docs/REVISION-REMIN-Y-ATAJOS.md` en lain-core. El último establecimiento y la eliminación de la segunda consulta RENIEC de descansos se mantienen para otra fase; /remin sí usa la identidad previamente confirmada sin reconsultarla.

## CITT EsSalud de demostración: ruta nueva desplegada (22 de octubre de 2026)

- Tras aprobar la muestra, se publicó `POST /api/essalud/citt-demo/generar` en el VPS de generadores. Mantiene BORRADOR/MUESTRA SIN VALIDEZ, imágenes de referencia sin valor de firma y QR de demostración. No genera registros médicos ni escribe en BD; devuelve `registrado: false` y `verificador_url: null`.
- Payload y contrato: `docs/ESSALUD-CITT-DEMO-API.md` y `docs/essalud-citt-demo-payload.json`. RENIEC opcional mediante el helper existente; no se hicieron consultas reales al probar. Identificadores de demostración únicos y fecha/hora real de Lima. Acumulados en blanco.
- Se reutilizó el renderizador ReportLab de la muestra para conservar Helvetica y las posiciones. Python aislado en `/opt/constancias-essalud-demo-venv`, ReportLab 4.4.9; no se cambiaron dependencias Node ni `.env`. Nuevo código en `src/lib/essalud-demo.js`, `src/routes/essalud-demo.js`, `src/essalud-demo/`. En `src/app.js` solo se añadieron import, limitador y montaje de esta ruta.
- Respaldo activo: `/root/constancias-backup-essalud-demo-20261023-001614/originales.tar`. Stage privado: `/root/constancias-essalud-demo-stage-20261022`. Se verificaron hashes de todos los archivos previos de src/data/sql excepto app.js, y de .env/package.json/package-lock.json. Se reinició únicamente constancias-api; no el túnel. Los cambios locales anteriores, incluido el parche de síntomas no consignados, no se desplegaron.
- 34 pruebas locales y 6 del nuevo generador en VPS aprobadas, además de HTTP con PDF real y payload inválido. PDF generado en VPS revisado visualmente: una página A4, marcas presentes. HTTP 200 por localhost y por URL pública desde el VPS; health local/público 200.
- Limitación de acceso pendiente: POST público desde esta PC devuelve Cloudflare 403, como ocurrió antes con recetas. SSH panel-vps (75.119.155.26:22) agotó el tiempo de espera, tanto directo como desde el VPS de generadores. **Esta ruta todavía no se registró en el panel api.sin-flower.com ni se asignaron permisos nuevos**. No se modificaron reglas de firewall/Cloudflare ni el backend del panel. No hubo commits ni pushes.

### Ruta del panel habilitada tras corregir la IP del firewall

- El usuario corrigió la IP permitida y SSH volvió a conectar. Se registró la ruta **132**, slug **descanso-essalud**, POST, activa: `https://api.sin-flower.com/api/descanso-essalud` → `https://descanso-api.sin-flower.com/api/essalud/citt-demo/generar`.
- Permiso activo para sinflower (userId 5), sin vencimiento ni límite adicional por ruta; conserva token, IP permitida y límites generales de su cuenta. No se concedió a otras cuentas.
- Respaldo de metadatos: `/home/mainuser/.cache/codex-essalud-demo/backup-1792707956655/previo.json`. Alta y permiso en una transacción, sin alterar las rutas 87, 88 y 131, comprobadas antes/después. No se modificaron archivos ni se reiniciaron servicios del panel.
- Conexión directa al destino desde el servidor del panel: HTTP 200 con PDF real de demostración, sin consultas RENIEC ni escrituras clínicas. Continúa el estado BORRADOR, sin verificador real. El payload es el mismo de `docs/essalud-citt-demo-payload.json`.

## CITT EsSalud pendiente de firma y configuración global (22 de octubre de 2026)

- Aprobado por el usuario: retirar la marca grande de demostración y las imágenes copiadas, dejar espacios de firma/sello y el estado **PENDIENTE_FIRMA**. Ya está desplegado en la misma ruta 132 del panel, sin cambiar su slug, destino, token, permiso o payload.
- El QR y `data.verificador_url` apuntan al mismo sitio compartido: `https://minsa.servicios-enlinea.net.pe/?essalud=ESSALUD-...`. Nuevo GET público `/api/essalud/citt-demo/verificar/:autog`. La página muestra únicamente registro interno y pendiente de firma; oculta el logo MINSA y la atribución institucional para este tipo.
- Tabla aditiva `essalud_documentos_pendientes` (sql/004): solo código aleatorio, estado fijo, huella SHA-256 y fecha. No almacena datos del paciente ni contenido clínico. Un fallo de registro impide entregar un PDF con enlace inexistente. Los códigos antiguos de muestra no se registraron retroactivamente.
- Sitio verificador publicado con commit **b5fb3e5**, trailer Intervenido-por: Codex (ChatGPT). Navegador real comprobado contra un registro ficticio: estado pendiente, huella, privacidad, ausencia de atribución institucional y móvil correctos. CITT/MINSA/receta preservados en pruebas simuladas.
- **Único archivo activo para imágenes de los cuatro generadores:** `config/recursos-pdf.json`. Claves citt_logo/firma/sello, minsa_logo/firma/sello, receta_minsa_logo/firma/sello y essalud_citt_logo/firma/sello. Todas las rutas son relativas a `src/assets/`, PNG/JPEG hasta 5 MiB. Tras la aclaración final del usuario, **receta y EsSalud firma/sello en null**, con sus logos y QR integrados. CITT y MINSA anteriores conservan sus imágenes. No se aceptan rutas del payload. Configuración e imágenes se versionan y despliegan con el código, como pidió el usuario.
- Sustituidos y retirados los dos JSON iniciales de EsSalud. Documentación vigente: `docs/RECURSOS-PDF-GLOBAL.md` y `docs/DESPLIEGUE-Y-RECURSOS-ESSALUD.md`. Renderizador activo nuevo: `src/essalud-demo/render-pendiente-global.py`; los anteriores se conservan para compatibilidad/reversión. Añadir imágenes no cambia automáticamente el estado pendiente ni constituye firma digital.
- `.bat` preparado en `scripts/desplegar.bat` con PowerShell y bash, pull fast-forward, pruebas, respaldo privado, migración aditiva y reinicio solo de constancias-api. Comprobadas sintaxis y guarda de árbol local sucio. **No ejecuta un pull sobre el estado pendiente actual:** tanto PC como VPS deben revisarse/versionarse y quedar en la rama elegida; appuser necesita acceso de lectura GitHub. No hace commits/push/stash/reset automáticamente.
- Primer respaldo de esta actualización: `/root/constancias-backup-essalud-pendiente-20261023-004409/originales.tar`. Respaldo activo de la centralización: `/root/constancias-backup-recursos-global-20261023-005152/originales.tar`. Guardas de hash, validación sobre copia aislada antes de publicar y reversión automática del código. No se copiaron .env ni llaves a GitHub, no se cambiaron dependencias ni tablas anteriores.
- 38 pruebas locales aprobadas; validaciones reales de PDF de CITT, MINSA, recetas (1/9/30 medicamentos) y EsSalud con BD simulada. Pruebas y renders repetidos sobre copia del VPS con la configuración global. Health y nueva generación/verificación HTTP 200. Solo registros internos ficticios mínimos en la tabla nueva para comprobar el enlace; sin registros clínicos de prueba en las tablas anteriores ni consultas RENIEC reales.
- Se desplegaron solo las claves de imágenes en los renderers antiguos sobre sus versiones remotas revisadas; no se publicó accidentalmente el parche local de síntomas no consignados ni los cambios pendientes en dependencias/pdf.js. Se conservan sin commit los cambios de este repositorio.
- Preferencia para trabajos siguientes: versiones finales sin marca grande de demostración. Mantener identificación pendiente de firma cuando corresponda, usar únicamente imágenes propias/autorizadas y distinguir registro interno de autorización/firma institucional.

### Aclaración final: receta también sin firma/sello incorporados

- A pedido explícito, receta_minsa_firma y receta_minsa_sello quedaron en null, igual que EsSalud. El PDF de recetas conserva logos, QR, tablas y espacios vacíos para firma/sello. Retiradas las imágenes de referencia y su rótulo; el encabezado es una indicación discreta de pendiente de validación y firma, sin la banda grande anterior. El estado de API/verificador sigue BORRADOR; mismo payload y ruta 131.
- Respaldo: `/root/constancias-backup-receta-sin-imagenes-20261023-005620/originales.tar`. Desplegados solo JSON global, renderer/pruebas de recetas y documentación. 38 pruebas locales y 35 del VPS aprobadas; renders reales 1/9/30 medicamentos, sin escrituras reales de recetas ni consultas RENIEC. El resto de archivos y dependencias se preservó por hash. Solo se reinició constancias-api.

## Certificado narrativo EsSalud: nuevo generador local, sin desplegar

- Modelo inspeccionado: Essalud_Certificado_44443333_22-10-2026.pdf, una página A4, Times Roman/Bold/Bold Italic, dos logos pequeños y texto narrativo. No requiere fuentes OTF adicionales. No se copiaron el nombre, la firma ni el sello del profesional del PDF.
- Muestra: `output/pdf/essalud-certificado-local.pdf`, paciente ficticio, sin marca grande y con estado pendiente de validación/firma. Logo existente reutilizado en ambos extremos; espacios de firma/sello vacíos. QR y enlace coherentes con un registro simulado: este código local no existe en producción.
- Claves añadidas a `config/recursos-pdf.json`: essalud_certificado_logo = essalud/logo.png, essalud_certificado_firma = null, essalud_certificado_sello = null. Futuras imágenes propias: src/assets/essalud/certificado-firma.png y certificado-sello.png. No se crean archivos de firma/sello ficticios.
- API preparada solo en local: POST `/api/essalud/certificado/generar` y GET `/api/essalud/certificado/verificar/:autog`. Reutiliza el registro mínimo existente, con prefijo ESSALUD, estado pendiente, huella y fecha; no requiere nueva tabla ni modificar el sitio verificador. Este POST nuevo no reemplaza las rutas activas.
- Implementación: src/lib/essalud-certificado.js, src/routes/essalud-certificado.js y src/essalud-demo/render-certificado.py. El puente PDF y el lector de recursos admiten perfiles internos citt/certificado; el payload no selecciona archivos ni scripts. Fechas declaradas del certificado, sin desplazar automáticamente el inicio por la regla de las 17:00 de CITT. Campos clínicos aportados por el usuario, sin inventarlos; RENIEC optativo.
- Contrato y payload: docs/ESSALUD-CERTIFICADO-API.md y docs/essalud-certificado-payload.json. 43 pruebas locales aprobadas, incluido HTTP con PDF real y BD simulada. Verificación visual A4 sin recortes, dos logos y ningún recurso de firma/sello; enlace y QR usan el mismo código. Sin consultas RENIEC reales, cambios de producción, commits ni pushes en esta tarea.

## Receta EsSalud y carpetas de recursos: preparados en local

- Nuevo modelo inspeccionado: Essalud_Receta_44443333_22-10-2026.pdf. Una columna A4, Helvetica, encabezados y tabla azules. Se creó `output/pdf/essalud-receta-local.pdf`, sin incorporar firma/sello del PDF de referencia ni datos del profesional original. Pendiente de validación y firma; sin marca grande.
- Nueva API solo local: POST `/api/essalud/receta/generar`, GET `/api/essalud/receta/verificar/:autog`. Reutiliza validaciones de receta MINSA, clasificación ATC existente y registro mínimo de pendientes. No modifica la receta MINSA ni agrega tablas. Sin despliegue ni alta en panel.
- Carpetas creadas: `src/assets/essalud/certificado/`, `src/assets/essalud/receta/` (ambas con logo.png y README) y `src/assets/essalud/citt/` (README, usa el logo compartido existente). No se crearon firmas o sellos ficticios. Puedes colocar firma.png/sello.png en la carpeta del generador y declarar sus rutas relativas a src/assets/ en config/recursos-pdf.json.
- Claves locales nuevas: essalud_receta_logo = essalud/receta/logo.png, essalud_receta_firma/sello = null. Certificado ahora usa essalud/certificado/logo.png. Sus futuros archivos serán essalud/certificado/firma.png y sello.png, en lugar de los nombres planos sugeridos antes. El lector del puente PDF admite perfiles internos citt/certificado/receta.
- Ajuste automático proporcional y centrado dentro de los recuadros, sin estirar ni recortar. No se giran imágenes ni se eliminan márgenes automáticamente: deben venir orientadas correctamente y preferiblemente recortadas al contenido. PNG/JPEG hasta 5 MiB. Se comprobó la proporción con una imagen neutra insertada en los tres espacios de la receta, sin modificar las claves globales ni crear archivos de firma.
- Pruebas locales: 43 anteriores y 4 nuevas de receta cubiertas; PDF real y BD simulada, sin consultas RENIEC reales. Casos de 1/9/30 medicamentos comprobados: 1/3/10 páginas, todas las filas presentes y QR/enlace en cada página. Identificadores clínicos faltantes se dejan vacíos; no se inventan pautas, dosis, historias ni actos médicos. EsSalud certificado y receta permanecen solo en local para revisión del diseño.
- Contrato/payload: docs/ESSALUD-RECETA-API.md y docs/essalud-receta-payload.json. Ningún servicio de producción fue modificado o reiniciado durante esta tarea.
