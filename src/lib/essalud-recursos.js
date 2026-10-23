import {leerRecursosPdf} from './pdf-recursos.js';
export async function leerRecursosEssalud(options,tipo='citt') {
  if(!['citt','certificado','receta'].includes(tipo))throw new Error('Tipo de documento no válido.');
  const prefix=`essalud_${tipo}`;
  const images=leerRecursosPdf(['logo','firma','sello'].map(key=>`${prefix}_${key}`),options);
  return Object.fromEntries(['logo','firma','sello'].map(key=>[key,images[`${prefix}_${key}`]?.bytes.toString('base64')??null]));
}
