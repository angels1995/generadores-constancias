# MINSA v2: contrato de producción

Desplegado el 22 de octubre de 2026 con el diseño aprobado por el usuario.
Rutas conservadas: `POST /api/minsa/generar` en generadores y
`POST /api/descanso-minsa` en el panel. El bot no fue modificado por este trabajo.

## Payload actual

No cambia la obligatoriedad anterior: hospital, DNI, fecha/hora de atención,
fin del descanso y diagnóstico; nombre y nacimiento en modo manual. Con
`usar_reniec: true`, RENIEC completa nombre, nacimiento y edad. Sin esa bandera
no hay consulta automática. El payload anterior sigue generando con el diseño
nuevo y la respuesta conserva status/message y data con autog, valido_hasta,
verificador_url, input y pdf_base64.

## Campos nuevos opcionales

Todos admiten ausencia, JSON null, texto vacío y espacios:

- `seguro`: SIS, ESSALUD, PARTICULAR u OTRO. Predeterminado OTRO.
- `observaciones`: texto opcional ADICIONAL al párrafo automático original,
  restaurado por solicitud del usuario. Si falta/null/vacío, el párrafo igualmente
  se imprime con DNI, fecha y hora de atención, síntomas, diagnóstico sin CIE y
  días del descanso. Si no hay síntomas, conserva SINTOMATOLOGÍA DIVERSA como
  antes. Los textos proporcionados se escapan para HTML. No enviar el párrafo
  completo desde el bot: se compondría dos veces.
- `establecimiento_catalogo`, `establecimiento_codigo`: minsa/essalud y código
  de texto. Si hay código no vacío, exige catálogo válido y coincidencia exacta.
  La fila completa nombre, dirección y ubicación. Mantener `hospital` en el
  payload MINSA, como antes: la validación inicial sigue exigiéndolo.
- `establecimiento_departamento`, `establecimiento_provincia`,
  `establecimiento_distrito`: ubicación manual si no se seleccionó catálogo.
- `establecimiento_direccion`, `establecimiento_ubigeo`: disponibles en input,
  aunque este diseño imprime ubicación y nombre, no la dirección/ubigeo.
- `descanso_hora_fin`: HH:MM de 24 horas; sin valor se muestra solo la fecha final.
  No se sustituye por la hora de emisión. Un valor no vacío inválido devuelve 400.

`usuario` permite sustituir JUAN PEREZ. `medico_nombre` y `medico_cmp` son
opcionales y sin valor dejan vacíos los textos junto a la firma existente.
La plantilla conserva firma y sello existentes.

El normalizador compartido también conserva contingencia y paciente_sexo en
input, pero MINSA no imprime estos campos. No es necesario preguntarlos para
esta constancia. DIRIS / DIRESA / GERESA queda vacío por decisión del usuario.

## Fechas y horas

- Inicio y total de días mantienen las reglas existentes (incluido inicio al día
  siguiente si la atención es desde las 17:00).
- La hora de atención se imprime desde `hora_atencion`, sin reemplazarla.
- FECHA / HORA de emisión usa fecha y hora reales de generación en America/Lima.
- El QR y `data.verificador_url` usan `?minsa=AUTOG` con la misma base configurada.

## Validación y despliegue

- 18 pruebas aisladas aprobadas en el VPS: RENIEC simulado, ambas rutas,
  payload anterior, campos vacíos, catálogos y separación de las horas.
- Tres PDFs de validación generados con Chrome real, sin BD real ni red externa.
- `/health` local y público respondieron correctamente tras reiniciar la API.
- Respaldo privado: `/root/constancias-backup-minsa-v2-20261022-133617/originales.tar`.
- Se conservaron hashes de .env, dependencias, CITT, rutas y librería PDF.
- No hubo migraciones de BD. Los campos nuevos se imprimen/devuelven en input
  según este contrato, pero no se añadieron a las consultas del verificador.

Corrección de observaciones desplegada el mismo día, conservando el diseño:
firma y datos de emisión fluyen debajo del párrafo para evitar superposición.
Respaldo previo privado:
`/root/constancias-backup-minsa-observaciones-20261022-134256/originales.tar`.

La caja conserva la tipografía declarada por el código original: Courier New
(alternativas Courier/monospace), 13px, peso normal, interlineado 1.6 y texto
justificado en mayúsculas. Ajuste desplegado solo en la plantilla, sin cambios
al contrato. Respaldo: `/root/constancias-backup-minsa-fuente-20261022-134754/originales.tar`.

Para los botones, seguir `lain-core/docs/FORMULARIOS.md` sin alterar el motor
ni el sistema de créditos. Actualizar datos/validador/cuerpo del comando,
resumen y pruebas antes de añadir las opciones al formulario existente.
