import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {prepararCompacta,edadCalendario} from '../prototipos/recetas-compactas/input.mjs';
import os from 'node:os';
import path from 'node:path';
const fixture=JSON.parse(await fs.readFile(new URL('../docs/essalud-receta-payload.json',import.meta.url)));
const meta={codigo:'LOCAL-0123456789ABCDEF',fecha_impresion:'22/10/2026',hora_impresion:'10:00'};

test('candidato compacto acepta payload previo y campos opcionales null/vacíos sin cambiar ATC',()=>{
  for(const perfil of ['minsa','essalud'])for(const empty of [undefined,null,'','  ']){
    const data=prepararCompacta({...fixture,farmacia_codigo:empty,farmacia_nombre:empty,
      medicamentos:[{...fixture.medicamentos[0],codigo_producto:empty,um_ff:empty}]},perfil,meta);
    assert.equal(data.farmacia_codigo,'15856189');assert.equal(data.farmacia_nombre,'FARMACIA PRINCIPAL');
    assert.equal(data.medicamentos[0].codigo_producto,'');
    assert.equal(data.medicamentos[0].atc_codigo,'N02BE01');
    assert.ok(data.recursos.logo);
  }
});
test('código de producto explícito independiente de ATC; no deduce farmacia ni identidad',()=>{
  const data=prepararCompacta({...fixture,medicamentos:[{...fixture.medicamentos[0],codigo_producto:'213700'}]},'minsa',meta);
  assert.equal(data.medicamentos[0].codigo_producto,'213700');assert.equal(data.medicamentos[0].atc_codigo,'N02BE01');
  assert.match(data.autogenerado_paciente,/^INT-A-[A-F0-9]{12}$/);assert.equal(data.edad_detallada,'');
  assert.throws(()=>prepararCompacta({...fixture,farmacia_nombre:123},'minsa',meta));
  assert.throws(()=>prepararCompacta(fixture,'otro',meta));
  assert.throws(()=>prepararCompacta(fixture,'minsa',{...meta,codigo:'CODIGO-PRODUCCION'}));
});

test('edad calendario desde nacimiento: cumpleaños, meses cortos y año bisiesto',()=>{
  assert.equal(edadCalendario('2001-02-28','2026-10-22'),'25 años 7 meses 24 días');
  assert.equal(edadCalendario('2000-10-23','2026-10-22'),'25 años 11 meses 29 días');
  assert.equal(edadCalendario('2000-10-22','2026-10-22'),'26 años 0 meses 0 días');
  assert.equal(edadCalendario('2024-02-29','2025-02-28'),'1 años 0 meses 0 días');
  assert.equal(edadCalendario('2024-01-31','2024-03-01'),'0 años 1 meses 1 días');
  const data=prepararCompacta({...fixture,paciente_nacimiento:'2001-02-28',edad_detallada:'EDAD MANUAL'},'minsa',meta);
  assert.equal(data.edad_detallada,'25 años 7 meses 24 días');
});

test('identidad interna estable entre perfiles, acto distinto por documento y valores declarados preservados',()=>{
  const a=prepararCompacta(fixture,'minsa',meta),b=prepararCompacta(fixture,'essalud',meta);
  assert.equal(a.autogenerado_paciente,b.autogenerado_paciente);
  assert.equal(a.historia_interna,b.historia_interna);assert.match(a.historia_interna,/^INT-HC-[A-F0-9]{12}$/);
  assert.notEqual(a.acto_medico,b.acto_medico);assert.match(a.acto_medico,/^INT-AM-[A-F0-9]{10}$/);
  const c=prepararCompacta({...fixture,autogenerado_paciente:'INTERNO-1',acto_medico:'INTERNO-2',historia_interna:'INTERNO-3'},'minsa',meta);
  assert.equal(c.autogenerado_paciente,'INTERNO-1');assert.equal(c.acto_medico,'INTERNO-2');assert.equal(c.historia_interna,'INTERNO-3');
});

test('médico por perfil desde configuración global, payload explícito prevalece y tipos se validan',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'recetas-config-'));
  const config=path.join(dir,'recursos.json');
  const settings=JSON.parse(await fs.readFile(new URL('../config/recursos-pdf.json',import.meta.url)));
  try{
    for(const perfil of ['minsa','essalud']){
      const prefix=perfil==='minsa'?'receta_minsa_compacta':'essalud_receta_compacta';
      settings[prefix+'_medico_nombre']='PROFESIONAL DE PRUEBA';settings[prefix+'_medico_cmp']='';
      await fs.writeFile(config,JSON.stringify(settings));
      const a=prepararCompacta(fixture,perfil,meta,{config});assert.equal(a.medico_nombre,'PROFESIONAL DE PRUEBA');
      const b=prepararCompacta({...fixture,medico_nombre:'VALOR DECLARADO'},perfil,meta,{config});
      assert.equal(b.medico_nombre,'VALOR DECLARADO');
      settings[prefix+'_medico_nombre']=123;await fs.writeFile(config,JSON.stringify(settings));
      assert.throws(()=>prepararCompacta(fixture,perfil,meta,{config}));settings[prefix+'_medico_nombre']='';
    }
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
