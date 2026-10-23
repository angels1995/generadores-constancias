import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { completarOpciones } from './opciones.mjs';
import { imagenBase64 } from '../../src/lib/assets.js';
import { generarQRBase64 } from '../../src/lib/qr.js';
import { calcularInicioDescanso, calcularDias } from '../../src/lib/vigencia.js';

// Prototipo aislado: no importa dotenv, los generadores activos ni la BD.
const out = path.resolve('output/pdf');
fs.mkdirSync(out, { recursive: true });
const pacientePrueba = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : null;
if (pacientePrueba && (
  typeof pacientePrueba.paciente_dni !== 'string' || !/^\d{8}$/.test(pacientePrueba.paciente_dni) ||
  typeof pacientePrueba.paciente_nombre !== 'string' || !pacientePrueba.paciente_nombre.trim() ||
  !Number.isInteger(pacientePrueba.paciente_edad)
)) throw Error('Datos de paciente de prueba inválidos.');
const nombreSalida = pacientePrueba ? 'citt-muestra-reniec' : 'citt-nuevo-diseno-muestra';
const entrada = {
  usar_reniec: false,
  paciente_dni: '00000000', paciente_nombre: 'PACIENTE FICTICIO DE DEMOSTRACIÓN',
  paciente_edad: 36, paciente_sexo: '',
  ...(pacientePrueba ? {
    paciente_dni: pacientePrueba.paciente_dni,
    paciente_nombre: pacientePrueba.paciente_nombre,
    paciente_edad: pacientePrueba.paciente_edad
  } : {}),
  hospital: 'ESTABLECIMIENTO FICTICIO DE DEMOSTRACIÓN',
  establecimiento_direccion: 'AVENIDA DE EJEMPLO S/N - DIRECCIÓN FICTICIA',
  establecimiento_departamento: 'DEPARTAMENTO DEMO',
  establecimiento_provincia: 'PROVINCIA DEMO', establecimiento_distrito: 'DISTRITO DEMO',
  fecha_atencion: '2026-10-22', hora_atencion: '08:00', descanso_fin: '2026-10-24',
  diagnostico: 'CASO SIMULADO PARA REVISIÓN DEL DISEÑO',
  observaciones: '',
  seguro: null, contingencia: null,
  usuario: 'JUAN PEREZ', medico_nombre: 'PROFESIONAL FICTICIO - MUESTRA', medico_cmp: '000000', medico_rne: '000000'
};
const body = completarOpciones(entrada);
const inicio = calcularInicioDescanso(body.fecha_atencion, body.hora_atencion);
const fecha = (iso) => iso.split('-').reverse().join('/');
const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tokens = {
  LOGO: `data:image/png;base64,${fs.readFileSync(new URL('logo-minsa.png', import.meta.url)).toString('base64')}`,
  SELLO: imagenBase64('sello.png'), FIRMA: imagenBase64('minsafirma_certificado.png'),
  QR: await generarQRBase64('https://example.invalid/muestra-sin-validez?citt=MUESTRA-0001'),
  HOSPITAL: body.hospital, DIRECCION: body.establecimiento_direccion,
  UBICACION: [body.establecimiento_departamento, body.establecimiento_provincia, body.establecimiento_distrito].filter(Boolean).join(' / '),
  AUTOG: 'MUESTRA-20261022-0001', AUTOG_SHORT: 'DEMO00001', ACTO_MEDICO: 'DEMO00001',
  SERVICIO: 'MEDICINA GENERAL', TIPO_ATENCION: 'CONSULTA EXTERNA',
  PACIENTE_NOMBRE: body.paciente_nombre, PACIENTE_DNI: body.paciente_dni,
  EDAD_SEXO: [body.paciente_edad, body.paciente_sexo].filter((v) => v !== '' && v != null).join(' / '),
  SEGURO: body.seguro, CONTINGENCIA: body.contingencia,
  INICIO: fecha(inicio), HORA_ATENCION: '08:00 AM', FIN: fecha(body.descanso_fin),
  DIAS: calcularDias(inicio, body.descanso_fin).total,
  OTORGAMIENTO: fecha(body.fecha_atencion), MEDICO: body.medico_nombre, CMP: body.medico_cmp, RNE: body.medico_rne,
  DIAGNOSTICO: body.diagnostico, OBSERVACIONES: body.observaciones,
  USUARIO: body.usuario, FECHA_EMISION: '22/10/2026', HORA_EMISION: '10:30 AM', HORA_EMISION_24: '10:30:00'
};
let html = fs.readFileSync(new URL('plantilla.html', import.meta.url), 'utf8');
html = html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => {
  if (!(key in tokens)) throw Error(`Token sin valor: ${key}`);
  return htmlEscape(tokens[key]);
});
if (/\{\{/.test(html)) throw Error('Quedaron campos sin reemplazar en la plantilla.');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const layout = await page.evaluate(() => {
    const page = document.querySelector('.page').getBoundingClientRect();
    const issued = document.querySelector('.issued').getBoundingClientRect();
    const sample = document.querySelector('.sample').getBoundingClientRect();
    const broken = [...document.images].filter((im) => !im.complete || !im.naturalWidth).length;
    return { width: page.width, height: page.height, issuedBottom: issued.bottom, sampleTop: sample.top, broken };
  });
  if (layout.broken || layout.issuedBottom > layout.sampleTop - 12) throw Error(`Problema de composición: ${JSON.stringify(layout)}`);
  await page.pdf({ path: path.join(out, `${nombreSalida}.pdf`), format: 'A4', preferCSSPageSize: true, printBackground: true });
  await page.screenshot({ path: path.join(out, `${nombreSalida}.png`), fullPage: true });
  if (!pacientePrueba) fs.writeFileSync(path.join(out, 'citt-nuevo-diseno-payload.json'), JSON.stringify(entrada, null, 2) + '\n');
  console.log('PDF y vista previa creados. BD: 0 conexiones. RENIEC: 0 consultas.', layout);
} finally { await browser.close(); }
