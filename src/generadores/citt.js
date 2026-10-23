import { pool } from '../lib/db.js';
import { htmlAPdfBase64 } from '../lib/pdf.js';
import { completarPaciente } from '../lib/reniec.js';
import { completarOpciones } from '../lib/citt-opciones.js';
import { renderHtmlCitt } from '../lib/citt-render.js';
import { validarEstadoSintomas } from '../lib/sintomas.js';
import { parseFechaUTC, calcularInicioDescanso, calcularDias, calcularValidoHasta } from '../lib/vigencia.js';

const CAMPOS_REQUERIDOS = ['paciente_nombre', 'paciente_dni', 'fecha_atencion', 'hora_atencion', 'descanso_fin', 'diagnostico'];
const toMayus = (value) => value ? String(value).toUpperCase() : '';

export async function generarCitt(body) {
  for (const campo of CAMPOS_REQUERIDOS.filter((campo) => campo !== 'paciente_nombre')) {
    if (!body?.[campo]) throw new Error(`Falta el campo requerido: ${campo}`);
  }
  // Validar las opciones antes de una posible consulta RENIEC.
  body = validarEstadoSintomas(body);
  body = completarOpciones(body);
  body = await completarPaciente(body);
  for (const campo of CAMPOS_REQUERIDOS) {
    if (!body[campo]) throw new Error(`Falta el campo requerido: ${campo}`);
  }
  const descansoInicio = calcularInicioDescanso(body.fecha_atencion, body.hora_atencion);
  const dias = calcularDias(descansoInicio, body.descanso_fin);
  const validoHasta = calcularValidoHasta(body.descanso_fin);
  // Conservar los identificadores y la regla de otorgamiento existentes.
  const depto = Math.floor(100 + Math.random() * 900);
  const correlativo = Math.floor(50000000 + Math.random() * 40000000);
  const autog = `T-${depto}-${correlativo}-26`;
  const autogShort = 'D' + Math.floor(10000000 + Math.random() * 90000000);
  const actoMedico = Math.floor(1000000 + Math.random() * 9000000).toString();
  const otorgamientoDate = parseFechaUTC(descansoInicio);
  if (Number.isNaN(otorgamientoDate.getTime())) throw new Error('Inicio del descanso inválido.');
  otorgamientoDate.setUTCDate(otorgamientoDate.getUTCDate() - 1);
  const htmlFinal = await renderHtmlCitt(body, {
    autog, autogShort, actoMedico, descansoInicio, dias: dias.total,
    fechaOtorgamiento: otorgamientoDate.toISOString().slice(0, 10)
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
      body.paciente_edad !== undefined && body.paciente_edad !== null && body.paciente_edad !== '' ? `${body.paciente_edad} años` : '',
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
    input: body,
    pdf_base64: pdfBase64
  };
}
