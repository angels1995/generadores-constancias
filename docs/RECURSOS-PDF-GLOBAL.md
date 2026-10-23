# Un archivo para todas las imágenes

Archivo activo único: `config/recursos-pdf.json`. Todos los nombres/rutas
son relativos a `src/assets/`. No es necesario editar cada generador.

| Generador | Logo | Firma | Sello |
|---|---|---|---|
| CITT anterior | citt_logo | citt_firma | citt_sello |
| Constancia MINSA | minsa_logo | minsa_firma | minsa_sello |
| Receta MINSA v1 (revisión local) | receta_minsa_logo | receta_minsa_firma_sello (combinada) | Misma imagen |
| CITT EsSalud nuevo | essalud_citt_logo | essalud_citt_firma | essalud_citt_sello |
| Certificado narrativo EsSalud (local) | essalud_certificado_logo | essalud_certificado_firma | essalud_certificado_sello |
| Receta EsSalud (local) | essalud_receta_logo | essalud_receta_firma | essalud_receta_sello |
| Certificado La Luz (candidato local) | laluz_certificado_logo | laluz_certificado_firma | laluz_certificado_sello |
| Receta La Luz (candidato local) | laluz_receta_logo | laluz_receta_firma | laluz_receta_sello |
| Descanso La Luz (candidato local) | laluz_descanso_logo | laluz_descanso_firma | laluz_descanso_sello |

Los perfiles La Luz también leen medico_nombre, medico_cmp, medico_especialidad,
sede, direccion y ubicacion con esos mismos prefijos. El descanso tiene además
laluz_descanso_isotipo. Carpetas dedicadas en src/assets/clinica-la-luz/.
Contrato y coordenadas: docs/LALUZ-CANDIDATOS.md. No están publicados como APIs.

Ejemplo de las claves que cambiarás cuando tengas tus imágenes:

```json
{
  "receta_minsa_firma_sello": "receta/firma-sello.png",
  "essalud_citt_firma": "essalud/firma.png",
  "essalud_citt_sello": "essalud/sello.png"
}
```

Edita esas claves dentro del archivo completo; no borres las demás. Coloca
los archivos en src/assets/receta/ y src/assets/essalud/ respectivamente.
Los nuevos EsSalud tienen carpetas dedicadas: src/assets/essalud/certificado/
y src/assets/essalud/receta/. Ambas contienen logo.png y README.md. Para CITT
puedes usar src/assets/essalud/citt/. En cada una coloca firma.png y sello.png
y declara su ruta relativa en el JSON. No se crean imágenes de firma falsas.

La receta MINSA v1 ahora usa firma-sello.png como una sola imagen en ambas
columnas. Su clave receta_minsa_firma_sello sustituye firma/sello independientes
solo en la revisión local; no cambia la receta compacta v2 ni otros perfiles.
El ajuste es proporcional y centrado; no gira ni recorta imágenes, por lo que
deben venir orientadas correctamente y preferiblemente sin bordes amplios.
Se permiten PNG/JPEG de hasta 5 MiB por archivo y subcarpetas dentro de assets.
Con null o texto vacío se deja la imagen en blanco. Una ruta no vacía que no
exista detiene la generación con un error de configuración.

CITT y MINSA anteriores conservan sus imágenes actuales por defecto;
receta MINSA y EsSalud nuevo conservan sus logos y firma/sello vacíos.
Configurar otras imágenes no cambia
el estado ni acredita una firma digital o autorización profesional.

Los dos JSON anteriores de EsSalud fueron sustituidos por este archivo global.
No se admiten URLs ni rutas enviadas desde el payload. La configuración se
relee al generar, sin caché de imágenes para estas claves.

Para publicar, revisa y versiona JSON, imágenes y código, haz push y ejecuta
scripts/desplegar.bat. Sus comprobaciones detienen el proceso si hay cambios
pendientes sin revisar en esta PC o en el VPS; no hacen reset ni stash.
