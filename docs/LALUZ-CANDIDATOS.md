# Clínica La Luz: tres candidatos locales

Estado: muestras para revisión, sin despliegue ni rutas nuevas. No se cambiaron las
APIs existentes, el bot, las dependencias ni la base de datos. Los códigos LOCAL-*
no se registran en producción. Todos los PDF indican pendiente de validación/firma.

## Ejecutar

Configurar ESSALUD_DEMO_PYTHON con el Python que tenga ReportLab; para verificar,
también PyMuPDF. No se necesita BD ni token para las muestras:

    node prototipos/clinica-la-luz/generar.mjs
    node --test tests/laluz.test.js
    python prototipos/clinica-la-luz/verificar.py

Salida: output/pdf/laluz-certificado-local.pdf, laluz-receta-local.pdf y
laluz-descanso-local.pdf. Script y datos intermedios: tmp/pdfs/clinica-la-luz/.

## Datos y contratos propuestos

Los ejemplos completos están en docs/laluz-certificado-payload.json,
docs/laluz-receta-payload.json y docs/laluz-descanso-payload.json.
No son todavía payloads de una API publicada.

Campos comunes: paciente_dni (8 dígitos como texto), paciente_nombre,
fecha_atencion YYYY-MM-DD, paciente_nacimiento opcional, paciente_edad entero
0..130 opcional, usar_reniec booleano opcional (false por defecto), usuario.
Edad calculada al día de atención si existe nacimiento; sin nacimiento se respeta
la edad declarada y puede quedar vacía. Sexo no lo devuelve el helper RENIEC actual:
paciente_sexo se aporta manualmente (MASCULINO, FEMENINO, OTRO, o vacío).

Médico: medico_nombre, medico_cmp, medico_especialidad. Sede: sede, direccion,
ubicacion. Estos seis campos usan por defecto su valor en la configuración global,
cuando el payload no los aporta o los deja null/vacíos. Los campos nuevos son
opcionales; campos con texto inválido o excesivo se rechazan, no se recortan.

| Tipo | Campos específicos |
| --- | --- |
| Certificado | diagnostico requerido, observaciones opcionales, cie10 opcional, descanso_inicio/fin, descanso_hora_inicio/fin, hora_atencion |
| Descanso | diagnostico requerido, presenta, procedimiento, observaciones, paciente_sexo, historia_interna, descanso_inicio/fin, descanso_hora_inicio/fin, hora_atencion |
| Receta | medicamentos (1..30), fecha_atencion, valido_hasta, seguro, atencion, especialidad, historia_interna, diagnostico y cie10 opcionales |

Certificado/descanso requieren descanso_fin; descanso_inicio por defecto es
fecha_atencion. Hora inicial por defecto es hora_atencion si se suministró;
las horas pueden quedar vacías y no se inventan. Se respeta el período declarado,
sin la regla de las 17:00 de CITT. Días inclusivos calculados entre ambas fechas
(1..366); fecha y hora final no pueden preceder al inicio.

La receta reutiliza validarReceta, sus medicamentos y clasificación ATC existente.
Cada medicamento requiere nombre, dosis, via, frecuencia, cantidad y dias;
concentracion, forma e indicaciones son opcionales. Seguro es OTRO por defecto:
no se confunde con atencion. Ambas columnas repiten los mismos productos y se
paginan juntas; no se omiten filas. Frecuencia se imprime en una línea de cabecera.

historia_interna faltante usa una referencia INT-HC-* determinista por DNI de
muestra. No es una historia clínica institucional ni anonimización. Al integrar
un sistema clínico autorizado se debe usar su historia persistida real.

RENIEC solo se consulta con usar_reniec:true; las muestras lo dejan false y las
pruebas usan un simulador. Únicamente completa identidad; no produce diagnósticos,
procedimientos, dosis, indicaciones ni períodos de descanso.

## Recursos y médico, en el JSON global

Editar config/recursos-pdf.json sin borrar otras claves. Prefijos:
laluz_certificado_*, laluz_receta_* y laluz_descanso_*.

Ejemplo de un perfil (las claves ya existen y los textos están vacíos):

```json
{
  "laluz_certificado_logo": "clinica-la-luz/certificado/logo.png",
  "laluz_certificado_firma": null,
  "laluz_certificado_sello": null,
  "laluz_certificado_medico_nombre": "",
  "laluz_certificado_medico_cmp": "",
  "laluz_certificado_medico_especialidad": "",
  "laluz_certificado_sede": "",
  "laluz_certificado_direccion": "",
  "laluz_certificado_ubicacion": ""
}
```

Carpetas dedicadas: src/assets/clinica-la-luz/certificado/, receta/ y descanso/.
Cada una contiene logo.png extraído sin recomprimir del PDF original (576x183).
Descanso incluye isotipo.png (200x200), utilizado también como marca de agua.
No se extrajo como recurso reutilizable la firma/sello del médico del ejemplo.
Para futuras imágenes propias/autorizadas, colocar firma.png y sello.png en cada
carpeta y declarar las rutas relativas a src/assets/. Solo PNG/JPEG hasta 5 MiB.
El payload no puede seleccionar archivos, scripts ni rutas de recursos.

Las cajas conservan las proporciones y centran las imágenes. No se giran ni se
eliminan márgenes blancos automáticamente. Una imagen combinada puede ocupar
firma dejando sello null. Configurar imágenes o nombre no cambia el estado del
documento ni acredita firma digital o emisión por la clínica.

Coordenadas en puntos desde la esquina superior izquierda:

| Tipo | Nombre del médico | Cajas firma / sello |
| --- | --- | --- |
| Certificado | centrado x=297.5, línea base y=609 | firma x=272.4, y=535, 138.05x58; sello x=192.08, y=535, 80.32x58 |
| Descanso | centrado x=298, línea base y=666 | firma x=276, y=592, 121x58; sello x=205.6, y=592, 70.4x58 |
| Receta | centrado en cada columna, y=fin de tabla +90 | cajas debajo de cada tabla, y=fin de tabla +16; posición dinámica para no superponer filas |

Nombre de médico largo reduce su tamaño hasta 6 pt para caber; si aún excede,
se rechaza en vez de cortar. Los certificados y descansos rechazan exceso que
no quepa en una página. Recetas generan páginas adicionales. Fuentes Helvetica
y Helvetica Bold, como los modelos aportados; no requieren otro paquete TTF.

## Manual CIE-10 revisado

La referencia es el Manual de Codificación CIE-10-ES Diagnósticos (España, 2016):
https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/CIE10ES_2016_norm_Manual_codificacion_Diagnosticos.pdf
Se revisaron estructura y secciones A.3/A.4: búsqueda en índice, comprobación en
lista tabular y requisitos de documentación clínica. No se convierte ese manual
en un catálogo automático ni se infieren diagnósticos desde síntomas.

Para un futuro buscador del bot, usar un catálogo MINSA/Perú con versión/fuente
identificadas (REUNIS publica catálogos y actualizaciones):
https://www.minsa.gob.pe/reunis/index.asp?niv=1&op=3
Flujo propuesto: buscar por código o descripción, presentar coincidencias,
confirmar la selección y conservar entrada manual. No se implementó ese buscador
en esta etapa ni se cambiaron los formularios de lain-core.
