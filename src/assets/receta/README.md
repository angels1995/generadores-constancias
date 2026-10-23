# Recursos propios para recetas

Receta MINSA v1: coloca aquí una imagen combinada propia/autorizada llamada
firma-sello.png (incluye el recuadro completo si quieres ese formato).
En config/recursos-pdf.json cambia:

```json
{
  "receta_minsa_firma_sello": "receta/firma-sello.png"
}
```

Solo cambia esas claves, conserva las demás. Con null se deja la imagen vacía.
La clave está en null: solo el logo está integrado, sin firma/sello copiados.
La misma imagen aparece bajo la tabla de cada columna, centrada y proporcional.
Las dos claves independientes anteriores dejaron de consumirse en esta versión
local. No cambia las claves de la receta compacta v2 ni las de otros generadores.
Se mantiene el estado del documento; incorporar una imagen no constituye una
firma digital ni acredita validación del profesional.
