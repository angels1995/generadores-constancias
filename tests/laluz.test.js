import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {prepararLaLuz} from '../prototipos/clinica-la-luz/input.mjs';
const tipos=['certificado','receta','descanso'];
const fixtures=Object.fromEntries(await Promise.all(tipos.map(async tipo=>[tipo,
  JSON.parse(await fs.readFile(new URL(`../docs/laluz-${tipo}-payload.json`,import.meta.url)))])));

test('La Luz: tres perfiles, opcionales null/vacíos, edad al atender y recursos sin firmas',async()=>{
  for(const tipo of tipos)for(const empty of [undefined,null,'','  ']){
    const d=await prepararLaLuz({...fixtures[tipo],medico_nombre:empty,medico_cmp:empty,paciente_sexo:empty},tipo);
    assert.equal(d.medico_nombre,'');assert.equal(d.medico_cmp,'');assert.equal(d.paciente_sexo,'');
    assert.equal(d.paciente_edad,25);assert.equal(d.registrado,false);assert.equal(d.estado,'OPERATIVO');
    assert.match(d.autog,/^LOCAL-[A-F0-9]{16}$/);assert.match(d.historia_interna,/^INT-HC-/);
    assert.ok(d.recursos.logo);
  }
});
test('La Luz: fechas y horas declaradas, sin regla de inicio a las 17:00; no inventa campos clínicos',async()=>{
  const d=await prepararLaLuz({...fixtures.descanso,hora_atencion:'18:00',descanso_hora_inicio:'18:00',descanso_hora_fin:'19:00',presenta:null,procedimiento:null},'descanso');
  assert.equal(d.descanso_inicio,'2026-10-22');assert.equal(d.dias,1);assert.equal(d.presenta,'');assert.equal(d.procedimiento,'');
  for(const override of [{descanso_fin:'2026-10-21'},{descanso_hora_fin:'07:00'},
    {hora_atencion:'25:00'},{fecha_atencion:'2026-02-30'},{paciente_sexo:'INVALIDO'},
    {paciente_edad:200,paciente_nacimiento:null},{paciente_nacimiento:'2026-10-23'}]){
    await assert.rejects(prepararLaLuz({...fixtures.descanso,...override},'descanso'));
  }
});
test('La Luz: RENIEC simulado solo completa identidad y valida tratamiento antes de consultar',async()=>{
  let calls=0;
  const completar=async b=>{calls++;return {...b,paciente_nombre:'IDENTIDAD SIMULADA',paciente_nacimiento:'1990-10-23',paciente_edad:99};};
  const d=await prepararLaLuz({...fixtures.receta,usar_reniec:true,paciente_nombre:null},'receta',{completar});
  assert.equal(calls,1);assert.equal(d.paciente_nombre,'IDENTIDAD SIMULADA');assert.equal(d.paciente_edad,35);
  assert.equal(d.medicamentos[0].dosis,'DOSIS FICTICIA');assert.equal(d.medicamentos[0].atc_codigo,'N02BE01');
  await assert.rejects(prepararLaLuz({...fixtures.receta,usar_reniec:true,
    medicamentos:[{...fixtures.receta.medicamentos[0],dosis:null}]},'receta',{completar}));
  assert.equal(calls,1);
  await assert.rejects(prepararLaLuz({...fixtures.descanso,usar_reniec:true,diagnostico:null},'descanso',{completar}));
  assert.equal(calls,1);
});
test('La Luz: configuración por perfil se consume, texto explícito prevalece, no cambia otros generadores',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'laluz-config-'));
  const config=path.join(dir,'recursos.json');
  const settings=JSON.parse(await fs.readFile(new URL('../config/recursos-pdf.json',import.meta.url)));
  try {
    for(const tipo of tipos){
      settings[`laluz_${tipo}_medico_nombre`]='PROFESIONAL DE PRUEBA';
      settings[`laluz_${tipo}_sede`]='SEDE CONFIGURADA';
      await fs.writeFile(config,JSON.stringify(settings));
      const a=await prepararLaLuz({...fixtures[tipo],sede:null},tipo,{config});
      assert.equal(a.medico_nombre,'PROFESIONAL DE PRUEBA');assert.equal(a.sede,'SEDE CONFIGURADA');
      const b=await prepararLaLuz({...fixtures[tipo],medico_nombre:'VALOR DECLARADO'},tipo,{config});
      assert.equal(b.medico_nombre,'VALOR DECLARADO');
    }
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});
