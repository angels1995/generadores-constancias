import {validarReceta,textoReceta,completarIdentificadoresReceta} from '../../src/lib/receta-input.js';
import {leerRecursosPdf} from '../../src/lib/pdf-recursos.js';
import fs from 'node:fs';

function sumarMeses(fecha,meses) {
  const year=fecha.getUTCFullYear(), month=fecha.getUTCMonth()+meses;
  const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return new Date(Date.UTC(year,month,Math.min(fecha.getUTCDate(),last)));
}
// Recibe las fechas ya validadas por validarReceta. Fechas UTC, sin efectos de zona horaria.
export function edadCalendario(nacimiento,atencion) {
  const birth=new Date(nacimiento+'T00:00:00Z'),end=new Date(atencion+'T00:00:00Z');
  let months=(end.getUTCFullYear()-birth.getUTCFullYear())*12+end.getUTCMonth()-birth.getUTCMonth();
  if(sumarMeses(birth,months)>end)months--;
  const days=Math.round((end-sumarMeses(birth,months))/86400000);
  return `${Math.floor(months/12)} años ${months%12} meses ${days} días`;
}

// Candidato local: no registra documentos, no consulta RENIEC ni cambia la API.
export function prepararCompacta(body, perfil, meta, {
  config=new URL('../../config/recursos-pdf.json',import.meta.url)
}={}) {
  if(!['minsa','essalud'].includes(perfil))throw new Error('Perfil inválido.');
  const input=validarReceta(body);
  for(const [key,max] of Object.entries({numero_orden:64,paciente_pi:64,autogenerado_paciente:64,
    acto_medico:64,documento_id:64,farmacia_codigo:30,farmacia_nombre:70,
    edad_detallada:60,aviso_atencion_usuario:220})) {
    input[key]=textoReceta(body[key],key,max);
  }
  input.medicamentos=input.medicamentos.map((m,i)=>({...m,
    codigo_producto:textoReceta(body.medicamentos[i].codigo_producto,`medicamentos[${i}].codigo_producto`,24),
    um_ff:textoReceta(body.medicamentos[i].um_ff,`medicamentos[${i}].um_ff`,30)||m.forma}));
  const prefix=perfil==='minsa'?'receta_minsa_compacta':'essalud_receta_compacta';
  const settings=JSON.parse(fs.readFileSync(config,'utf8'));
  for(const [key,max] of Object.entries({medico_nombre:100,medico_cmp:12,farmacia_codigo:30,farmacia_nombre:70})) {
    const configured=textoReceta(settings[prefix+'_'+key],prefix+'_'+key,max);
    input[key]=input[key]||configured;
  }
  // Identificadores de demostración internos, no numeraciones institucionales.
  completarIdentificadoresReceta(input);
  // En el prototipo, la misma identidad conserva su referencia entre ambos perfiles.
  // Un sistema clínico real debe usar la historia persistida en su BD autorizada.
  if(input.paciente_nacimiento)input.edad_detallada=edadCalendario(input.paciente_nacimiento,input.fecha_atencion);
  const keys=['logo','firma','sello'].map(k=>prefix+'_'+k);
  const images=leerRecursosPdf(keys,{config});
  const recursos=Object.fromEntries(['logo','firma','sello'].map(k=>[k,images[prefix+'_'+k]?.bytes.toString('base64')??null]));
  if(!/^LOCAL-[A-F0-9]{16}$/.test(meta.codigo))throw new Error('Se requiere código de muestra local.');
  return {...input,perfil,recursos,autog:meta.codigo,
    // El código es deliberadamente local: no simular un registro público real.
    verificador_url:'https://minsa.servicios-enlinea.net.pe/?muestra='+meta.codigo,
    fecha_impresion:meta.fecha_impresion,hora_impresion:meta.hora_impresion};
}
