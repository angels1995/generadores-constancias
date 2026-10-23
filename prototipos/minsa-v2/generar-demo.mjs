import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { imagenBase64 } from '../../src/lib/assets.js';
import { generarQRBase64 } from '../../src/lib/qr.js';
import { completarOpciones } from '../../src/lib/citt-opciones.js';
import { calcularInicioDescanso, calcularDias } from '../../src/lib/vigencia.js';

// Muestra aislada: no importa dotenv, BD ni generadores de producción.
const body = completarOpciones({
  paciente_nombre: 'PACIENTE FICTICIO DE DEMOSTRACIÓN', paciente_dni: '00000000', paciente_edad: 36,
  hospital: 'ESTABLECIMIENTO FICTICIO DE DEMOSTRACIÓN',
  establecimiento_departamento: 'DEPARTAMENTO DEMO', establecimiento_provincia: 'PROVINCIA DEMO', establecimiento_distrito: 'DISTRITO DEMO',
  fecha_atencion: '2026-10-22', hora_atencion: '08:00', descanso_fin: '2026-10-24',
  diagnostico: 'CASO SIMULADO PARA REVISIÓN DEL DISEÑO', observaciones: '', seguro: null
});
const inicio = calcularInicioDescanso(body.fecha_atencion, body.hora_atencion);
const fecha = (iso) => iso.split('-').reverse().join('/');
const tokens = {
  LOGO: imagenBase64('logo_minsa_citt.png'), SELLO: imagenBase64('sello.png'), FIRMA: imagenBase64('minsafirma_certificado.png'),
  QR: await generarQRBase64('https://example.invalid/muestra-sin-validez?minsa=MUESTRA-0001'),
  PACIENTE: body.paciente_nombre, DNI: body.paciente_dni, EDAD: body.paciente_edad,
  HOSPITAL: body.hospital, UBICACION: [body.establecimiento_departamento, body.establecimiento_provincia, body.establecimiento_distrito].join(' / '),
  SEGURO: body.seguro, INICIO: fecha(inicio), HORA: '08:00 AM', FIN: fecha(body.descanso_fin),
  DIAS: calcularDias(inicio, body.descanso_fin).total, DIAGNOSTICO: body.diagnostico,
  OBSERVACIONES: body.observaciones, USUARIO: 'JUAN PEREZ'
};
const escapar = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = fs.readFileSync(new URL('plantilla.html', import.meta.url), 'utf8').replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key) => {
  if (!(key in tokens)) throw Error(`Token sin valor: ${key}`);
  return escapar(tokens[key]);
});
if (/\{\{/.test(html)) throw Error('Quedaron tokens sin reemplazar');
const out = path.resolve('output/pdf');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const layout = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return { fieldsBottom: r('.observations').bottom, signatureTop: r('.signature').top, signatureBottom: r('.signature').bottom,
      issuedTop: r('.issued').top, brokenImages: [...document.images].filter((im) => !im.complete || !im.naturalWidth).length };
  });
  if (layout.brokenImages || layout.fieldsBottom >= layout.signatureTop - 10 || layout.signatureBottom >= layout.issuedTop - 10) throw Error(JSON.stringify(layout));
  await page.pdf({ path: path.join(out, 'minsa-nuevo-diseno-muestra.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
  await page.screenshot({ path: path.join(out, 'minsa-nuevo-diseno-muestra.png'), fullPage: true });
  console.log('Muestra MINSA creada. Sin BD ni RENIEC.', layout);
} finally { await browser.close(); }
