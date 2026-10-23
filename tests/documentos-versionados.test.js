import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import express from 'express';
import {createHash} from 'node:crypto';
import {prepararVersionado,pdfVersionado,TIPOS_DOCUMENTO} from '../src/lib/documentos-versionados.js';
import {crearRouterDocumentos} from '../src/routes/documentos.js';
const fixture=async name=>JSON.parse(await fs.readFile(new URL('../docs/'+name,import.meta.url)));
const recipes=await fixture('essalud-receta-payload.json');
const payloads={
  'receta-minsa-v2':recipes,'receta-essalud-v2':recipes,'receta-essalud-v1':recipes,
  'certificado-essalud':await fixture('essalud-certificado-payload.json'),
  'laluz-certificado':await fixture('laluz-certificado-payload.json'),
  'laluz-receta':await fixture('laluz-receta-payload.json'),
  'laluz-descanso':await fixture('laluz-descanso-payload.json')
};
test('siete tipos: código opaco y enlace compartido coherente, sin recursos en input',async()=>{
  for(const tipo of Object.keys(TIPOS_DOCUMENTO)){
    const d=await prepararVersionado(tipo,payloads[tipo]);
    assert.match(d.autog,/^DOC-[A-F0-9]{32}$/);assert.equal(new URL(d.verificador_url).searchParams.get('documento'),d.autog);
    assert.equal(d.render.autog,d.autog);assert.equal(d.render.verificador_url,d.verificador_url);
    assert.equal(d.render.modo,'produccion');assert.ok(!Object.hasOwn(d.input,'recursos'));
  }
});
test('HTTP con PDF real y BD simulada, siete rutas y verificación sin identidad; fallo de BD no entrega PDF',async()=>{
  const records=new Map();let fail=false;
  const db={query:async(sql,a)=>{
    if(fail)throw Error('Fallo privado de BD');
    if(sql.startsWith('INSERT')){records.set(a[0],{autog:a[0],tipo:a[1],pdf_sha256:a[2],estado:'PENDIENTE_FIRMA',created_at:'2026-10-22T12:00:00Z'});return {rows:[]};}
    return {rows:records.has(a[0])?[records.get(a[0])]:[]};
  }};
  const app=express();app.use(express.json());app.use(crearRouterDocumentos({db}));
  const s=app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));
  const base='http://127.0.0.1:'+s.address().port;
  await fs.mkdir(new URL('../tmp/pdfs/versionados/',import.meta.url),{recursive:true});
  try{
    for(const tipo of Object.keys(TIPOS_DOCUMENTO)){
      const r=await fetch(base+'/'+tipo+'/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloads[tipo])});
      assert.equal(r.status,200,tipo);const {data:d}=await r.json();
      const bytes=Buffer.from(d.pdf_base64,'base64');assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
      assert.equal(createHash('sha256').update(bytes).digest('hex'),d.pdf_sha256);
      assert.equal(d.estado,'PENDIENTE_FIRMA');
      const v=await fetch(base+'/verificar/'+d.autog);assert.equal(v.status,200);const {data:publicData}=await v.json();
      assert.deepEqual(Object.keys(publicData).sort(),['autog','tipo','estado','pdf_sha256','created_at','aviso'].sort());
      await fs.writeFile(new URL('../tmp/pdfs/versionados/'+tipo+'.pdf',import.meta.url),bytes);
    }
    fail=true;
    const blocked=await fetch(base+'/laluz-receta/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payloads['laluz-receta'])});
    assert.equal(blocked.status,503);assert.ok(!(await blocked.text()).includes('pdf_base64'));
    assert.equal((await fetch(base+'/verificar/NO_VALIDO')).status,404);
    assert.equal((await fetch(base+'/verificar/DOC-'+'A'.repeat(32))).status,503);
    assert.equal((await fetch(base+'/no-existe/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,404);
  }finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});
