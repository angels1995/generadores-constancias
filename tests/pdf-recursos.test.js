import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leerRecursosPdf} from '../src/lib/pdf-recursos.js';
test('el archivo global conserva los recursos anteriores y deja vacías las imágenes nuevas de EsSalud',()=>{
  const keys=['citt_logo','citt_firma','citt_sello','minsa_logo','minsa_firma','minsa_sello','receta_minsa_logo','receta_minsa_firma_sello','essalud_citt_logo','essalud_citt_firma','essalud_citt_sello','essalud_certificado_logo','essalud_certificado_firma','essalud_certificado_sello','essalud_receta_logo','essalud_receta_firma','essalud_receta_sello'];
  const resources=leerRecursosPdf(keys);
  const config=JSON.parse(fs.readFileSync(new URL('../config/recursos-pdf.json',import.meta.url),'utf8'));
  for(const key of keys){
    if(config[key])assert.ok(resources[key].bytes.equals(fs.readFileSync(new URL('../src/assets/'+config[key],import.meta.url))));
    else assert.equal(resources[key],null);
  }
});
