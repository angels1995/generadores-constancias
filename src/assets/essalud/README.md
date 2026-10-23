# Imágenes propias del profesional

Coloca aquí firma.png y sello.png (también se permite JPG/JPEG). En
config/recursos-pdf.json configura los nombres, relativos a src/assets/:

```json
{
  "essalud_citt_firma": "essalud/firma.png",
  "essalud_citt_sello": "essalud/sello.png"
}
```

Se pueden usar subcarpetas. No se admiten rutas fuera de src/assets/,
URLs ni archivos mayores de 5 MiB. El payload de la API no elige imágenes.
Con null o texto vacío se dejan los espacios correspondientes en blanco.
La configuración se relee en cada generación. Imágenes y JSON se despliegan
con el código, sin pasos adicionales para colocarlas en el servidor.

Incorpora únicamente imágenes propias o autorizadas. Se mantienen el estado
pendiente de firma y el aviso de registro interno; una imagen no constituye
una firma digital ni cambia automáticamente el estado del documento.
