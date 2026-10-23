import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { completarPaciente } from './reniec.js';
import { completarOpciones } from './citt-opciones.js';
import { calcularInicioDescanso, calcularDias } from './vigencia.js';
import { leerRecursosEssalud } from './essalud-recursos.js';

const bad = message => Object.assign(new Error(message), { statusCode: 400 });
export function texto(value, field, max = 180, required = false) {
  if (value == null) value = '';
  if (typeof value !== 'string') throw bad(`${field} debe ser texto.`);
  value = value.trim();
  if ((required && !value) || value.length > max) throw bad(`${field}: requerido o supera ${max} caracteres.`);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw bad(`${field} contiene caracteres inválidos.`);
  return value;
}
export function fecha(value, field, required = true) {
  value = texto(value, field, 10, required);
  if (!value && !required) return '';
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== value) throw bad(`${field}: usa una fecha válida YYYY-MM-DD.`);
  return value;
}
export function hora(value, field, required = true) {
  value = texto(value, field, 5, required);
  if (!value && !required) return '';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw bad(`${field}: usa HH:MM.`);
  return value;
}
const mostrarFecha = value => value.split('-').reverse().join('/');
const mostrarHora = value => !value ? '' : `${String(Number(value.slice(0,2))%12 || 12).padStart(2,'0')}:${value.slice(3)} ${Number(value.slice(0,2))>=12?'PM':'AM'}`;

export async function prepararEssaludDemo(raw, completar = completarPaciente, now = new Date()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw bad('El cuerpo debe ser un objeto JSON.');
  if (raw.usar_reniec != null && typeof raw.usar_reniec !== 'boolean') throw bad('usar_reniec debe ser true o false.');
  const body = { ...raw, usar_reniec: raw.usar_reniec ?? false };
  body.paciente_dni = texto(body.paciente_dni, 'paciente_dni', 8, true);
  if (!/^\d{8}$/.test(body.paciente_dni)) throw bad('paciente_dni debe contener 8 dígitos.');
  body.fecha_atencion = fecha(body.fecha_atencion,'fecha_atencion');
  body.hora_atencion = hora(body.hora_atencion,'hora_atencion');
  body.descanso_fin = fecha(body.descanso_fin,'descanso_fin');
  body.descanso_hora_fin = hora(body.descanso_hora_fin,'descanso_hora_fin',false);
  body.fecha_probable_parto = fecha(body.fecha_probable_parto,'fecha_probable_parto',false);
  body.fecha_otorgamiento = fecha(body.fecha_otorgamiento,'fecha_otorgamiento',false) || body.fecha_atencion;
  body.diagnostico = texto(body.diagnostico,'diagnostico',300,true);
  body.observaciones = texto(body.observaciones,'observaciones',600);
  body.servicio = texto(body.servicio,'servicio',120) || 'MEDICINA GENERAL';
  body.tipo_atencion = texto(body.tipo_atencion,'tipo_atencion',80) || 'CONSULTA EXTERNA';
  body.medico_nombre = texto(body.medico_nombre,'medico_nombre',140);
  body.usuario = texto(body.usuario,'usuario',100);
  for (const field of ['hospital','establecimiento_catalogo','establecimiento_codigo','seguro','contingencia']) body[field] = texto(body[field],field);
  if (!body.hospital && !body.establecimiento_codigo) throw bad('Indica hospital o un establecimiento del catálogo.');
  const normalized = completarOpciones(body);
  const inicio = calcularInicioDescanso(body.fecha_atencion,body.hora_atencion);
  const dias = calcularDias(inicio,body.descanso_fin).total;
  if (!dias || dias>366) throw bad('El período debe contener entre 1 y 366 días desde el inicio calculado.');
  const input = await completar(normalized);
  input.paciente_nombre = texto(input.paciente_nombre,'paciente_nombre',180,true);
  if (input.paciente_edad == null || input.paciente_edad==='') input.paciente_edad='';
  else if (!/^\d{1,3}$/.test(String(input.paciente_edad)) || Number(input.paciente_edad)>130) throw bad('paciente_edad debe ser un entero entre 0 y 130, o vacío.');
  const autog = `ESSALUD-${randomUUID().replaceAll('-','').toUpperCase()}`;
  const verificador = new URL(process.env.VERIFICADOR_URL_BASE || 'https://minsa.servicios-enlinea.net.pe');
  if (!['https:', 'http:'].includes(verificador.protocol)) throw Object.assign(new Error('Verificador no disponible.'), {statusCode:503});
  for (const key of ['citt','minsa','receta','essalud','autog']) verificador.searchParams.delete(key);
  verificador.searchParams.set('essalud',autog);
  const verificador_url = verificador.toString();
  const emision = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const clock = new Intl.DateTimeFormat('en-GB',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
  return { input, autog, inicio, dias, verificador_url, render: {
    hospital:input.hospital,servicio:input.servicio,paciente:input.paciente_nombre,dni:input.paciente_dni,
    edad:input.paciente_edad,atencion:input.tipo_atencion,contingencia:input.contingencia,
    diagnostico:input.diagnostico,parto:input.fecha_probable_parto?mostrarFecha(input.fecha_probable_parto):'',
    inicio,fin:input.descanso_fin,hora_inicio:mostrarHora(input.hora_atencion),hora_fin:mostrarHora(input.descanso_hora_fin),
    otorgamiento:mostrarFecha(input.fecha_otorgamiento),emision:mostrarFecha(emision),hora_emision:mostrarHora(clock),
    observaciones:input.observaciones,autog,medico:input.medico_nombre,usuario:input.usuario,verificador_url
  }};
}

let active = 0;
export async function pdfEssaludDemo(data,{tipo='citt'}={}) {
  if(!['citt','certificado','receta'].includes(tipo))throw bad('Tipo de documento no válido.');
  if (active >= 2) throw Object.assign(new Error('Generador ocupado. Intenta nuevamente.'),{statusCode:503});
  active++;
  try {
    const recursos = await leerRecursosEssalud(undefined,tipo);
    return await new Promise((resolve,reject) => {
      const python = process.env.ESSALUD_DEMO_PYTHON || '/opt/constancias-essalud-demo-venv/bin/python';
      const name={citt:'render-pendiente-global.py',certificado:'render-certificado.py',receta:'render-receta.py'}[tipo];
      const script = fileURLToPath(new URL('../essalud-demo/'+name,import.meta.url));
      const child = spawn(python,[script,'--stdin'],{stdio:['pipe','pipe','pipe'],windowsHide:true,timeout:15000});
      const chunks=[]; let length=0, errors='';
      child.stdout.on('data',chunk=>{length+=chunk.length;if(length>4*1024*1024)child.kill();else chunks.push(chunk);});
      child.stderr.on('data',chunk=>{if(errors.length<1000)errors+=chunk.toString();});
      child.stdin.on('error',()=>{});
      child.on('error',()=>reject(Object.assign(new Error('El generador PDF no está disponible.'),{statusCode:503})));
      child.on('close',code=>{
        if (code!==0) return reject(errors.startsWith('CONTENT_TOO_LONG') ? bad('El contenido excede una página. Resume los campos.') : Object.assign(new Error('No se pudo generar el PDF.'),{statusCode:503}));
        const pdf=Buffer.concat(chunks);
        if(pdf.subarray(0,5).toString()!=='%PDF-') return reject(Object.assign(new Error('Respuesta PDF inválida.'),{statusCode:503}));
        resolve(pdf.toString('base64'));
      });
      child.stdin.end(JSON.stringify({...data,recursos}));
    });
  } finally { active--; }
}
