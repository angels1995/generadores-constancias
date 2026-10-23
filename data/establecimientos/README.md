# Catálogos conservados

Entregados por el usuario el 22 de octubre de 2026. Se normalizó únicamente
el envoltorio JSON y la indentación; no se modificaron las filas ni sus valores.
No se comprobó su vigencia contra un registro externo.

- `minsa.json`: 8.902 registros, objeto con clave `minsa`.
- `essalud.json`: 410 registros, objeto con clave `essalud`.

Cada fila contiene siete textos en este orden:

`[codigo, nombre, departamento, provincia, distrito, ubigeo, direccion]`

Conservar código y ubigeo como texto para no perder ceros iniciales. Buscar por
catálogo y código, no solo por nombre. Elegir el catálogo del establecimiento
no determina el seguro del paciente: son datos independientes.

El CITT de producción los utiliza a través de `src/lib/citt-opciones.js` cuando
se envían `establecimiento_catalogo` y `establecimiento_codigo`. El prototipo
reutiliza esa misma normalización. Todavía no se incorporó la búsqueda de
catálogos al formulario de lain-core ni existe una ruta HTTP de búsqueda.
