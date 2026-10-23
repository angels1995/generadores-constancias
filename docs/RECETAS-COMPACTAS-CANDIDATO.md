# Recetas compactas: candidato local de diseño

Modelos aportados: RECETA_MINSA-44445555.pdf y RECETA_ESSALUD-44445555.pdf.
Ambos comparten una columna A4 (595.92 x 842.88 puntos), cabecera de paciente,
tabla gris de seis columnas, QR bajo la tabla y pie de impresión inferior.
MINSA lleva logo SIS; EsSalud lleva el logo «Seguridad Social para todos».

## Alcance actual

La implementación está aislada en prototipos/recetas-compactas/ para comparar
los diseños antes de sustituir renderizadores. No modifica rutas, validaciones
de producción, base de datos, bot ni el modelo anterior. No se desplegó.
Se reutiliza validarReceta para demostrar compatibilidad con el cuerpo anterior;
los opcionales nuevos aceptan ausencia, null y texto vacío. Actualmente solo el
candidato los consume: enviarlos a una API activa no los incorpora todavía.

## Campos del modelo y correspondencia propuesta

| Campo impreso | JSON | Situación |
| --- | --- | --- |
| No. de orden | numero_orden | Ya en EsSalud; incorporar a MINSA |
| P.I. | paciente_pi | Ya en EsSalud; incorporar a MINSA |
| AUTOG. paciente | autogenerado_paciente | Ya en EsSalud; incorporar a MINSA. Distinto del código interno del PDF |
| ACT.MED | acto_medico | Ya en EsSalud; incorporar a MINSA |
| DOC.ID | documento_id | Ya en EsSalud; incorporar a MINSA. Por defecto DNI aportado |
| Farmacia | farmacia_codigo, farmacia_nombre | Nuevos en ambos; no se deducen del catálogo de establecimientos |
| EDAD años/meses/días | edad_detallada | Nuevo opcional declarado. Sin él usa paciente_edad; no inventa meses/días |
| Código de cada medicamento | medicamentos[].codigo_producto | Nuevo; código institucional explícito, separado de atc_codigo |
| UM/FF | medicamentos[].um_ff | Ya en EsSalud; incorporar a MINSA. Alternativa: forma |
| Via Admin / pauta | dosis, via, frecuencia, indicaciones | Existentes; no requiere otro campo obligatorio |
| Aviso al paciente al pie | aviso_atencion_usuario | Nuevo opcional; no copiar una ubicación de atención ajena |
| Código de barras | generado con código interno local | Nativo vectorial Code128; no se reutiliza el del paciente del ejemplo |
| FEC.IMP / HORA | fecha_impresion, hora_impresion | Metadatos del candidato, calculados con hora real de Lima |
| Fecha emisión / vigencia | fecha_atencion / valido_hasta | Existentes; conserva la fecha declarada y el vencimiento explícito |
| H/C, médico, usuario | historia_interna, medico_nombre, medico_cmp, usuario | Existentes |

### Valores incorporados al candidato tras la revisión

- Farmacia por defecto para ambos perfiles: 15856189-FARMACIA PRINCIPAL, declarada
  en la configuración global. Un valor no vacío del payload prevalece; null/vacío
  usa el valor configurado. No se consulta ni acredita un registro de farmacia.
- AUTOG. interno: INT-A-*; H/C interna: INT-HC-*. Referencias deterministas para
  el mismo DNI de muestra, compartidas entre ambos perfiles. ACT.MED. interno:
  INT-AM-* aleatorio por preparación. Si se aportan valores explícitos, se conservan.
  Son referencias de demostración, no números emitidos por MINSA/EsSalud ni historias
  clínicas reales. En una integración clínica autorizada, usar la historia
  persistida del sistema; estos hashes no son anonimización ni un registro en BD.
- Con paciente_nacimiento, edad_detallada se calcula para fecha_atencion, incluyendo
  meses y días de calendario (fin de mes se ajusta al último día válido). No utiliza
  la edad actual como si fuera la edad del día de atención. Funciona con nacimiento
  manual o previamente completado por RENIEC; el candidato no hace consultas reales.
  Sin nacimiento, mantiene edad_detallada declarada o paciente_edad disponible.

## Médico e imágenes en un solo archivo

En config/recursos-pdf.json, completar las claves correspondientes al perfil:

```json
{
  "receta_minsa_compacta_firma": null,
  "receta_minsa_compacta_sello": null,
  "receta_minsa_compacta_medico_nombre": "",
  "receta_minsa_compacta_medico_cmp": "",
  "essalud_receta_compacta_firma": null,
  "essalud_receta_compacta_sello": null,
  "essalud_receta_compacta_medico_nombre": "",
  "essalud_receta_compacta_medico_cmp": ""
}
```

Fragmento orientativo: editar esas claves del JSON existente sin borrar las demás.
Nombre/CMP configurados actúan como valores por defecto, cuando el payload no trae
un valor no vacío. Se validan como texto, con límites de 100/12 caracteres.
No se cambia ningún nombre en los generadores antiguos.

Coordenadas de ambos candidatos, en puntos desde la esquina superior izquierda:
MEDICO: x=30, línea base y=730; CMP/nombre x=70, línea base y=730.
La posición es fija en render.py: cambiar el texto no mueve el bloque. Texto largo
se reduce de 9 a un mínimo de 7 pt para caber; si aun así excede, se rechaza sin
recortar el nombre. Las cajas de imágenes siguen las posiciones del diseño:
firma x=430.5, 135x80 pt; sello x=330, 85x80 pt. Su y sigue el final de la tabla,
incluida la paginación, para evitar superposiciones.

## Fuentes incluidas

src/assets/fonts/liberation/ contiene las TTF 2.1.5 facilitadas por el usuario y
su LICENSE. Se incrustan Liberation Mono Bold para datos (9 pt), Liberation Sans
Bold para etiquetas/tablas y Liberation Sans Regular para contenido normal.
Ambos candidatos las usan; no dependen de las fuentes instaladas en Windows/Linux.

El código 213700 aparece en ambos modelos para productos distintos: no debe
convertirse a ATC ni asignarse automáticamente a un medicamento. ATC se sigue
calculando con las reglas actuales y se conserva en los datos normalizados,
pero la columna CODIGO del nuevo formato imprime exclusivamente codigo_producto.
Si no se suministra, queda en blanco.

El aviso de la referencia «7 días posteriores» no se copia como regla universal:
el candidato imprime el valido_hasta declarado, evitando contradecir el payload.

## Recursos

Logos extraídos de las imágenes nativas del PDF, sin recomprimir:
- src/assets/receta/compacta/logo-sis.png (512x512).
- src/assets/essalud/receta/compacta/logo.png (396x127).

Configuración única: config/recursos-pdf.json; perfiles nuevos
receta_minsa_compacta_* y essalud_receta_compacta_*.
Firma y sello siguen null. No se activó ni se guardó como recurso reutilizable
la firma/sello del profesional de los ejemplos. Para recursos propios/autorizados,
poner firma.png y sello.png en la carpeta del perfil y declarar esas rutas relativas
a src/assets/. Cajas firma 135x80 pt y sello 85x80 pt, proporción preservada y centrada.
Una imagen combinada firma/sello puede ocupar la caja de firma dejando sello null.
Agregar una imagen no valida ni firma digitalmente el documento.

QR nuevo vectorial por muestra: no reutiliza el QR de referencia ni crea un registro
público. Los códigos LOCAL-* de estas muestras no se registran en producción.

## Reproducir

Configurar ESSALUD_DEMO_PYTHON con un Python que tenga ReportLab y ejecutar:

    node prototipos/recetas-compactas/generar.mjs
    node --test tests/recetas-compactas.test.js

Los PDF finales quedan en output/pdf/receta-minsa-compacta-local.pdf y
output/pdf/receta-essalud-compacta-local.pdf. No requiere BD, token ni consulta RENIEC.
