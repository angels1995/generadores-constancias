# Rutas publicadas y cliente Python

Publicación autorizada el 22 de octubre de 2026. Ocho rutas activas asignadas a
sinflower: siete generadores y un alias MINSA v1. Las rutas anteriores
descanso-citt, descanso-minsa, receta-minsa y descanso-essalud se preservaron.

Todas las llamadas de generación son **POST** al panel, con:

    Authorization: Bearer TU_TOKEN_DE_SINFLOWER
    Content-Type: application/json

Abrir el enlace en un navegador hace GET y no genera un documento.
Se mantienen los controles de token, IP, permisos y límites del panel.

| Modelo | Ruta POST completa | Payload ficticio listo |
| --- | --- | --- |
| Receta MINSA v1 | https://api.sin-flower.com/api/receta-minsa-v1 | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/receta-minsa-v1.json>) |
| Receta MINSA/SIS v2 | https://api.sin-flower.com/api/receta-minsa-v2 | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/receta-minsa-v2.json>) |
| Receta EsSalud v1 | https://api.sin-flower.com/api/receta-essalud-v1 | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/receta-essalud-v1.json>) |
| Receta EsSalud v2 | https://api.sin-flower.com/api/receta-essalud-v2 | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/receta-essalud-v2.json>) |
| Certificado EsSalud | https://api.sin-flower.com/api/certificado-essalud | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/certificado-essalud.json>) |
| Certificado La Luz | https://api.sin-flower.com/api/laluz-certificado | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/laluz-certificado.json>) |
| Receta La Luz | https://api.sin-flower.com/api/laluz-receta | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/laluz-receta.json>) |
| Descanso La Luz | https://api.sin-flower.com/api/laluz-descanso | [JSON](<C:/Users/AMD/Desktop/generadores-constancias/docs/payloads-publicacion/laluz-descanso.json>) |

## Python sin dependencias externas

Cliente: [consumir-generadores.py](<C:/Users/AMD/Desktop/generadores-constancias/scripts/consumir-generadores.py>).
Usa únicamente la biblioteca estándar; no requiere requests ni pip install.

```powershell
cd "C:\Users\AMD\Desktop\generadores-constancias"
python scripts/consumir-generadores.py receta-minsa-v2
```

Pedirá el token del panel de forma oculta y usará el JSON ficticio correspondiente.
También puedes definir SINFLOWER_API_TOKEN en tu entorno privado. No lo guardes en
el script ni lo publiques en Git. El token técnico RENIEC del generador no es
intercambiable con el token de sinflower: recibió 403 para estas rutas en la prueba.

Para usar datos propios y elegir destino:

```powershell
python scripts/consumir-generadores.py laluz-descanso --payload "C:\mis-datos\descanso.json" --salida "C:\mis-pdfs\descanso.pdf"
```

El programa valida la cabecera PDF y la huella SHA-256 cuando se devuelve,
guarda el archivo e imprime código, estado y enlace. No sobrescribe un PDF
existente: elige otro nombre para repetir una descarga. Los JSON incluidos llevan
fechas de ejemplo; ajusta fecha_atencion y el período/vigencia para tu caso.

## Respuesta

Las siete rutas nuevas devuelven status:true y data con:
estado=PENDIENTE_FIRMA, autog=DOC-32HEX, registrado=true, tipo, input,
pdf_base64, pdf_sha256 y verificador_url. El QR usa el mismo enlace compartido:
https://minsa.servicios-enlinea.net.pe/?documento=DOC-...

La ruta MINSA v1 es un alias del generador existente: conserva su respuesta,
prefijo RECETA- y enlace ?receta=...; no se cambió el contrato de sus clientes.

El verificador nuevo muestra únicamente código, tipo, estado pendiente, fecha y
huella del PDF. No expone paciente, diagnóstico ni indicaciones. Si falla el
registro, no se entrega un PDF con enlace inexistente. Tabla nueva mínima:
documentos_pendientes; no guarda información clínica.

## Imágenes y configuración

Tus imágenes y config local se conservaron; no se borró ningún archivo añadido
por ti. La configuración de producción de los modelos nuevos mantiene firma/sello
desactivados: no se publicaron facsímiles de firmas/sellos de los profesionales
de las plantillas. Los modelos siguen pendientes de validación y firma.

Para una imagen propia/autorizada se puede fijar la ruta una vez y sustituir
después el archivo con el mismo nombre. Si está en null, sigue desactivada.
Un cambio en la PC no se refleja automáticamente en el VPS.

Los lectores globales vuelven a leer imágenes al generar cada PDF. Cambiar solo
el archivo de imagen ya configurado en el servidor no requiere reiniciar PM2;
el siguiente PDF usa el archivo nuevo. Los PDF previamente descargados no cambian.

Git add solo prepara archivos; no los publica. El flujo Git completo, una vez
alineados y limpios ambos repositorios, es add selectivo, commit, push y .bat.
Actualmente el .bat conserva su guarda: PC y VPS tienen cambios sin commit y
necesitan revisión/alineación antes de usar ese flujo. Este despliegue se hizo
mediante un paquete explícito revisado, con respaldo y guardas de hashes.

## Validación de esta publicación

- 58 pruebas locales aprobadas y 55 en la copia aislada del VPS.
- Siete generaciones reales con datos ficticios: PDF, huella y consulta pública
  coincidentes. Solo metadatos mínimos de prueba en la tabla nueva.
- Siete páginas del verificador público comprobadas con Chrome y revisión móvil.
- Ocho permisos activos de sinflower comprobados en BD; destinos probados desde
  el VPS del panel (siete 200 y alias v1 con 400 de validación, sin inserción clínica).
- No se hizo una generación autenticada de extremo a extremo con un token de
  sinflower, porque no se disponía de él. El token técnico RENIEC recibió 403;
  no se otorgaron permisos adicionales a esa cuenta.
- Se reinició solo constancias-api; panel y túneles no se reiniciaron. Health 200.

Respaldo privado del generador:
/root/constancias-backup-versionados-20261023-043601/originales.tar.
Metadatos previos del panel:
/home/mainuser/.cache/codex-versionados-20261022-a1/respaldo-panel.json.
Verificador publicado en commit 83f5300 (repo descanso_pages).
