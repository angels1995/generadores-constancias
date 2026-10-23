import { randomBytes } from 'node:crypto';
import { pool } from '../lib/db.js';
import { completarPaciente } from '../lib/reniec.js';
import { validarReceta } from '../lib/receta-input.js';
import { renderHtmlReceta } from '../lib/receta-render.js';
import { htmlRecetaAPdfBase64 } from '../lib/receta-pdf.js';

export function urlVerificadorReceta(autog) {
  const base = process.env.VERIFICADOR_URL_BASE || 'https://minsa.servicios-enlinea.net.pe';
  const url = new URL(base);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('URL de verificación inválida.');
  url.searchParams.set('receta', autog);
  return url.href;
}
export async function generarReceta(body) {
  // Validación estructural y clínica declarada antes de gastar una consulta RENIEC.
  validarReceta({ ...body, paciente_nombre: body?.usar_reniec === true ? 'PENDIENTE RENIEC' : body?.paciente_nombre });
  const input = validarReceta(await completarPaciente(body));
  const autog = `RECETA-${randomBytes(16).toString('hex').toUpperCase()}`;
  const verificador_url = urlVerificadorReceta(autog);
  const emitido = new Date();
  const html = await renderHtmlReceta(input, {
    autog, verificador_url, emitido_lima: emitido.toLocaleString('es-PE', {timeZone:'America/Lima'})
  });
  const pdf_base64 = await htmlRecetaAPdfBase64(html);
  await pool.query(`INSERT INTO recetas_minsa (autog, input_json, valido_hasta, created_at)
    VALUES ($1, $2::jsonb, $3, $4)`, [autog, JSON.stringify(input), input.valido_hasta, emitido]);
  return { autog, valido_hasta: input.valido_hasta, verificador_url, input, pdf_base64,
    avisos: input.medicamentos.flatMap((m, i) => m.atc_aviso ? [`Medicamento ${i+1}: ${m.atc_aviso}`] : []) };
}
