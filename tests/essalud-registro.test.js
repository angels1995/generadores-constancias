import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {crearRouterEssalud} from '../src/routes/essalud-demo.js';

async function serverWith(deps,run) {
  const app=express();app.use(express.json());app.use(crearRouterEssalud(deps));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try{await run('http://127.0.0.1:'+server.address().port);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}
test('si falla el registro no entrega un PDF con enlace inexistente ni filtra errores SQL',async()=>{
  await serverWith({preparar:async()=>({render:{},autog:'ESSALUD-'+'A'.repeat(32)}),pdf:async()=>Buffer.from('%PDF-test').toString('base64'),db:{query:async()=>{throw Error('secreto SQL');}}},async base=>{
    const r=await fetch(base+'/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(r.status,503);const j=await r.json();assert.equal(j.data,null);assert.ok(!JSON.stringify(j).includes('secreto'));
  });
});
test('verificador público no consulta códigos inválidos y responde 503 si falla BD',async()=>{
  let queries=0;
  await serverWith({db:{query:async()=>{queries++;throw Error('secreto');}}},async base=>{
    assert.equal((await fetch(base+'/verificar/INVALIDO')).status,404);assert.equal(queries,0);
    const r=await fetch(base+'/verificar/ESSALUD-'+'A'.repeat(32));assert.equal(r.status,503);
    assert.ok(!(await r.text()).includes('secreto'));
  });
});
