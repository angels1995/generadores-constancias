# Receta EsSalud: preparada en local

POST `/api/essalud/receta/generar` y GET
`/api/essalud/receta/verificar/:autog`, solo en local. No desplegada ni
registrada en el panel. Payload: docs/essalud-receta-payload.json.

Modelo de una columna, encabezados azules, tabla N.º/CÓDIGO/DENOMINACIÓN/DÍAS/
UM-FF/CANT. La tabla se amplía a nuevas páginas según la altura real de filas,
con encabezado, logo, espacios de firma/sello, emisión y QR repetidos.

Reutiliza validaciones de receta MINSA: 1–30 medicamentos, nombre/dosis/vía/
frecuencia declarados, cantidad entera 1–10000 y duración entera 1–365 días.
Concentración, forma e indicaciones son opcionales. UM/FF se declara con um_ff
o se toma de forma; no se inventa. No se eligen tratamientos ni dosis desde ATC.
CÓDIGO muestra el ATC clasificado cuando coincide, no un código institucional.

Identidad manual o usar_reniec true. Fecha de atención y plazo válidos,
valido_hasta no anterior a la atención. Los opcionales admiten null/vacío.
P.I., autogenerado del paciente, acto médico, historia y documento interno
no se generan aleatoriamente; si faltan, quedan vacíos. Orden usa el código
del registro interno si no se declara numero_orden. Emisión real de Lima.

Claves globales en config/recursos-pdf.json:

```json
{
  "essalud_receta_logo": "essalud/receta/logo.png",
  "essalud_receta_firma": null,
  "essalud_receta_sello": null
}
```

Carpeta: src/assets/essalud/receta/. Solo hay logo y README; puedes añadir
firma.png y sello.png y declarar sus rutas. Ajuste automático sin deformar,
recortar o girar. Los archivos deben venir orientados y preferiblemente sin
márgenes amplios. PNG/JPEG, máximo 5 MiB. No se crean firmas ficticias.

Pendiente de validación y firma, sin marca grande. QR y enlace apuntan al
registro interno mínimo existente; no almacenan paciente ni medicamentos.
La muestra local utiliza BD simulada y no tiene registro en producción.
