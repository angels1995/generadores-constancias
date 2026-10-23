import fs from 'node:fs';
import { imagenBase64 } from './assets.js';
import { generarQRBase64 } from './qr.js';

const template = fs.readFileSync(new URL('../templates/minsa.html', import.meta.url), 'utf8');
const escapar = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const mayus = (value) => String(value ?? '').toUpperCase();
const fecha = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
const hora = (value) => {
  const [h, m] = value.split(':');
  return `${String(Number(h) % 12 || 12).padStart(2, '0')}:${m} ${Number(h) >= 12 ? 'PM' : 'AM'}`;
};

export function validarHoraFin(value) {
  const text = value == null ? '' : String(value).trim();
  if (text && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
    throw new Error('descanso_hora_fin debe tener formato HH:MM de 24 horas o estar vacío.');
  }
  return text;
}

export async function renderHtmlMinsa(body, meta) {
  const now = new Date();
  const base = process.env.VERIFICADOR_URL_BASE || 'https://tu-proyecto.pages.dev/certificado_minsa.html';
  const horaFin = validarHoraFin(body.descanso_hora_fin);
  const tokens = {
    LOGO: imagenBase64('logo_minsa_citt.png','minsa_logo'), SELLO: imagenBase64('sello.png','minsa_sello'), FIRMA: imagenBase64('minsafirma_certificado.png','minsa_firma'),
    QR: await generarQRBase64(`${base}?minsa=${meta.autog}`),
    PACIENTE: mayus(body.paciente_nombre), DNI: body.paciente_dni,
    EDAD: String(meta.pacienteEdad).replace(/\s*años$/, ''),
    HOSPITAL: mayus(body.hospital),
    UBICACION: [body.establecimiento_departamento, body.establecimiento_provincia, body.establecimiento_distrito]
      .filter(Boolean).join(' / ').toUpperCase(),
    SEGURO: body.seguro, INICIO: fecha(meta.descansoInicio), HORA: hora(body.hora_atencion),
    FIN: fecha(body.descanso_fin) + (horaFin ? ` · ${hora(horaFin)}` : ''),
    DIAS: meta.dias, DIAGNOSTICO: mayus(body.diagnostico),
    OBSERVACIONES: [meta.observacionesAutomaticas, body.observaciones].filter(Boolean).join('\n\n'),
    USUARIO: mayus(String(body.usuario ?? '').trim() || 'JUAN PEREZ RODRIGUEZ'),
    CMP: body.medico_cmp ?? '', MEDICO: mayus(body.medico_nombre),
    FECHA_EMISION: now.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' }),
    HORA_EMISION: now.toLocaleTimeString('en-US', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true })
  };
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key) => {
    if (!(key in tokens)) throw new Error(`Campo de plantilla sin valor: ${key}`);
    return escapar(tokens[key]);
  });
}
