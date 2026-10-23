import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { leerRecursosEssalud } from '../src/lib/essalud-recursos.js';

test('recursos vacíos por defecto; rutas propias y rechazo de accesos fuera de la carpeta',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'essalud-recursos-'));
  const root=path.join(dir,'images');await fs.mkdir(root);
  const config=path.join(dir,'assets.json');
  const bytes=await fs.readFile(new URL('../src/essalud-demo/assets/logo.png',import.meta.url));
  try {
    const settings=(firma=null)=>({essalud_citt_logo:null,essalud_citt_firma:firma,essalud_citt_sello:null});
    await fs.writeFile(config,JSON.stringify(settings()));
    assert.deepEqual(await leerRecursosEssalud({config,root}),{logo:null,firma:null,sello:null});
    await fs.writeFile(path.join(root,'propia.png'),bytes);
    await fs.writeFile(config,JSON.stringify(settings('propia.png')));
    const data=await leerRecursosEssalud({config,root});
    assert.equal(data.firma,bytes.toString('base64'));assert.equal(data.sello,null);
    await fs.writeFile(path.join(dir,'externo.png'),bytes);
    await fs.writeFile(config,JSON.stringify(settings('../externo.png')));
    await assert.rejects(leerRecursosEssalud({config,root}),/config/);
    await fs.writeFile(config,JSON.stringify(settings('inexistente.png')));
    await assert.rejects(leerRecursosEssalud({config,root}),/config/);
    await fs.writeFile(config,JSON.stringify(settings(123)));
    await assert.rejects(leerRecursosEssalud({config,root}),/config/);
  } finally {
    assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('essalud-recursos-'));
    await fs.rm(dir,{recursive:true,force:true});
  }
});
