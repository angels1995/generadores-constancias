# Git, imágenes y despliegue

## Actualización habitual

En la PC:

```powershell
cd "C:\Users\AMD\Desktop\generadores-constancias"
git add .
git diff --cached --stat
git commit -m "Actualiza recursos PDF" -m "Intervenido-por: Codex (ChatGPT)"
git push origin trabajo/generadores
.\scripts\desplegar.bat
```

El .bat actualiza el VPS desde la misma rama, ejecuta pruebas, crea respaldo
privado y reinicia solamente constancias-api. No modifica rutas ni permisos
del panel. Los payloads existentes siguen siendo compatibles.

.gitignore excluye secretos, PDF generados, temporales, configuración activa
privada y las imágenes profesionales nuevas de referencia. No borra archivos.
Los archivos que Git ya seguía continúan seguidos. Revisa siempre el resumen
antes del commit; git add . prepara cambios, no los publica por sí solo.

## Configuración e imágenes

- config/recursos-pdf.json: configuración activa privada de cada equipo. PC y
  VPS se conservan intactos, aunque tengan valores diferentes.
- config/recursos-pdf.example.json: configuración revisada y versionada, basada
  en la que estaba activa en producción al preparar Git. Si editas y publicas
  este archivo, el .bat lo instala como configuración activa del VPS, con
  respaldo y restauración ante fallo. No reemplaza el JSON activo de tu PC.
- src/assets/: imágenes y fuentes. Sustituir un archivo seguido por Git con el
  mismo nombre y ruta permite publicarlo con el flujo anterior.
- Las firmas/sellos nuevos de referencia quedan conservados en tu PC y excluidos
  de la publicación inicial. Para un recurso propio/autorizado que coincida con
  esa exclusión, agrégalo deliberadamente con git add -f -- ruta/al/archivo.
  La imagen no cambia por sí misma el estado de validación del documento.

Si la clave de una imagen está en null, añadir el archivo no la activa. Primero
publica la ruta en config/recursos-pdf.example.json. Después basta con reemplazar
el archivo con el mismo nombre. Los PDF ya emitidos no se modifican.

No se copian .env, tokens ni llaves a GitHub. La configuración privada existente
se conserva al hacer Git pull; para aplicar cambios de la plantilla y completar
pruebas, migraciones y reinicio, utiliza el script de despliegue.

También puedes ejecutarlo dentro del VPS como root:

```bash
cd /var/www/constancias-api
bash scripts/desplegar-vps.sh
```

## Cliente Python y error 403

El cliente declara un User-Agent propio para evitar el rechazo Cloudflare 1010
observado con Python-urllib. Muestra el motivo de errores sin mostrar el token.

```powershell
python scripts/consumir-generadores.py receta-minsa-v2
```
