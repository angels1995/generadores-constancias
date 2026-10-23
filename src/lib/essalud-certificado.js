import {randomUUID} from 'node:crypto';
import {texto,fecha,hora,pdfEssaludDemo} from './essalud-demo.js';
import {completarPaciente} from './reniec.js';
import {completarOpciones} from './citt-opciones.js';
import {calcularDias} from './vigencia.js';

const bad=message=>Object.assign(new Error(message),{statusCode:400});
const dateDisplay=value=>value.split('-').reverse().join('/');
const timeDisplay=value=>!value?'':`${String(Number(value.slice(0,2))%12||12).padStart(2,'0')}:${value.slice(3)} ${Number(value.slice(0,2))>=12?'PM':'AM'}`;
const longDate=value=>new Intl.DateTimeFormat('es-PE',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T00:00:00Z'));

export async function prepararCertificadoEssalud(raw,completar=completarPaciente,now=new Date()) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw bad('El cuerpo debe ser un objeto JSON.');
  if(raw.usar_reniec!=null&&typeof raw.usar_reniec!=='boolean')throw bad('usar_reniec debe ser true o false.');
  const body={...raw,usar_reniec:raw.usar_reniec??false};
  body.paciente_dni=texto(body.paciente_dni,'paciente_dni',8,true);
  if(!/^\d{8}$/.test(body.paciente_dni))throw bad('paciente_dni debe contener 8 dígitos.');
  body.fecha_atencion=fecha(body.fecha_atencion,'fecha_atencion');
  body.hora_atencion=hora(body.hora_atencion,'hora_atencion');
  body.descanso_inicio=fecha(body.descanso_inicio,'descanso_inicio',false)||body.fecha_atencion;
  body.descanso_fin=fecha(body.descanso_fin,'descanso_fin');
  body.descanso_hora_inicio=hora(body.descanso_hora_inicio,'descanso_hora_inicio',false)||body.hora_atencion;
  body.descanso_hora_fin=hora(body.descanso_hora_fin,'descanso_hora_fin',false);
  if(body.descanso_inicio<body.fecha_atencion)throw bad('descanso_inicio no puede ser anterior a fecha_atencion.');
  const dias=calcularDias(body.descanso_inicio,body.descanso_fin).total;
  if(dias<1||dias>366)throw bad('El descanso debe contener entre 1 y 366 días.');
  if(dias===1&&body.descanso_hora_fin&&body.descanso_hora_fin<body.descanso_hora_inicio)throw bad('La hora final no puede ser anterior al inicio del mismo día.');
  body.diagnostico=texto(body.diagnostico,'diagnostico',600,true);
  body.recomendaciones=texto(body.recomendaciones,'recomendaciones',1000);
  body.medico_nombre=texto(body.medico_nombre,'medico_nombre',140);
  body.medico_especialidad=texto(body.medico_especialidad??body.servicio,'medico_especialidad',100);
  body.medico_cmp=texto(body.medico_cmp,'medico_cmp',20);
  body.medico_rne=texto(body.medico_rne,'medico_rne',20);
  body.lema=texto(body.lema,'lema',180);
  body.distrito_expedicion=texto(body.distrito_expedicion,'distrito_expedicion',80);
  for(const field of ['hospital','establecimiento_catalogo','establecimiento_codigo','seguro','contingencia'])body[field]=texto(body[field],field);
  if(!body.hospital&&!body.establecimiento_codigo)throw bad('Indica hospital o un establecimiento del catálogo.');
  const input=await completar(completarOpciones(body));
  input.paciente_nombre=texto(input.paciente_nombre,'paciente_nombre',180,true);
  if(input.paciente_edad==null||input.paciente_edad==='')input.paciente_edad='';
  else if(!/^\d{1,3}$/.test(String(input.paciente_edad))||Number(input.paciente_edad)>130)throw bad('paciente_edad debe ser un entero de 0 a 130, o vacío.');
  const autog='ESSALUD-'+randomUUID().replaceAll('-','').toUpperCase();
  const url=new URL(process.env.VERIFICADOR_URL_BASE||'https://minsa.servicios-enlinea.net.pe');
  if(!['http:','https:'].includes(url.protocol))throw Object.assign(new Error('Verificador no disponible.'),{statusCode:503});
  for(const key of ['citt','minsa','receta','essalud','autog'])url.searchParams.delete(key);
  url.searchParams.set('essalud',autog);
  const emision=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
  const verificador_url=url.toString();
  return {input,autog,inicio:input.descanso_inicio,dias,verificador_url,render:{
    autog,verificador_url,lema:input.lema,medico:input.medico_nombre,especialidad:input.medico_especialidad,
    cmp:input.medico_cmp,rne:input.medico_rne,hospital:input.hospital,paciente:input.paciente_nombre,
    edad:input.paciente_edad,fecha_atencion:longDate(input.fecha_atencion),hora_atencion:timeDisplay(input.hora_atencion),
    diagnostico:input.diagnostico,inicio:dateDisplay(input.descanso_inicio),fin:dateDisplay(input.descanso_fin),
    hora_inicio:timeDisplay(input.descanso_hora_inicio),hora_fin:timeDisplay(input.descanso_hora_fin),dias,
    recomendaciones:input.recomendaciones,distrito:input.distrito_expedicion||input.establecimiento_distrito,
    fecha_expedicion:new Intl.DateTimeFormat('es-PE',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(emision+'T00:00:00Z')),
    emision:dateDisplay(emision),hora_emision:timeDisplay(clock)
  }};
}
export const pdfCertificadoEssalud=data=>pdfEssaludDemo(data,{tipo:'certificado'});
