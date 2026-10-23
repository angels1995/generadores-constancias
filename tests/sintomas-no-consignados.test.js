import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { pool } from '../src/lib/db.js';
import { generarMinsa } from '../src/generadores/minsa.js';
import { generarCitt } from '../src/generadores/citt.js';
import { cerrarBrowser } from '../src/lib/pdf.js';
let html='',inserts=0;
const query=pool.query,launch=puppeteer.launch;
pool.query=async()=>{inserts++;return {rows:[]};};
puppeteer.launch=async()=>({once:()=>{},isConnected:()=>true,newPage:async()=>({setContent:async h=>{html=h;},pdf:async()=>Buffer.from('PDF SIMULADO'),close:async()=>{}}),close:async()=>{}});
const base={hospital:'ESTABLECIMIENTO DEMO',paciente_nombre:'PACIENTE DEMO',paciente_dni:'00000001',paciente_nacimiento:'1990-01-01',
 fecha_atencion:'2026-10-22',hora_atencion:'08:00',descanso_fin:'2026-10-24',diagnostico:'DIAGNÓSTICO DEMO',sintomas:[]};
after(async()=>{await cerrarBrowser();pool.query=query;puppeteer.launch=launch;await pool.end();});
test('No consignados es explícito y tiene acuse del generador; no equivale a ausencia de síntomas',async()=>{
 for(const generar of [generarMinsa,generarCitt]){
  const r=await generar({...base,sintomas_no_consignados:true});
  assert.equal(r.input.sintomas_estado,'NO_CONSIGNADOS');
  assert.ok(/no (?:se )?consign(?:an|ados)/i.test(html));
  assert.ok(!html.includes('SINTOMATOLOGÍA DIVERSA'));
  assert.ok(!html.includes('SE DETERMINÓ QUE LOS SINTOMAS'));
 }
});
test('Payloads anteriores mantienen el texto y no reciben el nuevo estado',async()=>{
 for(const flag of [undefined,null,false]){
  const r=await generarMinsa({...base,...(flag===undefined?{}:{sintomas_no_consignados:flag})});
  assert.ok(html.includes('SINTOMATOLOGÍA DIVERSA'));
  assert.ok(html.includes('SE DETERMINÓ QUE LOS SINTOMAS'));
  assert.ok(!('sintomas_estado' in r.input));
 }
});
test('Tipos inválidos o estado contradictorio se rechazan antes de BD/PDF',async()=>{
 const previo=inserts;
 for(const generar of [generarMinsa,generarCitt]){
  await assert.rejects(()=>generar({...base,sintomas_no_consignados:'true'}));
  await assert.rejects(()=>generar({...base,sintomas_no_consignados:true,sintomas:['SÍNTOMA DEMO']}));
 }
 assert.equal(inserts,previo);
});
