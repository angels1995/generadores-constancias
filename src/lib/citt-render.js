import fs from 'node:fs';
import { imagenBase64 } from './assets.js';
import { generarQRBase64 } from './qr.js';
import { hoyPeruISO } from './vigencia.js';

const template = fs.readFileSync(new URL('../templates/citt.html', import.meta.url), 'utf8');
const escapar = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const mayus = (value) => String(value ?? '').toUpperCase();
const fecha = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');
function hora(value) {
  const [h, m] = value.split(':');
  return `${String(Number(h) % 12 || 12).padStart(2, '0')}:${m} ${Number(h) >= 12 ? 'PM' : 'AM'}`;
}

export async function renderHtmlCitt(body, meta) {
  const now = new Date();
  const hora24 = now.toLocaleTimeString('en-GB', { timeZone: 'America/Lima', hour12: false });
  const base = process.env.VERIFICADOR_URL_BASE || 'https://tu-proyecto.pages.dev/certificado_citt.html';
  const tokens = {
    LOGO: imagenBase64('logo_minsa_citt.png','citt_logo'),
    SELLO: imagenBase64('sello.png','citt_sello'), FIRMA: imagenBase64('minsafirma_certificado.png','citt_firma'),
    QR: await generarQRBase64(`${base}?citt=${meta.autog}`),
    HOSPITAL: mayus(body.hospital), DIRECCION: body.establecimiento_direccion,
    UBICACION: [body.establecimiento_departamento, body.establecimiento_provincia, body.establecimiento_distrito]
      .filter(Boolean).join(' / ').toUpperCase(),
    AUTOG: meta.autog, AUTOG_SHORT: meta.autogShort, ACTO_MEDICO: meta.actoMedico,
    SERVICIO: mayus(body.servicio || 'MEDICINA GENERAL'),
    TIPO_ATENCION: mayus(body.tipo_atencion || 'CONSULTA EXTERNA'),
    PACIENTE_NOMBRE: mayus(body.paciente_nombre), PACIENTE_DNI: body.paciente_dni,
    EDAD_SEXO: [body.paciente_edad, body.paciente_sexo].filter((v) => v !== '' && v != null).join(' / '),
    SEGURO: body.seguro, CONTINGENCIA: body.contingencia,
    INICIO: fecha(meta.descansoInicio), HORA_ATENCION: hora(body.hora_atencion), FIN: fecha(body.descanso_fin),
    DIAS: meta.dias, OTORGAMIENTO: fecha(meta.fechaOtorgamiento),
    MEDICO: mayus(body.medico_nombre || 'MEDICO GARCIA TORRES PEDRO JOSE'),
    CMP: body.medico_cmp || '012345', RNE: body.medico_rne || '022291',
    DIAGNOSTICO: mayus(body.diagnostico), OBSERVACIONES: [body.observaciones,body.sintomas_no_consignados===true?'Síntomas: no consignados.':''].filter(Boolean).join('\n'),
    USUARIO: mayus(String(body.usuario ?? '').trim() || 'JUAN PEREZ'),
    FECHA_EMISION: fecha(hoyPeruISO()), HORA_EMISION: hora(hora24), HORA_EMISION_24: hora24
  };
  const html = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => {
    if (!(key in tokens)) throw new Error(`Campo de plantilla sin valor: ${key}`);
    return escapar(tokens[key]);
  });
  return html;
}
