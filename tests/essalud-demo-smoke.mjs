import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import express from 'express';
import { crearRouterEssalud } from '../src/routes/essalud-demo.js';

const records=new Map();
const db={query:async(sql,args)=>{
  if(sql.startsWith('INSERT')){records.set(args[0],{autog:args[0],estado:'PENDIENTE_FIRMA',pdf_sha256:args[1],created_at:'2026-10-22T15:00:00Z'});return {rows:[]};}
  return {rows:records.has(args[0])?[records.get(args[0])]:[]};
}};
const router=crearRouterEssalud({db});
const app=express();app.use(express.json());app.use('/api/essalud/citt-demo',router);
const server=app.listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}/api/essalud/citt-demo/generar`;
try {
  const payload=JSON.parse(await fs.readFile(new URL('../docs/essalud-citt-demo-payload.json',import.meta.url)));
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  assert.equal(r.status,200);
  const {data,status}=await r.json();assert.equal(status,true);assert.equal(data.estado,'PENDIENTE_FIRMA');
  assert.equal(data.registrado,true);assert.equal(new URL(data.verificador_url).searchParams.get('essalud'),data.autog);
  const pdf=Buffer.from(data.pdf_base64,'base64');assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  await fs.mkdir(new URL('../tmp/pdfs/essalud-api/',import.meta.url),{recursive:true});
  await fs.writeFile(new URL('../tmp/pdfs/essalud-api/api-demo.pdf',import.meta.url),pdf);
  await fs.writeFile(new URL('../tmp/pdfs/essalud-api/api-meta.json',import.meta.url),JSON.stringify({autog:data.autog,verificador_url:data.verificador_url,pdf_sha256:data.pdf_sha256}));
  const check=await fetch(url.replace('/generar','/verificar/'+data.autog));
  assert.equal(check.status,200);
  const registered=await check.json();assert.equal(registered.data.pdf_sha256,data.pdf_sha256);
  assert.ok(!JSON.stringify(registered).includes(payload.paciente_dni));
  assert.deepEqual(Object.keys(registered.data).sort(),['autog','aviso','created_at','estado','pdf_sha256'].sort());
  assert.equal((await fetch(url.replace('/generar','/verificar/ESSALUD-'+'0'.repeat(32)))).status,404);
  const bad=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(bad.status,400);assert.equal((await bad.json()).status,false);
  console.log('OK HTTP: PDF pendiente de firma, QR y registro interno simulado, privacidad y 404.');
} finally { server.closeAllConnections();await new Promise(r=>server.close(r)); }
