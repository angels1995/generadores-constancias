import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepararLaLuz} from './input.mjs';

const python=process.env.ESSALUD_DEMO_PYTHON||'python';
await fs.mkdir(new URL('../../output/pdf/',import.meta.url),{recursive:true});
await fs.mkdir(new URL('../../tmp/pdfs/clinica-la-luz/',import.meta.url),{recursive:true});
for(const tipo of ['certificado','receta','descanso']) {
  const body=JSON.parse(await fs.readFile(new URL(`../../docs/laluz-${tipo}-payload.json`,import.meta.url)));
  const data=await prepararLaLuz(body,tipo);
  const result=spawnSync(python,[fileURLToPath(new URL('./render.py',import.meta.url))],
    {input:JSON.stringify(data),timeout:15000,maxBuffer:5*1024*1024,windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(result.stderr.toString());
  if(result.stdout.subarray(0,5).toString()!=='%PDF-')throw new Error('PDF inválido.');
  await fs.writeFile(new URL(`../../output/pdf/laluz-${tipo}-local.pdf`,import.meta.url),result.stdout);
  await fs.writeFile(new URL(`../../tmp/pdfs/clinica-la-luz/${tipo}.json`,import.meta.url),JSON.stringify(data,null,2));
  console.log(tipo+': muestra local generada');
}
