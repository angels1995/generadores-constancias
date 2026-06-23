import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../lib/db.js';
import { htmlAPdfBase64 } from '../lib/pdf.js';
import { generarQRBase64 } from '../lib/qr.js';
import { imagenBase64 } from '../lib/assets.js';
import {
  parseFechaUTC,
  calcularInicioDescanso,
  calcularDias,
  calcularValidoHasta
} from '../lib/vigencia.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'minsa.html'),
  'utf-8'
);

const VERIFICADOR_URL_BASE =
  process.env.VERIFICADOR_URL_BASE || 'https://tu-proyecto.pages.dev/certificado_minsa.html';

const CAMPOS_REQUERIDOS = [
  'hospital',
  'paciente_nombre',
  'paciente_nacimiento',
  'paciente_dni',
  'fecha_atencion',
  'hora_atencion',
  'descanso_fin',
  'diagnostico'
];

function toMayus(str) {
  return str ? String(str).toUpperCase() : '';
}

function sanitizar(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateToMinsa(dateStr) {
  if (!dateStr) return 'N/A';
  const date = parseFechaUTC(dateStr);
  const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' };
  const fecha = date.toLocaleDateString('es-PE', options);
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  let [hours, minutes] = timeStr.split(':');
  let ampm = 'AM';
  if (parseInt(hours, 10) >= 12) {
    ampm = 'PM';
    if (parseInt(hours, 10) > 12) hours = String(parseInt(hours, 10) - 12);
  }
  if (hours === '00') hours = '12';
  return `${hours.padStart(2, '0')}:${minutes} ${ampm}.`;
}

function getFormatoFecha(dateStr) {
  if (!dateStr) return 'N/A';
  const date = parseFechaUTC(dateStr);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function calculateYears(fechaNacStr) {
  if (!fechaNacStr) return 'N/A';
  const hoy = new Date();
  const cumple = parseFechaUTC(fechaNacStr);
  let edad = hoy.getUTCFullYear() - cumple.getUTCFullYear();
  const m = hoy.getUTCMonth() - cumple.getUTCMonth();
  if (m < 0 || (m === 0 && hoy.getUTCDate() < cumple.getUTCDate())) edad--;
  return `${edad} años`;
}

function stripCIE(diagnosticoStr) {
  if (!diagnosticoStr) return '';
  const regex = /^[A-Z]+\d+[A-Z0-9.]*\s*[-:]?\s*/i;
  if (regex.test(diagnosticoStr)) return diagnosticoStr.replace(regex, '').trim();
  return diagnosticoStr.trim();
}

function formatSintomas(sintomasArray) {
  const sintomas = sintomasArray
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s !== '');

  if (sintomas.length === 0) return 'SINTOMATOLOGÍA DIVERSA';
  if (sintomas.length === 1) return sintomas[0];

  const ultimo = sintomas.pop();
  const conector = ultimo.startsWith('I') || ultimo.startsWith('HI') ? ' E ' : ' Y ';

  if (sintomas.length === 1) return `${sintomas[0]}${conector}${ultimo}`;
  return `${sintomas.join(', ')}${conector}${ultimo}`;
}

function generarAutog() {
  return 'MINSA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function rellenarTemplate(html, tokens) {
  let resultado = html;
  for (const [clave, valor] of Object.entries(tokens)) {
    resultado = resultado.split(`{{${clave}}}`).join(valor ?? '');
  }
  return resultado;
}

export async function generarMinsa(body) {
  for (const campo of CAMPOS_REQUERIDOS) {
    if (!body[campo]) throw new Error(`Falta el campo requerido: ${campo}`);
  }

  const sintomasInput = Array.isArray(body.sintomas) ? body.sintomas : [];

  const descansoInicio = calcularInicioDescanso(body.fecha_atencion, body.hora_atencion);
  const dias = calcularDias(descansoInicio, body.descanso_fin);
  const validoHasta = calcularValidoHasta(body.descanso_fin);
  const autog = generarAutog();

  const datos = {
    hospital:            sanitizar(toMayus(body.hospital)),
    pacienteNombre:      sanitizar(toMayus(body.paciente_nombre)),
    pacienteEdad:        calculateYears(body.paciente_nacimiento),
    pacienteDNI:         sanitizar(body.paciente_dni),
    descansoInicio:      getFormatoFecha(descansoInicio),
    descansoFin:         getFormatoFecha(body.descanso_fin),
    diagnosticoCompleto: sanitizar(toMayus(body.diagnostico)),
    fechaAtencion:       formatDateToMinsa(body.fecha_atencion),
    horaAtencion:        formatTime(body.hora_atencion),
    sintomas:            sanitizar(formatSintomas(sintomasInput)),
    diagnosticoLimpio:   sanitizar(toMayus(stripCIE(body.diagnostico))),
    diasTexto:           dias.texto,
    autog
  };

  const qrUrl = `${VERIFICADOR_URL_BASE}?minsa=${autog}`;
  const [qrBase64, logoBase64, firmaBase64] = await Promise.all([
    generarQRBase64(qrUrl),
    Promise.resolve(imagenBase64('minsasello_certificado.png')),
    Promise.resolve(imagenBase64('minsafirma_certificado.png'))
  ]);

  const htmlFinal = rellenarTemplate(TEMPLATE_HTML, {
    LOGO_BASE64:     logoBase64,
    FIRMA_BASE64:    firmaBase64,
    QR_BASE64:       qrBase64,
    HOSPITAL:        datos.hospital,
    PACIENTE_NOMBRE: datos.pacienteNombre,
    PACIENTE_EDAD:   datos.pacienteEdad,
    PACIENTE_DNI:    datos.pacienteDNI,
    INICIO_DESCANSO: datos.descansoInicio,
    FIN_DESCANSO:    datos.descansoFin,
    DIAGNOSTICO:     datos.diagnosticoCompleto,
    OBS_DNI:         datos.pacienteDNI,
    OBS_FECHA:       datos.fechaAtencion,
    OBS_HORA:        datos.horaAtencion,
    OBS_SINTOMAS:    datos.sintomas,
    OBS_DIAGNOSTICO: datos.diagnosticoLimpio,
    OBS_DIAS:        datos.diasTexto
  });

  const pdfBase64 = await htmlAPdfBase64(htmlFinal);

  await pool.query(
    `insert into constancias_minsa
      (autog, hospital, paciente_nombre, paciente_dni, paciente_edad,
       fecha_atencion, descanso_inicio, descanso_fin, descanso_dias,
       diagnostico, sintomas_json, valido_hasta)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      autog,
      toMayus(body.hospital),
      toMayus(body.paciente_nombre),
      body.paciente_dni,
      datos.pacienteEdad,
      body.fecha_atencion,
      descansoInicio,
      body.descanso_fin,
      dias.total,
      toMayus(body.diagnostico),
      JSON.stringify(sintomasInput),
      validoHasta
    ]
  );

  return {
    autog,
    valido_hasta: validoHasta,
    datos,
    pdf_base64: pdfBase64
  };
}