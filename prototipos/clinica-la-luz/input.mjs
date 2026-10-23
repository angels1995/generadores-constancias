import fs from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {texto,fecha,hora} from '../../src/lib/essalud-demo.js';
import {validarReceta} from '../../src/lib/receta-input.js';
import {completarPaciente} from '../../src/lib/reniec.js';
import {calcularDias,hoyPeruISO} from '../../src/lib/vigencia.js';
import {leerRecursosPdf} from '../../src/lib/pdf-recursos.js';
import {edadCalendario} from '../recetas-compactas/input.mjs';

const bad=s=>Object.assign(new Error(s),{statusCode:400});
const OPTIONAL={sede:80,direccion:140,ubicacion:120,medico_nombre:100,medico_cmp:12,
  medico_especialidad:80,historia_interna:30,paciente_sexo:15,usuario:70,
  presenta:1000,procedimiento:1000,observaciones:1000,cie10:12};

// Candidato aislado, sin rutas ni registro público. RENIEC es optativo e inyectable.
export async function prepararLaLuz(raw,tipo,{completar=completarPaciente,now=new Date(),
  config=new URL('../../config/recursos-pdf.json',import.meta.url)}={}) {
  if(!['certificado','receta','descanso'].includes(tipo))throw bad('Tipo de documento inválido.');
  if(!raw||Array.isArray(raw)||typeof raw!=='object')throw bad('Se requiere un objeto JSON.');
  if(raw.usar_reniec!=null&&typeof raw.usar_reniec!=='boolean')throw bad('usar_reniec debe ser booleano.');
  const body={...raw,usar_reniec:raw.usar_reniec??false};
  body.paciente_dni=texto(body.paciente_dni,'paciente_dni',8,true);
  if(!/^\d{8}$/.test(body.paciente_dni))throw bad('DNI debe tener 8 dígitos de texto.');
  body.fecha_atencion=fecha(body.fecha_atencion,'fecha_atencion');
  body.hora_atencion=hora(body.hora_atencion,'hora_atencion',false);
  const prefix='laluz_'+tipo;
  const settings=JSON.parse(fs.readFileSync(config,'utf8'));
  for(const [key,max] of Object.entries(OPTIONAL)) {
    body[key]=texto(body[key],key,max);
    if(['sede','direccion','ubicacion','medico_nombre','medico_cmp','medico_especialidad'].includes(key))
      body[key] ||= texto(settings[prefix+'_'+key],prefix+'_'+key,max);
  }
  if(body.paciente_sexo&&!['MASCULINO','FEMENINO','OTRO'].includes(body.paciente_sexo.toUpperCase()))throw bad('Sexo inválido.');
  body.paciente_sexo=body.paciente_sexo.toUpperCase();
  body.diagnostico=texto(body.diagnostico,'diagnostico',tipo==='receta'?220:600,tipo!=='receta');
  let dias=null;
  if(tipo==='receta') {
    validarReceta({...body,paciente_nombre:body.usar_reniec?'PENDIENTE RENIEC':body.paciente_nombre});
  } else {
    body.descanso_inicio=fecha(body.descanso_inicio,'descanso_inicio',false)||body.fecha_atencion;
    body.descanso_fin=fecha(body.descanso_fin,'descanso_fin');
    body.descanso_hora_inicio=hora(body.descanso_hora_inicio,'descanso_hora_inicio',false)||body.hora_atencion;
    body.descanso_hora_fin=hora(body.descanso_hora_fin,'descanso_hora_fin',false);
    if(body.descanso_inicio<body.fecha_atencion)throw bad('Inicio anterior a la atención.');
    dias=calcularDias(body.descanso_inicio,body.descanso_fin).total;
    if(dias<1||dias>366)throw bad('El período debe contener de 1 a 366 días.');
    if(dias===1&&body.descanso_hora_inicio&&body.descanso_hora_fin&&body.descanso_hora_fin<body.descanso_hora_inicio)
      throw bad('Hora final anterior al inicio.');
  }
  // Validación clínica y estructural completa antes de cualquier consulta.
  const person=await completar(body);
  person.paciente_nombre=texto(person.paciente_nombre,'paciente_nombre',100,true);
  let age='';
  if(person.paciente_nacimiento!=null&&person.paciente_nacimiento!=='') {
    person.paciente_nacimiento=fecha(person.paciente_nacimiento,'paciente_nacimiento');
    if(person.paciente_nacimiento>body.fecha_atencion||person.paciente_nacimiento>hoyPeruISO())throw bad('Nacimiento posterior a la atención o a hoy.');
    const detailed=edadCalendario(person.paciente_nacimiento,body.fecha_atencion);
    age=Number(detailed.split(' ')[0]);
  } else if(person.paciente_edad!=null&&person.paciente_edad!=='') {
    if(typeof person.paciente_edad!=='number'||!Number.isInteger(person.paciente_edad))throw bad('Edad debe ser un entero.');
    age=person.paciente_edad;
  }
  if(age!==''&&(age<0||age>130))throw bad('Edad fuera de rango.');
  let input={...body,paciente_nombre:person.paciente_nombre,paciente_nacimiento:person.paciente_nacimiento||'',paciente_edad:age};
  if(tipo==='receta')input={...input,...validarReceta(input)};
  input.historia_interna ||= 'INT-HC-'+createHash('sha256').update('muestra-local:'+input.paciente_dni).digest('hex').slice(0,12).toUpperCase();
  input.estado='PENDIENTE_FIRMA';
  const keys=['logo','firma','sello',...(tipo==='descanso'?['isotipo']:[])];
  const images=leerRecursosPdf(keys.map(k=>prefix+'_'+k),{config});
  const recursos=Object.fromEntries(keys.map(k=>[k,images[prefix+'_'+k]?.bytes.toString('base64')??null]));
  const autog='LOCAL-'+randomBytes(8).toString('hex').toUpperCase();
  return {...input,tipo,dias,autog,recursos,registrado:false,
    verificador_url:'https://minsa.servicios-enlinea.net.pe/?muestra='+autog,
    fecha_emision:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),
    hora_emision:new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:true}).format(now)};
}
