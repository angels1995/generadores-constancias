import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararEssaludDemo, pdfEssaludDemo } from '../src/lib/essalud-demo.js';

export const fixture = {
  usar_reniec:false,paciente_dni:'00000000',paciente_nombre:'PACIENTE FICTICIO DE DEMOSTRACIÓN',paciente_edad:25,
  hospital:'ESTABLECIMIENTO FICTICIO',fecha_atencion:'2026-10-22',hora_atencion:'08:00',
  descanso_fin:'2026-10-22',descanso_hora_fin:'18:00',diagnostico:'CASO FICTICIO PARA REVISIÓN DEL DISEÑO',
  observaciones:'DATOS FICTICIOS. NO ACREDITA ATENCIÓN NI DESCANSO MÉDICO.',
  servicio:'TRAUMATOLOGÍA',seguro:null,contingencia:null,medico_nombre:null,fecha_probable_parto:null
};
test('opciones vacías, acumulados y datos declarados',async()=>{
  const d=await prepararEssaludDemo(fixture);
  assert.equal(d.dias,1);assert.equal(d.input.seguro,'OTRO');assert.equal(d.render.parto,'');
  assert.equal(d.input.dias_acumulados_consecutivos,'');assert.equal(d.input.dias_acumulados_no_consecutivos,'');
  assert.equal(d.render.medico,'');assert.match(d.autog,/^ESSALUD-[A-F0-9]{32}$/);
  assert.equal(new URL(d.verificador_url).searchParams.get('essalud'),d.autog);
});
test('atiende regla de las 17:00 y rechaza período vacío',async()=>{
  const d=await prepararEssaludDemo({...fixture,hora_atencion:'17:00',descanso_fin:'2026-10-23'});
  assert.equal(d.inicio,'2026-10-23');assert.equal(d.dias,1);
  await assert.rejects(prepararEssaludDemo({...fixture,hora_atencion:'17:00'}),/período/);
});
test('valida fechas reales, horas y DNI antes de RENIEC',async()=>{
  let called=false;
  for(const extra of [{fecha_atencion:'2026-02-30'},{hora_atencion:'24:00'},{paciente_dni:'1'},{contingencia:'INVALIDA'},{observaciones:'a'.repeat(601)}]) {
    await assert.rejects(prepararEssaludDemo({...fixture,...extra,usar_reniec:true},async b=>{called=true;return b;}));
  }
  assert.equal(called,false);
});
test('RENIEC reemplaza la identidad sin completar datos clínicos',async()=>{
  const d=await prepararEssaludDemo({...fixture,usar_reniec:true,paciente_nombre:null,paciente_edad:null},async b=>{
    assert.equal(b.usar_reniec,true);return {...b,paciente_nombre:'IDENTIDAD SIMULADA',paciente_edad:30};
  });
  assert.equal(d.render.paciente,'IDENTIDAD SIMULADA');assert.equal(d.render.diagnostico,fixture.diagnostico);
});
test('emisión en Lima y edad cero conservada',async()=>{
  const d=await prepararEssaludDemo({...fixture,paciente_edad:0},async b=>b,new Date('2026-10-23T01:05:00Z'));
  assert.equal(d.render.edad,0);assert.equal(d.render.emision,'22/10/2026');assert.equal(d.render.hora_emision,'08:05 PM');
});
test('genera PDF real con el proceso aislado',async()=>{
  const d=await prepararEssaludDemo(fixture);
  const pdf=await pdfEssaludDemo(d.render);
  assert.equal(Buffer.from(pdf,'base64').subarray(0,5).toString(),'%PDF-');
});
