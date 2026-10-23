# Certificado narrativo EsSalud: preparado en local

Ruta local nueva: POST `/api/essalud/certificado/generar`. No reemplaza CITT,
MINSA ni recetas. Todavía no está publicada en VPS ni registrada en el panel.
Payload listo: docs/essalud-certificado-payload.json.

Recursos en el archivo global config/recursos-pdf.json:

```json
{
  "essalud_certificado_logo": "essalud/certificado/logo.png",
  "essalud_certificado_firma": null,
  "essalud_certificado_sello": null
}
```

Se reutiliza el logo; aparece dos veces como en el modelo. No necesita fuentes
OTF externas: Times Roman, Bold y Bold Italic del renderizador. Cuando tengas
imágenes propias, puedes usar essalud/certificado/firma.png y
essalud/certificado/sello.png dentro de src/assets/. La carpeta ya contiene
logo.png y README.md. No se incorporan las
imágenes de firma/sello del PDF de referencia.

Requeridos: paciente_dni (texto de 8 dígitos), paciente_nombre (salvo RENIEC),
hospital (salvo catálogo), fecha_atencion YYYY-MM-DD, hora_atencion HH:MM,
descanso_fin YYYY-MM-DD y diagnostico (hasta 600 caracteres).

Opcionales null/vacíos: paciente_edad, descanso_inicio (fecha_atencion),
descanso_hora_inicio (hora_atencion), descanso_hora_fin (vacío),
recomendaciones (hasta 1000 caracteres), medico_nombre, medico_especialidad
(o servicio), medico_cmp, medico_rne, lema, distrito_expedicion (o distrito
del catálogo seleccionado), seguro y establecimiento_catalogo/codigo.
Especialidad, médico, recomendaciones y lema no se inventan si faltan.

Período inclusivo de 1 a 366 días. En este documento las fechas son las
declaradas: no se aplica la regla de desplazar al día siguiente desde las 17:00
del generador CITT. Rechaza horas invertidas en un mismo día. Usar RENIEC true
completa solo identidad, nacimiento y edad mediante el helper existente.

En una generación registrada, el QR usa el verificador compartido con
?essalud=ESSALUD-... y la misma tabla mínima de documentos pendientes, sin
guardar datos del paciente ni clínicos. Estado PENDIENTE_FIRMA, huella y
fecha. La ruta GET /api/essalud/certificado/verificar/:autog también queda
preparada. No se añadió otra tabla ni se modificó el verificador publicado.

La muestra local usa BD simulada: su QR no tiene registro en producción.
No lleva marca grande de demostración; sí identificación de pendiente de
validación y firma. Los textos clínicos proceden de quien ingresa los datos.
