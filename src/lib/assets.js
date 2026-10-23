import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { leerRecursosPdf } from './pdf-recursos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const cache = new Map();

export function imagenBase64(nombreArchivo, claveGlobal) {
  if (claveGlobal) {
    const image=leerRecursosPdf([claveGlobal])[claveGlobal];
    return image ? `data:${image.mime};base64,${image.bytes.toString('base64')}` :
      'data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>').toString('base64');
  }
  if (cache.has(nombreArchivo)) return cache.get(nombreArchivo);

  const ruta = path.join(ASSETS_DIR, nombreArchivo);
  if (!fs.existsSync(ruta)) {
    throw new Error(
      `No encontré la imagen "${nombreArchivo}" en src/assets/. Colócala ahí antes de generar.`
    );
  }

  const buffer = fs.readFileSync(ruta);
  const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
  cache.set(nombreArchivo, dataUri);
  return dataUri;
}
