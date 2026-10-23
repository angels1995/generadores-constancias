# CITT v2: contrato de producción para el formulario

Estado al 22 de octubre de 2026: DESPLEGADO EN PRODUCCIÓN con aprobación del
usuario. El CITT usa el diseño aprobado y admite los campos opcionales descritos
aquí. RENIEC permanece activo solo con `usar_reniec: true`. El bot aún no fue
modificado por este trabajo para añadir las opciones nuevas.

Respaldo previo: `/root/constancias-backup-citt-v2-20261022-131843/originales.tar`.
Doce pruebas y tres renders con Chrome real aprobados en el VPS; BD simulada.
Se verificaron `/health` local y público tras reiniciar `constancias-api`.

## Qué está listo para revisar

- PDF: `output/pdf/citt-nuevo-diseno-muestra.pdf`.
- Plantilla activa: `src/templates/citt.html`; render: `src/lib/citt-render.js`.
- Normalización activa de campos opcionales: `src/lib/citt-opciones.js`.
- El prototipo y sus muestras se conservan en `prototipos/citt-v2/`.
- Catálogos: `data/establecimientos/minsa.json` y `essalud.json`.
- Reproducción: `node prototipos/citt-v2/generar-demo.mjs`.
- Pruebas: `node --test tests/citt-compatibilidad.test.js tests/citt-opciones.test.js tests/reniec.test.js`.

La demostración usa datos ficticios, QR de example.invalid, firma y sello ya
existentes y marca visible de muestra. No consulta RENIEC ni conecta a BD.
La fecha y hora de emisión están fijadas solo para reproducir esta muestra.
El usuario de registro predeterminado es JUAN PEREZ (`usuario` permite
reemplazarlo). El render activo usa fecha/hora real del servidor en America/Lima.

## Compatibilidad implementada

Mantener `POST /api/citt/generar`, y el destino actual del panel
`POST /api/descanso-citt`. No cambiar las rutas ni añadir campos obligatorios
a los clientes existentes. Mantener `status`, `message`, `data.autog`,
`data.valido_hasta`, `data.verificador_url`, `data.input` y `data.pdf_base64`.

Todos los campos nuevos son opcionales: ausencia, JSON `null`, `""` y espacios
se normalizan sin impedir la generación. No confundir JSON `null` con el texto
literal `"null"`. Las validaciones de campos obligatorios anteriores continúan.
En RENIEC solo `usar_reniec: true` permite omitir nombre/nacimiento/edad.

| Campo nuevo | Si falta / null / vacío | Uso |
| --- | --- | --- |
| `seguro` | `OTRO` | SIS, ESSALUD, PARTICULAR, OTRO |
| `contingencia` | `ENFERMEDAD COMÚN` | ENFERMEDAD COMÚN, MATERNIDAD, ACCIDENTE COMÚN, ACCIDENTE DE TRABAJO, ENFERMEDAD PROFESIONAL |
| `establecimiento_catalogo` | Vacío | `minsa` o `essalud`; solo se exige si se selecciona un código |
| `establecimiento_codigo` | Vacío | Código de texto del catálogo; sin él, usar el `hospital` que ya envía el bot |
| `establecimiento_direccion` | Vacío | Se obtiene del catálogo o puede ingresarse manualmente |
| `establecimiento_departamento` | Vacío | Igual |
| `establecimiento_provincia` | Vacío | Igual |
| `establecimiento_distrito` | Vacío | Igual |
| `establecimiento_ubigeo` | Vacío | Texto; no se imprime por defecto |
| `paciente_sexo` | Vacío | No se infiere del nombre ni del DNI; no es obligatorio |
| `observaciones` | Vacío | Texto adicional separado del diagnóstico |

Un código no vacío requiere un catálogo válido y una fila existente. En ese
modo la fila completa nombre/dirección/ubicación de forma coherente y prevalece
sobre el texto manual. No buscar ni elegir automáticamente entre hospitales
con nombres iguales. El catálogo NO determina seguro, contingencia o médico.
Un valor no vacío fuera de las opciones de seguro/contingencia debe rechazarse
con un error entendible antes de generar o cobrar. Admitir tildes y mayúsculas
normalizadas (por ejemplo, enfermedad comun).

Se conserva la regla actual de inicio de descanso por fecha y hora de atención
y el cálculo del total de días. No inventar una hora de fin: el payload actual
no la pide. La muestra presenta la fecha final sin hora.

## Campos deliberadamente vacíos

DIRIS / DIRESA / GERESA y los tres días acumulados (consecutivos, no
consecutivos, total) se muestran EN BLANCO. No enviarlos desde el formulario,
no convertirlos en cero y no copiar el total del descanso actual a acumulados.
El total de días del descanso ACTUAL sí se calcula y se imprime.

## Ejemplo nuevo compatible con producción

```json
{
  "usar_reniec": false,
  "paciente_dni": "00000000",
  "paciente_nombre": "PACIENTE DEMO",
  "paciente_edad": "36",
  "hospital": "ESTABLECIMIENTO FICTICIO",
  "fecha_atencion": "2026-10-22",
  "hora_atencion": "08:00",
  "descanso_fin": "2026-10-24",
  "diagnostico": "CASO SIMULADO",
  "sintomas": [],
  "seguro": null,
  "contingencia": null,
  "establecimiento_catalogo": null,
  "establecimiento_codigo": null,
  "establecimiento_direccion": null,
  "establecimiento_departamento": null,
  "establecimiento_provincia": null,
  "establecimiento_distrito": null,
  "establecimiento_ubigeo": null,
  "paciente_sexo": null,
  "observaciones": null
}
```

También debe funcionar el mismo payload SIN ninguna de las claves nuevas.
Para RENIEC: `usar_reniec: true` y nombre/edad omitidos o null. No generar
PDF para hacer la consulta previa del formulario.

## Integración con el trabajo actual de lain-core

Se inspeccionaron `docs/FORMULARIOS.md`, `formularios/descanso.ts`, los tipos
del motor y `definiciones/descansos/_comun.ts`. El otro chat ya está trabajando
en esos archivos; este prototipo NO los modifica ni despliega.

Seguir el manual de lain-core, sección 5, al añadir pasos:

1. Agregar seguro y contingencia como pasos con `leer` + `atajos` (o botones
   `acciones`), con elección explícita «OTRO» y «ENFERMEDAD COMÚN».
2. Permitir hospital manual como hoy. Para el catálogo, ofrecer MINSA/EsSalud,
   buscar localmente y seleccionar por código. Mostrar dirección y ubicación
   antes de confirmar. Los catálogos son para establecimientos, no seguros.
3. El motor actual no define paginación de resultados arbitraria dentro de un
   paso. Diseñar búsquedas acotadas y selección controlada; no volcar miles de
   botones ni alterar el motor sin necesidad. No hay endpoint HTTP de búsqueda
   de establecimientos en generadores todavía.
4. Añadir datos en `DatosFormularioDescanso`, resumen y botones de edición.
   Seguro y contingencia pertenecen a la atención: conservarlos al corregir el
   DNI. Los datos personales deben borrarse/reconfirmarse al cambiar de DNI.
5. Actualizar `DatosConfirmadosDescanso`, `leerEntradaDescanso` y
   `cuerpoDeFormulario` para validar y transmitir nombres de campos EXACTOS
   de esta tabla. No tocar el motor, pipeline o sistema de créditos para esto.
6. Mantener el modo rápido `dni|paciente|dias|hospital|diagnostico|fecha_inicio`.
   Este modo puede omitir TODOS los campos nuevos sin cambiar su sintaxis.
7. Usar el nombre devuelto en `data.input` para el mensaje del PDF. Mantener
   el enlace `data.verificador_url` en CITT y MINSA.
8. Añadir pruebas de formularios según el manual: `null`/vacío/ausencia,
   opciones, edición, cambio de DNI, catálogo vs hospital manual, modo rápido,
   doble pulsación, aislamiento y errores sin cobros.

Los campos de este contrato corresponden al nuevo CITT. MINSA fue adaptado en
un despliegue posterior y su contrato está en `MINSA-V2-CONTRATO-BOT.md`; no
imprime todos los mismos campos. La preservación de
estos campos en el verificador/BD requiere una migración separada si se desea;
el despliegue no altera las tablas. Los campos nuevos se imprimen en el PDF y
se devuelven en `data.input`, pero no se agregaron a las consultas del verificador.

El despliegue conservó las dependencias, `.env`, MINSA, las rutas y la librería
PDF existentes (hashes comprobados). No cambió el esquema de BD ni los permisos
del panel. El botón del formulario puede seguir enviando el payload actual;
no necesita añadir ninguna clave nueva para generar el nuevo CITT.
