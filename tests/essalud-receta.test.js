import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import express from 'express';
import {prepararRecetaEssalud,pdfRecetaEssalud} from '../src/lib/essalud-receta.js';
import {crearRouterEssalud} from '../src/routes/essalud-demo.js';
import {leerRecursosEssalud} from '../src/lib/essalud-recursos.js';

const fixture=JSON.parse(await fs.readFile(new URL('../docs/essalud-receta-payload.json',import.meta.url)));
test('receta EsSalud conserva datos declarados y completa identificadores internos ausentes',async()=>{
  const d=await prepararRecetaEssalud({...fixture,paciente_edad:0});
  assert.equal(d.input.estado,'OPERATIVO');assert.equal(d.input.paciente_edad,0);
  for(const key of ['paciente_pi','autogenerado_paciente','acto_medico','documento_id','historia_interna'])assert.match(d.input[key],/^[A-Z0-9]{9}$/);
  assert.equal(d.render.numero_orden,d.autog);assert.equal(d.input.medicamentos[0].um_ff,'');
  assert.equal(d.input.medicamentos[0].atc_codigo,'N02BE01');assert.equal(d.input.medicamentos[0].dosis,'DOSIS FICTICIA');
  const resources=await leerRecursosEssalud(undefined,'receta');assert.ok(resources.logo);
});
test('RENIEC y catálogos no inventan medicamentos ni pautas; validación previa',async()=>{
  const d=await prepararRecetaEssalud({...fixture,usar_reniec:true,paciente_nombre:null},async b=>({...b,paciente_nombre:'IDENTIDAD SIMULADA',paciente_edad:30}));
  assert.equal(d.input.paciente_nombre,'IDENTIDAD SIMULADA');assert.equal(d.input.medicamentos[0].frecuencia,fixture.medicamentos[0].frecuencia);
  let called=false;
  await assert.rejects(prepararRecetaEssalud({...fixture,medicamentos:[{...fixture.medicamentos[0],dosis:null}]},async b=>{called=true;return b;}));
  assert.equal(called,false);
  await assert.rejects(prepararRecetaEssalud({...fixture,medicamentos:Array(31).fill(fixture.medicamentos[0])}));
});
test('HTTP genera PDF EsSalud, registro simulado y respuesta pública sin identidad',async()=>{
  const records=new Map();
  const db={query:async(sql,args)=>{
    if(sql.startsWith('INSERT')){records.set(args[0],{autog:args[0],estado:'OPERATIVO',pdf_sha256:args[1],created_at:'2026-10-22T15:00:00Z'});return {rows:[]};}
    return {rows:records.has(args[0])?[records.get(args[0])]:[]};
  }};
  const app=express();app.use(express.json());app.use(crearRouterEssalud({db,preparar:prepararRecetaEssalud,pdf:pdfRecetaEssalud}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try {
    const base='http://127.0.0.1:'+server.address().port;
    const r=await fetch(base+'/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture)});
    assert.equal(r.status,200);const j=await r.json();assert.equal(j.data.estado,'OPERATIVO');
    const bytes=Buffer.from(j.data.pdf_base64,'base64');assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    const v=await fetch(base+'/verificar/'+j.data.autog);assert.equal(v.status,200);
    const text=await v.text();assert.ok(!text.includes(fixture.paciente_nombre));assert.ok(!text.includes('PARACETAMOL'));
    await fs.mkdir(new URL('../output/pdf/',import.meta.url),{recursive:true});
    await fs.writeFile(new URL('../output/pdf/essalud-receta-local.pdf',import.meta.url),bytes);
    await fs.mkdir(new URL('../tmp/pdfs/essalud-receta/',import.meta.url),{recursive:true});
    await fs.writeFile(new URL('../tmp/pdfs/essalud-receta/meta.json',import.meta.url),JSON.stringify({autog:j.data.autog,verificador_url:j.data.verificador_url}));
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('9 y 30 medicamentos se renderizan completos en PDF sin recortar filas',async()=>{
  await fs.mkdir(new URL('../tmp/pdfs/essalud-receta/',import.meta.url),{recursive:true});
  for(const count of [9,30]){
    const medicamentos=Array.from({length:count},(_,i)=>({...fixture.medicamentos[0],nombre:'PRODUCTO FICTICIO '+(i+1)}));
    const d=await prepararRecetaEssalud({...fixture,medicamentos});
    const bytes=Buffer.from(await pdfRecetaEssalud(d.render),'base64');
    assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    await fs.writeFile(new URL(`../tmp/pdfs/essalud-receta/${count}.pdf`,import.meta.url),bytes);
  }
});
