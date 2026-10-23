# CITT EsSalud: documentos pendientes de firma

Panel: POST `https://api.sin-flower.com/api/descanso-essalud` (ruta 132),
habilitada para sinflower. Usar el token habitual con Authorization: Bearer,
Content-Type: application/json y la IP autorizada. Payload de ejemplo en
`docs/essalud-citt-demo-payload.json`.

POST `/api/essalud/citt-demo/generar`, cuerpo JSON. Ruta nueva: las de CITT,
MINSA y recetas conservan su contrato. El sufijo citt-demo se conserva por
compatibilidad con el panel y los clientes. Responde `data.pdf_base64`,
`estado: PENDIENTE_FIRMA`, `registrado: true`, `verificador_url`, `pdf_sha256`,
`autog` (ESSALUD- seguido de 32 hexadecimales), `descanso_inicio`, `total_dias`
e `input` normalizado. El payload anterior sigue funcionando.

Campos requeridos: paciente_dni (texto de 8 dígitos), paciente_nombre (salvo
usar_reniec: true), hospital (salvo selección por catálogo), fecha_atencion y
descanso_fin (YYYY-MM-DD), hora_atencion (HH:MM) y diagnostico.

Opcionales: paciente_edad, descanso_hora_fin (HH:MM), servicio (MEDICINA GENERAL),
tipo_atencion (CONSULTA EXTERNA), seguro (OTRO), contingencia (ENFERMEDAD COMÚN),
observaciones (máximo 600 caracteres), medico_nombre (vacío), usuario
(vacío), fecha_probable_parto (vacío), fecha_otorgamiento
(fecha_atencion), establecimiento_catalogo y establecimiento_codigo.
Los opcionales admiten ausencia, null o texto vacío. Acumulados quedan vacíos.
Las fechas no vacías se validan; atención desde las 17:00 desplaza el inicio al día siguiente.
Período inclusivo: 1 a 366 días. La hora de fin se omite si no fue declarada.

Solo `usar_reniec: true` consulta RENIEC y reemplaza nombre, nacimiento y edad
como en los otros generadores. No incluir el token RENIEC en el payload.
Fecha y hora de emisión corresponden al reloj de Lima del servidor.

El PDF no lleva la marca grande de demostración ni imágenes copiadas de firma
o sello. Muestra PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL. Los espacios
de firma/sello quedan vacíos por defecto. Rutas configurables con el código:
`config/recursos-pdf.json` (essalud_citt_firma/essalud_citt_sello), relativas a
`src/assets/`. Ver `docs/DESPLIEGUE-Y-RECURSOS-ESSALUD.md`.

QR y `verificador_url` usan VERIFICADOR_URL_BASE con `?essalud=ESSALUD-...`.
Verificación JSON: GET `/api/essalud/citt-demo/verificar/:autog`.
Solo se guardan código, estado fijo PENDIENTE_FIRMA, huella SHA-256 y fecha
de registro en `essalud_documentos_pendientes` (sql/004_essalud_pendientes.sql).
No se guardan datos del paciente ni contenido clínico. La página muestra ese
registro interno, no una acreditación institucional, médica o de firma.
La huella corresponde al PDF original; no cambia si luego se edita o firma.
Si falla el registro se devuelve 503 sin entregar un PDF con enlace inexistente.

Renderizador ReportLab 4.4.9 en entorno Python aislado, independiente del
backend Node. Predeterminado en VPS:
`/opt/constancias-essalud-demo-venv/bin/python`.
Override local: ESSALUD_DEMO_PYTHON. Límite de dos procesos simultáneos,
15 segundos y 4 MiB de salida. Sin cambios en dependencias Node ni .env.
