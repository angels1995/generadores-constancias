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
  path.join(__dirname, '..', 'templates', 'citt.html'),
  'utf-8'
);

const VERIFICADOR_URL_BASE =
  process.env.VERIFICADOR_URL_BASE || 'https://tu-proyecto.pages.dev/certificado_citt.html';

const CAMPOS_REQUERIDOS = [
  'paciente_nombre',
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

function getFormatoFechaMinsa(dateStr) {
  if (!dateStr) return 'N/A';
  const date = parseFechaUTC(dateStr);
  if (!date || isNaN(date.getTime())) return 'N/A';
  const day   = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year  = date.getUTCFullYear();
  return `${year}-${month}-${day}`;
}

function generarAutogMinsa() {
  const depto       = Math.floor(100 + Math.random() * 900);
  const correlativo = Math.floor(50000000 + Math.random() * 40000000);
  return `T-${depto}-${correlativo}-26`;
}

function rellenarTemplate(html, tokens) {
  let resultado = html;
  for (const [clave, valor] of Object.entries(tokens)) {
    resultado = resultado.split(`{{${clave}}}`).join(valor ?? '');
  }
  return resultado;
}

export async function generarCitt(body) {
  for (const campo of CAMPOS_REQUERIDOS) {
    if (!body[campo]) throw new Error(`Falta el campo requerido: ${campo}`);
  }

  const descansoInicio = calcularInicioDescanso(body.fecha_atencion, body.hora_atencion);
  const dias           = calcularDias(descansoInicio, body.descanso_fin);
  const validoHasta    = calcularValidoHasta(body.descanso_fin);

  const autog      = generarAutogMinsa();
  const autogShort = 'D' + Math.floor(10000000 + Math.random() * 90000000);
  const actoMedico = Math.floor(1000000 + Math.random() * 9000000).toString();

  const otorgamientoDate = parseFechaUTC(descansoInicio);
  if (!otorgamientoDate || isNaN(otorgamientoDate.getTime())) {
    throw new Error(`descansoInicio inválido: ${descansoInicio}`);
  }
  otorgamientoDate.setUTCDate(otorgamientoDate.getUTCDate() - 1);
  const fechaOtorgamiento = getFormatoFechaMinsa(otorgamientoDate.toISOString().slice(0, 10));

  const medicoNombre = toMayus(body.medico_nombre || 'MEDICO GARCIA TORRES PEDRO JOSE');
  const medicoCmp    = body.medico_cmp  || '012345';
  const medicoRne    = body.medico_rne  || '022291';
  const medicoRuc    = body.medico_ruc  || '2163486454';
  const servicio     = toMayus(body.servicio      || 'MEDICINA GENERAL');
  const tipoAtencion = toMayus(body.tipo_atencion || 'CONSULTA EXTERNA');
  const usuario      = toMayus(body.usuario       || body.paciente_nombre);

  const ahora    = new Date();
  const horaHoy  = ahora.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit',
    hour12: true, timeZone: 'America/Lima'
  });
  const fechaHoy = getFormatoFechaMinsa(ahora.toISOString().slice(0, 10));

  const qrUrl = `${VERIFICADOR_URL_BASE}?citt=${autog}`;
  const [qrBase64, logoBase64, firmaBase64] = await Promise.all([
    generarQRBase64(qrUrl),
    Promise.resolve(imagenBase64('sello.png')),
    Promise.resolve(imagenBase64('minsafirma_certificado.png'))
  ]);

  const htmlFinal = rellenarTemplate(TEMPLATE_HTML, {
    LOGO_BASE64:        logoBase64,
    SELLO_BASE64:       logoBase64,
    FIRMA_BASE64:       firmaBase64,
    QR_BASE64:          qrBase64,
    HOSPITAL:           sanitizar(toMayus(body.hospital || 'HOSPITAL NACIONAL')),
    ACTO_MEDICO:        actoMedico,
    AUTOG:              autog,
    AUTOG_SHORT:        autogShort,
    SERVICIO:           sanitizar(servicio),
    TIPO_ATENCION:      sanitizar(tipoAtencion),
    PACIENTE_NOMBRE:    sanitizar(toMayus(body.paciente_nombre)),
    PACIENTE_EDAD:      sanitizar(String(body.paciente_edad || '')),
    PACIENTE_DNI:       sanitizar(body.paciente_dni),
    DIAGNOSTICO:        sanitizar(toMayus(body.diagnostico)),
    INICIO_DESCANSO:    getFormatoFechaMinsa(descansoInicio),
    FIN_DESCANSO:       getFormatoFechaMinsa(body.descanso_fin),
    OBS_DIAS:           String(dias.total),
    FECHA_OTORGAMIENTO: fechaOtorgamiento,
    MEDICO_NOMBRE:      sanitizar(medicoNombre),
    MEDICO_CMP:         sanitizar(medicoCmp),
    MEDICO_RNE:         sanitizar(medicoRne),
    MEDICO_RUC:         sanitizar(medicoRuc),
    USUARIO:            sanitizar(usuario),
    FECHA_HOY:          fechaHoy,
    HORA_HOY:           horaHoy
  });

  const pdfBase64 = await htmlAPdfBase64(htmlFinal);

  await pool.query(
    `insert into constancias_citt
      (autog, hospital, paciente_nombre, paciente_dni, paciente_edad,
       fecha_atencion, descanso_inicio, descanso_fin, descanso_dias,
       diagnostico, sintomas_json, valido_hasta)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      autog,
      toMayus(body.hospital || 'HOSPITAL NACIONAL'),
      toMayus(body.paciente_nombre),
      body.paciente_dni,
      body.paciente_edad ? `${body.paciente_edad} años` : '',
      body.fecha_atencion,
      descansoInicio,
      body.descanso_fin,
      dias.total,
      toMayus(body.diagnostico),
      JSON.stringify(body.sintomas || []),
      validoHasta
    ]
  );

  return {
    autog,
    valido_hasta: validoHasta,
    pdf_base64: pdfBase64
  };
}