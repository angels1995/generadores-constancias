import {randomUUID} from 'node:crypto';
import {validarReceta,textoReceta,completarIdentificadoresReceta} from './receta-input.js';
import {completarPaciente} from './reniec.js';
import {pdfEssaludDemo} from './essalud-demo.js';

export async function prepararRecetaEssalud(raw,completar=completarPaciente,now=new Date()) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Object.assign(new Error('El cuerpo debe ser un objeto JSON.'),{statusCode:400});
  if(raw.usar_reniec!=null&&typeof raw.usar_reniec!=='boolean')throw Object.assign(new Error('usar_reniec debe ser true o false.'),{statusCode:400});
  const body={...raw,usar_reniec:raw.usar_reniec??false,
    atencion:raw.atencion??raw.tipo_atencion,
    especialidad:raw.especialidad??raw.servicio,
    historia_interna:raw.historia_interna??raw.historia_clinica};
  const extra=Object.fromEntries(['paciente_pi','autogenerado_paciente','acto_medico','documento_id','numero_orden'].map(key=>[key,textoReceta(body[key],key,64)]));
  validarReceta({...body,paciente_nombre:body.usar_reniec?'PENDIENTE RENIEC':body.paciente_nombre});
  const um=body.medicamentos.map((m,i)=>textoReceta(m.um_ff,`medicamentos[${i}].um_ff`,30));
  const input={...validarReceta(await completar(body)),...extra,estado:'PENDIENTE_FIRMA'};
  completarIdentificadoresReceta(input);
  input.medicamentos=input.medicamentos.map((m,i)=>({...m,um_ff:um[i]||m.forma}));
  const autog='ESSALUD-'+randomUUID().replaceAll('-','').toUpperCase();
  const url=new URL(process.env.VERIFICADOR_URL_BASE||'https://minsa.servicios-enlinea.net.pe');
  if(!['http:','https:'].includes(url.protocol))throw Object.assign(new Error('Verificador no disponible.'),{statusCode:503});
  for(const key of ['citt','minsa','receta','essalud','autog'])url.searchParams.delete(key);
  url.searchParams.set('essalud',autog);
  const emision=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
  const [h,m]=clock.split(':');
  const hora=`${String(Number(h)%12||12).padStart(2,'0')}:${m} ${Number(h)>=12?'PM':'AM'}`;
  const verificador_url=url.toString();
  return {input,autog,verificador_url,render:{...input,autog,verificador_url,
    numero_orden:input.numero_orden||autog,emision:emision.split('-').reverse().join('/'),hora_emision:hora,
    vigencia:input.valido_hasta.split('-').reverse().join('/')}};
}
export const pdfRecetaEssalud=data=>pdfEssaludDemo(data,{tipo:'receta'});
