import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepararCompacta} from '../../prototipos/recetas-compactas/input.mjs';
import {prepararLaLuz} from '../../prototipos/clinica-la-luz/input.mjs';
import {prepararCertificadoEssalud,pdfCertificadoEssalud} from './essalud-certificado.js';
import {prepararRecetaEssalud,pdfRecetaEssalud} from './essalud-receta.js';
import {completarPaciente} from './reniec.js';
import {validarReceta} from './receta-input.js';

export const TIPOS_DOCUMENTO=Object.freeze({
  'receta-minsa-v2':{nombre:'Receta MINSA/SIS v2',script:'recetas-compactas',perfil:'minsa'},
  'receta-essalud-v2':{nombre:'Receta EsSalud v2',script:'recetas-compactas',perfil:'essalud'},
  'laluz-certificado':{nombre:'Certificado La Luz',script:'clinica-la-luz',perfil:'certificado'},
  'laluz-receta':{nombre:'Receta La Luz',script:'clinica-la-luz',perfil:'receta'},
  'laluz-descanso':{nombre:'Descanso La Luz',script:'clinica-la-luz',perfil:'descanso'},
  'certificado-essalud':{nombre:'Certificado EsSalud',legacy:'certificado'},
  'receta-essalud-v1':{nombre:'Receta EsSalud v1',legacy:'receta'}
});
const bad=s=>Object.assign(new Error(s),{statusCode:400});
export async function prepararVersionado(tipo,body,{completar=completarPaciente,now=new Date(),config}={}) {
  const spec=TIPOS_DOCUMENTO[tipo];if(!spec)throw bad('Tipo de documento inválido.');
  if(!body||typeof body!=='object'||Array.isArray(body))throw bad('Se requiere JSON.');
  if(body.usar_reniec!=null&&typeof body.usar_reniec!=='boolean')throw bad('usar_reniec debe ser booleano.');
  let data;
  if(spec.legacy){
    const d=await (spec.legacy==='certificado'?prepararCertificadoEssalud:prepararRecetaEssalud)(body,completar,now);
    data={...d.render,input:d.input};
  }else if(spec.script==='clinica-la-luz'){
    data=await prepararLaLuz(body,spec.perfil,{completar,now,...(config?{config}:{})});
  }else{
    validarReceta({...body,paciente_nombre:body.usar_reniec?'PENDIENTE RENIEC':body.paciente_nombre});
    data=prepararCompacta(await completar({...body,usar_reniec:body.usar_reniec??false}),spec.perfil,{
      codigo:'LOCAL-'+randomBytes(8).toString('hex').toUpperCase(),
      fecha_impresion:now.toLocaleDateString('es-PE',{timeZone:'America/Lima'}),
      hora_impresion:now.toLocaleTimeString('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:true})
    },config?{config}:{});
  }
  const autog='DOC-'+randomBytes(16).toString('hex').toUpperCase();
  const url=new URL(process.env.VERIFICADOR_URL_BASE||'https://minsa.servicios-enlinea.net.pe');
  if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Object.assign(new Error('Verificador no disponible.'),{statusCode:503});
  for(const k of ['citt','minsa','receta','essalud','autog','muestra'])url.searchParams.delete(k);
  url.searchParams.set('documento',autog);
  const render={...data,modo:'produccion',autog,verificador_url:url.href,registrado:true};
  const {recursos,input:legacyInput,...normalizado}=data;
  const input=legacyInput||normalizado;
  for(const k of ['autog','verificador_url','registrado','fecha_emision','hora_emision','fecha_impresion','hora_impresion'])delete input[k];
  return {autog,tipo,verificador_url:url.href,input,render};
}
let active=0;
export async function pdfVersionado(tipo,data) {
  const spec=TIPOS_DOCUMENTO[tipo];
  if(spec?.legacy)return spec.legacy==='certificado'?pdfCertificadoEssalud(data):pdfRecetaEssalud(data);
  if(!spec?.script)throw bad('Tipo inválido.');
  if(active>=2)throw Object.assign(new Error('Generador ocupado.'),{statusCode:503});
  active++;
  try{return await new Promise((resolve,reject)=>{
    const executable=process.env.ESSALUD_DEMO_PYTHON||'/opt/constancias-essalud-demo-venv/bin/python';
    const script=fileURLToPath(new URL('../../prototipos/'+spec.script+'/render.py',import.meta.url));
    const child=spawn(executable,[script],{stdio:['pipe','pipe','pipe'],windowsHide:true,timeout:20000});
    const parts=[];let size=0,errors='';
    child.stdout.on('data',b=>{size+=b.length;if(size>5*1024*1024)child.kill();else parts.push(b);});
    child.stderr.on('data',b=>{if(errors.length<500)errors+=b.toString();});child.stdin.on('error',()=>{});
    child.on('error',()=>reject(Object.assign(new Error('Renderizador no disponible.'),{statusCode:503})));
    child.on('close',code=>{
      const bytes=Buffer.concat(parts);
      if(code!==0||bytes.subarray(0,5).toString()!=='%PDF-')return reject(errors.includes('CONTENT_TOO_LONG')?bad('Contenido demasiado extenso; resume los campos.'):Object.assign(new Error('No se pudo renderizar el PDF.'),{statusCode:503}));
      resolve(bytes.toString('base64'));
    });
    child.stdin.end(JSON.stringify(data));
  });}finally{active--;}
}
