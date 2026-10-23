import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import express from 'express';
import {prepararCertificadoEssalud,pdfCertificadoEssalud} from '../src/lib/essalud-certificado.js';
import {crearRouterEssalud} from '../src/routes/essalud-demo.js';
import {leerRecursosEssalud} from '../src/lib/essalud-recursos.js';

const fixture=JSON.parse(await fs.readFile(new URL('../docs/essalud-certificado-payload.json',import.meta.url)));
test('certificado deja médico y recursos vacíos y conserva edad cero',async()=>{
  const d=await prepararCertificadoEssalud({...fixture,paciente_edad:0},async b=>b,new Date('2026-10-23T01:00:00Z'));
  assert.equal(d.render.edad,0);assert.equal(d.render.medico,'');assert.equal(d.render.especialidad,'');
  assert.equal(d.render.cmp,'');assert.equal(d.render.rne,'');assert.equal(d.render.emision,'22/10/2026');
  const assets=await leerRecursosEssalud(undefined,'certificado');
  assert.ok(assets.logo); // Imágenes opcionales dependen de la configuración del usuario.
  assert.equal(new URL(d.verificador_url).searchParams.get('essalud'),d.autog);
});
test('usa período declarado, sin desplazarlo automáticamente a las 17:00',async()=>{
  const d=await prepararCertificadoEssalud({...fixture,hora_atencion:'17:30',descanso_inicio:null,descanso_hora_inicio:null,descanso_hora_fin:'18:00'});
  assert.equal(d.inicio,'2026-10-22');assert.equal(d.dias,1);assert.equal(d.render.hora_inicio,'05:30 PM');
  await assert.rejects(prepararCertificadoEssalud({...fixture,descanso_hora_fin:'07:00'}),/hora final/);
  await assert.rejects(prepararCertificadoEssalud({...fixture,fecha_atencion:'2026-02-30'}),/fecha válida/);
  await assert.rejects(prepararCertificadoEssalud({...fixture,descanso_fin:'2026-10-21'}),/entre 1/);
});
test('RENIEC opcional usa identidad simulada y nunca completa datos clínicos',async()=>{
  const d=await prepararCertificadoEssalud({...fixture,usar_reniec:true,paciente_nombre:null,paciente_edad:null},async b=>{
    assert.equal(b.usar_reniec,true);return {...b,paciente_nombre:'IDENTIDAD SIMULADA',paciente_edad:30};
  });
  assert.equal(d.render.paciente,'IDENTIDAD SIMULADA');assert.equal(d.render.edad,30);
  assert.equal(d.render.diagnostico,fixture.diagnostico);assert.equal(d.render.recomendaciones,fixture.recomendaciones);
  let called=false;
  await assert.rejects(prepararCertificadoEssalud({...fixture,paciente_dni:'123'},async b=>{called=true;return b;}));
  assert.equal(called,false);
});
test('texto clínico vacío o excesivo no se inventa ni se recorta',async()=>{
  const d=await prepararCertificadoEssalud({...fixture,recomendaciones:null,lema:null,distrito_expedicion:null});
  assert.equal(d.render.recomendaciones,'');assert.equal(d.render.lema,'');assert.equal(d.render.distrito,'');
  await assert.rejects(prepararCertificadoEssalud({...fixture,diagnostico:null}),/diagnostico/);
  await assert.rejects(prepararCertificadoEssalud({...fixture,recomendaciones:'X'.repeat(1001)}),/1000/);
});
test('HTTP genera certificado PDF real con registro simulado y no publica identidad',async()=>{
  const records=new Map();
  const db={query:async(sql,args)=>{
    if(sql.startsWith('INSERT')){records.set(args[0],{autog:args[0],estado:'PENDIENTE_FIRMA',pdf_sha256:args[1],created_at:'2026-10-22T15:00:00Z'});return {rows:[]};}
    return {rows:records.has(args[0])?[records.get(args[0])]:[]};
  }};
  const app=express();app.use(express.json());
  app.use('/api/essalud/certificado',crearRouterEssalud({db,preparar:prepararCertificadoEssalud,pdf:pdfCertificadoEssalud}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try {
    const base='http://127.0.0.1:'+server.address().port+'/api/essalud/certificado';
    const r=await fetch(base+'/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture)});
    assert.equal(r.status,200);const j=await r.json();assert.equal(j.data.estado,'PENDIENTE_FIRMA');
    const bytes=Buffer.from(j.data.pdf_base64,'base64');assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    const check=await fetch(base+'/verificar/'+j.data.autog);assert.equal(check.status,200);
    const text=await check.text();assert.ok(!text.includes(fixture.paciente_nombre));assert.ok(!text.includes(fixture.paciente_dni));
    await fs.mkdir(new URL('../output/pdf/',import.meta.url),{recursive:true});
    await fs.writeFile(new URL('../output/pdf/essalud-certificado-local.pdf',import.meta.url),bytes);
    await fs.mkdir(new URL('../tmp/pdfs/essalud-certificado/',import.meta.url),{recursive:true});
    await fs.writeFile(new URL('../tmp/pdfs/essalud-certificado/meta.json',import.meta.url),JSON.stringify({autog:j.data.autog,verificador_url:j.data.verificador_url}));
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
});
