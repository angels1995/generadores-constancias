# Recetas: contrato de la nueva ruta

Genera un **borrador pendiente de firma** de receta para revisión de un profesional. Reproduce el diseño con el logo integrado. En la revisión local, firma/sello se configuran como **una imagen combinada**, clave `receta_minsa_firma_sello` en `config/recursos-pdf.json`, null por defecto. Archivo sugerido: `src/assets/receta/firma-sello.png`; valor JSON: `receta/firma-sello.png`. Aparece centrada bajo la tabla en ambas columnas, sin recortar ni deformar (caja máxima 294 x 106.5 px). Esta revisión sustituye las dos claves independientes anteriores y aún no se desplegó. No incorpora las imágenes de referencia anteriores. No acredita emisión oficial ni habilitación profesional. CITT y MINSA conservan rutas y payloads.

## Rutas

- Panel: `POST https://api.sin-flower.com/api/receta-minsa` (Bearer, IP y permiso de ruta según el panel).
- Destino: `POST https://descanso-api.sin-flower.com/api/receta/generar`.
- Referencias disponibles: `GET /api/receta/catalogo-atc` en generadores.
- Verificación pública JSON: `GET /api/receta/verificar/RECETA-...`.
- Página QR: `https://minsa.servicios-enlinea.net.pe/?receta=RECETA-...`, el mismo sitio de CITT/MINSA.
- La página anterior `/receta/verificar?codigo=...` se conserva por compatibilidad con enlaces ya entregados; los PDF nuevos usan el sitio compartido.

La ruta nueva del panel no concede acceso automáticamente a los clientes de las otras rutas. Los permisos se asignan en el panel. No requiere modificar el proxy ni reiniciar su servicio.

Desplegada el 22/10/2026 como ruta **131**, activa. Acceso habilitado expresamente para la cuenta **sinflower**. Continúan sus controles de token, IP y límites generales.

## Payload de demostración (no constituye un tratamiento)

```json
{
  "paciente_dni": "00000000",
  "paciente_nombre": "PACIENTE FICTICIO",
  "paciente_nacimiento": "1990-01-01",
  "hospital": "ESTABLECIMIENTO FICTICIO",
  "fecha_atencion": "2026-10-22",
  "valido_hasta": "2026-10-23",
  "seguro": null,
  "diagnostico": "CASO FICTICIO DE DEMOSTRACIÓN",
  "cie10": null,
  "atencion": null,
  "especialidad": null,
  "historia_interna": null,
  "medico_nombre": null,
  "medico_cmp": null,
  "usuario": "PRUEBA LOCAL",
  "medicamentos": [
    {
      "nombre": "PARACETAMOL",
      "concentracion": null,
      "forma": null,
      "cantidad": 1,
      "dosis": "DOSIS FICTICIA",
      "via": "ORAL",
      "frecuencia": "FRECUENCIA FICTICIA",
      "dias": 1,
      "indicaciones": "DEMOSTRACIÓN. NO USAR COMO TRATAMIENTO."
    }
  ]
}
```

- `usar_reniec: true` permite omitir/enviar null nombre, nacimiento y edad. Errores de RENIEC se devuelven; no se genera ni guarda un documento incompleto. El formulario puede ofrecer volver al modo manual con `usar_reniec: false`.
- Sin RENIEC: DNI (texto de 8 dígitos) y nombre obligatorios. Nacimiento o edad numérica son opcionales; si falta, la edad queda en blanco. Con nacimiento se calcula la edad a la fecha de atención.
- Fechas reales `YYYY-MM-DD`, `valido_hasta >= fecha_atencion`; el plazo lo proporciona quien ingresa la receta, no se inventa a partir de la DDD.
- Entre 1 y 30 medicamentos. Cada uno requiere nombre, dosis **con unidad escrita por quien prescribe**, vía, frecuencia **con unidad o intervalo explícito**, cantidad entera 1–10000 y días enteros 1–365. La API verifica estructura y límites; no certifica corrección clínica de texto libre ni de esas cantidades.
- Concentración, forma e indicaciones adicionales admiten null/ausencia/vacío. No se infieren. Nombre hasta 65 caracteres, concentración/forma 30, dosis 55, vía 25, frecuencia 45 e indicaciones 100. Textos excedidos se rechazan, no se recortan.
- Los campos opcionales de cabecera admiten null/ausencia/vacío. Seguro por defecto OTRO; opciones SIS, ESSALUD, PARTICULAR, OTRO.
- Catálogos locales: `establecimiento_catalogo: "minsa" | "essalud"`, `establecimiento_codigo` como texto. Código no vacío requiere catálogo y coincidencia válidos. Se completa nombre y ubicación del establecimiento; no el seguro.
- Se ignoran campos de firma y cualquier código ATC suministrado por el cliente. Las imágenes se seleccionan exclusivamente en la configuración global del código, con rutas relativas a src/assets/. Añadir una imagen no valida al profesional ni constituye firma digital. El PDF muestra una indicación discreta de pendiente de validación y firma, sin la banda grande anterior.

## Respuesta

`{status:true,message:"found",data:{autog,valido_hasta,verificador_url,input,pdf_base64,avisos}}`.

`input` es la información normalizada efectivamente usada. Incluye `estado: "BORRADOR"` y, por medicamento, `atc_codigo`, `atc_fuente`, `atc_aviso`. Si no hay coincidencia inequívoca, el ATC queda vacío y aparece una advertencia; el medicamento ingresado se conserva. Los errores conservan `{status:false,message,data:null}`; 400 para validación, 5xx para servicios no disponibles.

El documento tiene dos columnas con los mismos medicamentos en cada página y hasta cinco medicamentos por página. La tabla de indicaciones empieza antes que la de medicamentos, como en el PDF de referencia. Chrome mide el contenido real y abre otra página si los textos lo requieren. Repite logo, encabezados, numeración, QR y bloque gráfico de referencia. No corta filas ni separa la receta de sus indicaciones entre páginas.

## Fuentes ATC y límites

Se contrastaron los ocho códigos ya aportados por el usuario el 22/10/2026 contra sus fichas del **WHO Collaborating Centre for Drug Statistics Methodology**, https://atcddd.fhi.no/atc_ddd_index/ . Cada código enlaza directamente a su ficha. No se descarga ni redistribuye el índice, sus textos de clasificación o sus tablas DDD.

La [DDD](https://atcddd.fhi.no/ddd/definition_and_general_considera/) es una unidad para estadísticas; no determina la dosis de una persona. No se utiliza para autocompletar dosis, frecuencia, duración, diagnóstico ni cantidad. Los [términos del sitio](https://atcddd.fhi.no/copyright_disclaimer/) restringen la copia/distribución comercial de su material: una ampliación mediante extracción del índice requeriría revisar autorización/licencia.

Coincidencia exacta de principio activo/alias y vía admitida. Ibuprofeno y naproxeno distinguen usos sistémicos/tópicos. Clorhexidina distingue uso local bucal y cutáneo; “ORAL” sin contexto no se asigna automáticamente. Vías contradictorias con formas tópicas, combinaciones, marcas y sustancias desconocidas quedan sin ATC.

## Registro y privacidad

Migración aditiva: `sql/003_recetas_minsa.sql`. Tabla independiente `recetas_minsa`; no modifica tablas existentes. El registro se guarda después de generar el PDF correctamente. Se conserva la información clínica ingresada en `input_json`; proteger la BD como las demás historias/documentos.

El verificador devuelve solo código aleatorio de 128 bits, fecha de registro, plazo declarado, cantidad de medicamentos y estado BORRADOR. No devuelve paciente, DNI, diagnóstico, instrucciones, PDF ni JSON clínico. El QR comprueba la existencia del registro; no certifica integridad de un PDF modificado, firma, autorización profesional o pertenencia institucional. El vencimiento es solo comparación con el plazo declarado.

El QR y `verificador_url` usan `VERIFICADOR_URL_BASE`, igual que CITT/MINSA, con parámetro `receta`. Si falta en el entorno local, se usa `https://minsa.servicios-enlinea.net.pe`. El verificador compartido reconoce esa opción y consulta la API de recetas; el estado mostrado es BORRADOR y no certifica una firma ni emisión oficial.

## Pruebas sin credenciales ni BD real

```powershell
node --test tests/reniec.test.js tests/citt-compatibilidad.test.js tests/citt-opciones.test.js tests/minsa-compatibilidad.test.js tests/receta.test.js
node tests/receta-render-smoke.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe"
```

El smoke usa Chrome real, BD simulada y red externa bloqueada. Revisa 1, 9 y 30 medicamentos con textos extensos. La muestra `output/pdf/receta-demostracion-local.pdf` no tiene registro en producción; su QR no encontrará un registro real.
