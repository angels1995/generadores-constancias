import fs from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepararCompacta} from './input.mjs';

const fixture=JSON.parse(await fs.readFile(new URL('../../docs/essalud-receta-payload.json',import.meta.url)));
const now=new Date();
const meta={fecha_impresion:now.toLocaleDateString('es-PE',{timeZone:'America/Lima'}),
  hora_impresion:now.toLocaleTimeString('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:true})};
const python=process.env.ESSALUD_DEMO_PYTHON||'python';
await fs.mkdir(new URL('../../output/pdf/',import.meta.url),{recursive:true});
await fs.mkdir(new URL('../../tmp/pdfs/recetas-compactas/',import.meta.url),{recursive:true});
for(const perfil of ['minsa','essalud']) {
  const body={...fixture,numero_orden:'MUESTRA-0001',paciente_pi:'',autogenerado_paciente:'',acto_medico:'',
    atencion:'CONSULTA EXTERNA',especialidad:'MEDICINA GENERAL',paciente_nacimiento:'2001-02-28',
    farmacia_codigo:null,farmacia_nombre:null,
    aviso_atencion_usuario:'Muestra local sin registro público. No válida como receta.',
    medicamentos:fixture.medicamentos.map(m=>({...m,codigo_producto:'',um_ff:''}))};
  const data=prepararCompacta(body,perfil,{...meta,codigo:'LOCAL-'+randomBytes(8).toString('hex').toUpperCase()});
  const result=spawnSync(python,[fileURLToPath(new URL('./render.py',import.meta.url))],
    {input:JSON.stringify(data),maxBuffer:5*1024*1024,timeout:15000});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(result.stderr.toString());
  await fs.writeFile(new URL(`../../output/pdf/receta-${perfil}-compacta-local.pdf`,import.meta.url),result.stdout);
  // Datos de muestra reproducibles: sin credenciales ni imágenes de firmas.
  await fs.writeFile(new URL(`../../tmp/pdfs/recetas-compactas/${perfil}.json`,import.meta.url),JSON.stringify(data,null,2));
  console.log(perfil+': PDF local generado');
}
