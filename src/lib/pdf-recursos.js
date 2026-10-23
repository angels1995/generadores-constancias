import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const invalid=()=>Object.assign(new Error('Revisa config/recursos-pdf.json y las imágenes de src/assets/.'),{statusCode:503});

export function leerRecursosPdf(keys,{
  config=fileURLToPath(new URL('../../config/recursos-pdf.json',import.meta.url)),
  root=fileURLToPath(new URL('../assets/',import.meta.url))
}={}) {
  try {
    const settings=JSON.parse(fs.readFileSync(config,'utf8'));
    if(!settings||Array.isArray(settings)||typeof settings!=='object')throw invalid();
    const realRoot=fs.realpathSync(root);
    return Object.fromEntries(keys.map(key=>{
      if(!Object.hasOwn(settings,key))throw invalid();
      const value=settings[key];
      if(value==null||value==='')return [key,null];
      if(typeof value!=='string')throw invalid();
      const target=fs.realpathSync(path.resolve(realRoot,value));
      const relative=path.relative(realRoot,target);
      if(relative.startsWith('..')||path.isAbsolute(relative)||!relative)throw invalid();
      const stat=fs.statSync(target);
      if(!stat.isFile()||stat.size>5*1024*1024)throw invalid();
      const bytes=fs.readFileSync(target);
      const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
      if(!png&&!jpeg)throw invalid();
      return [key,{bytes,mime:png?'image/png':'image/jpeg'}];
    }));
  } catch {throw invalid();}
}
