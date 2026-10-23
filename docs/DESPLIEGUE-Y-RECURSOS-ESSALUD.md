# Imágenes y despliegue

1. Guarda las imágenes propias/autorizadas en `src/assets/essalud/firma.png`
   y `src/assets/essalud/sello.png`.
2. En `config/recursos-pdf.json` declara `essalud_citt_firma: "essalud/firma.png"`
   y `essalud_citt_sello: "essalud/sello.png"`. Son rutas relativas a src/assets/.
   Ambos valores empiezan en null, por lo que el PDF deja espacios vacíos.
   Para recetas usa receta_minsa_firma y receta_minsa_sello; para los anteriores,
   citt_firma/citt_sello y minsa_firma/minsa_sello. Cada generador tiene también
   una clave terminada en _logo. No envíes rutas ni imágenes en el payload.
3. Revisa los cambios, haz commit y push de código, JSON e imágenes autorizadas
   a `trabajo/generadores`. No añadas .env ni llaves. Las imágenes incluidas en
   Git serán accesibles a quienes tengan acceso al repositorio.
4. Ejecuta `scripts/desplegar.bat`. Usa tu llave SSH local existente, verifica
   el commit publicado y hace `git pull --ff-only` y reinicia solo constancias-api.

El .bat no hace commits ni publica cambios por su cuenta. Tanto la copia local
como el VPS deben estar limpios y el VPS debe estar en la rama elegida. La
cuenta appuser debe tener acceso de lectura al repositorio remoto por SSH.
El estado actual del proyecto tiene cambios pendientes conservados: primero
hay que revisarlos y versionarlos. Hasta entonces el .bat se detendrá sin
alterarlos. La actualización puntual de esta tarea se hace con respaldo y
guardas de hash, sin forzar git pull sobre los cambios pendientes.

El script guarda un respaldo privado fuera del repositorio, ejecuta pruebas,
aplica la migración aditiva del registro interno y comprueba /health. Si falla
tras actualizar y el árbol sigue limpio, intenta volver al commit anterior
con checkout conservador (HEAD separado) y reiniciar; no usa reset --hard,
stash, force push ni elimina cambios. Las tablas aditivas se conservan para
proteger registros. Revisa los logs y restaura la rama antes de reintentar.

Añadir imágenes no valida automáticamente al profesional ni modifica el
estado PENDIENTE_FIRMA. No se incorpora una firma digital en este flujo.
