import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { recetaDemo, medicamentoDemo } from './receta-fixture.mjs';
delete process.env.DATABASE_URL;
const { pool } = await import('../src/lib/db.js');
const { generarReceta } = await import('../src/generadores/receta.js');
const { cerrarBrowserReceta } = await import('../src/lib/receta-pdf.js');
fs.mkdirSync('tmp/pdfs/receta-qa', {recursive:true});
fs.mkdirSync('output/pdf', {recursive:true});
let inserts = 0, current, layouts = [];
pool.query = async () => { inserts++; return {rows:[]}; };
globalThis.fetch = async () => { throw Error('Red externa bloqueada'); };
const launch = puppeteer.launch.bind(puppeteer);
puppeteer.launch = async options => {
  const browser = await launch({...options,...(process.argv[2]?{executablePath:process.argv[2]}:{})});
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async () => {
    const page = await newPage();
    const evaluate=page.evaluate.bind(page);
    page.evaluate=async (...args)=>{
      try{return await evaluate(...args);}catch(err){
        console.error(JSON.stringify(await evaluate(()=>[...document.querySelectorAll('.page')].map(p=>({
          scroll:p.scrollHeight,sections:[...p.querySelectorAll('.col:first-child > *,footer')].map(el=>({
            name:el.className||el.tagName,height:el.getBoundingClientRect().height
          }))})))));
        throw err;
      }
    };
    const pdf = page.pdf.bind(page);
    page.pdf = async options => {
      const layout = await page.evaluate(() => [...document.querySelectorAll('.page')].map(p => {
        const footer = p.querySelector('footer').getBoundingClientRect();
        const columns = [...p.querySelectorAll('.col')];
        return {page:p.getBoundingClientRect().height, scroll:p.scrollHeight,
          footerBottom:footer.bottom-p.getBoundingClientRect().top,
          rowCounts:columns.map(c=>c.querySelectorAll('tbody tr').length),
          dates:columns.map(c=>c.querySelector('.dates').getBoundingClientRect().bottom<=footer.top),
          tableTops:columns.map(c=>c.querySelector('table').getBoundingClientRect().top),
          images:[...p.querySelectorAll('img')].every(im=>im.complete && im.naturalWidth>0),
          logos:p.querySelectorAll('.logo').length,
          firmas:p.querySelectorAll('.firma-sello-image').length,
          sellos:p.querySelectorAll('.seal').length};
      }));
      for (const r of layout) {
        assert.ok(r.scroll<=1123, JSON.stringify(r)); assert.ok(r.footerBottom<=1096,JSON.stringify(r));
        assert.ok(r.dates.every(Boolean),JSON.stringify(r)); assert.ok(r.images);
        assert.equal(r.logos,2);assert.equal(r.firmas,2);assert.equal(r.sellos,0);
        assert.equal(r.rowCounts[0],r.rowCounts[1]); assert.ok(r.tableTops[0]>r.tableTops[1]);
      }
      assert.ok(layout.length>=Math.ceil(current.count/5));
      assert.equal(layout.reduce((s,p)=>s+p.rowCounts[0],0),current.count);
      if(current.name==='nueve') assert.equal(layout.length,2);
      layouts.push({scenario:current.name,layout});
      await page.setViewport({width:794,height:1123});
      await page.screenshot({path:`tmp/pdfs/receta-qa/${current.name}.png`,fullPage:true});
      return pdf(options);
    };
    return page;
  };
  return browser;
};
try {
  for (const c of [{name:'uno',count:1},{name:'nueve',count:9},{name:'treinta-extensos',count:30}]) {
    current=c;
    const largo=c.count===30;
    const result=await generarReceta({...recetaDemo,
      ...(largo?{hospital:'ESTABLECIMIENTO '.repeat(6),paciente_nombre:'PACIENTE '.repeat(10),diagnostico:'DIAGNÓSTICO DEMOSTRATIVO '.repeat(8),
        medico_nombre:'PROFESIONAL '.repeat(8),especialidad:'ESPECIALIDAD '.repeat(4),usuario:'USUARIO '.repeat(8)}:{}),
      medicamentos:Array.from({length:c.count},()=>({...medicamentoDemo,indicaciones:'',frecuencia:'PRUEBA',...(largo?{
        nombre:'MEDICAMENTO FICTICIO EXTENSO PARA VERIFICAR LA DISTRIBUCIÓN',concentracion:'CONCENTRACIÓN DE PRUEBA',forma:'FORMA FARMACÉUTICA DE PRUEBA',
        dosis:'DOSIS FICTICIA PARA REVISAR TEXTO LARGO EN TABLA',via:'VÍA FICTICIA DE PRUEBA',frecuencia:'FRECUENCIA FICTICIA DE PRUEBA',
        indicaciones:'INDICACIONES FICTICIAS EXTENSAS PARA PRUEBAS DE LA PAGINACIÓN. NO SON UN TRATAMIENTO MÉDICO.'}:{} )}))});
    fs.writeFileSync(`tmp/pdfs/receta-qa/${c.name}.pdf`,Buffer.from(result.pdf_base64,'base64'));
    if(c.name==='nueve') fs.writeFileSync('output/pdf/receta-demostracion-local.pdf',Buffer.from(result.pdf_base64,'base64'));
  }
  assert.equal(inserts,3);
  console.log(JSON.stringify({insertsSimulados:inserts,layouts},null,2));
} finally {await cerrarBrowserReceta();await pool.end();}
