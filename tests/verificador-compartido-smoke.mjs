import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const root=path.resolve(process.argv[2] || '../verificador-pages');
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!['index.html','verificador.js','verificador.css','logo_minsa.png','favicon.png'].includes(name)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'image/png');
  res.end(fs.readFileSync(path.join(root,name)));
}).listen(0,'127.0.0.1');
await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox'],
  ...(process.argv[3]?{executablePath:process.argv[3]}:{})});
const code='RECETA-'+'B'.repeat(32);
const legacy={autog:'PRUEBA',paciente_nombre:'PACIENTE FICTICIO',paciente_dni:'00000000',hospital:'DEMO',
  diagnostico:'CASO FICTICIO',descanso_inicio:'2026-10-22',descanso_fin:'2026-10-23',descanso_dias:2,vigente:true,valido_hasta:'2026-10-24'};
let current='receta',status=200,calls=[],documentType='laluz-certificado';
try{
 const page=await browser.newPage();const errores=[];
 page.on('pageerror',err=>errores.push(err.message));
 await page.setRequestInterception(true);
 page.on('request',r=>{
  if(r.url().startsWith(base+'/'))return r.continue();
  if(r.url().startsWith('https://descanso-api.sin-flower.com/api/')){
    calls.push(r.url());
    const body=['essalud','documento'].includes(current)?{status:true,data:{autog:'<img src=x onerror="window.inyectado=1">',tipo:current==='documento'?documentType:undefined,
      estado:'PENDIENTE_FIRMA',created_at:'2026-10-22T13:00:00Z',pdf_sha256:'a'.repeat(64)}}:current==='receta'?{status:true,data:{autog:'<img src=x onerror="window.inyectado=1">',
      created_at:'2026-10-22T13:00:00Z',valido_hasta:'2026-10-23',dentro_del_plazo_declarado:true,medicamentos_total:9}}:legacy;
    return r.respond({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
  }
  r.abort();
 });
 for(const [tipo,param] of [['citt','PRUEBA'],['minsa','PRUEBA'],['receta',code],['essalud','ESSALUD-'+'A'.repeat(32)],['documento','DOC-'+'A'.repeat(32)]]){
   current=tipo;status=200;calls=[];
   await page.goto(`${base}/?${tipo}=${param}`);
   await page.waitForSelector('#results-container:not(.hidden)');
   assert.equal(calls.length,1);assert.ok(calls[0].includes(`/api/${tipo==='essalud'?'essalud/citt-demo':tipo==='documento'?'documentos':tipo}/verificar/`));
   const text=await page.$eval('#results-container',el=>el.textContent);
   if(['essalud','documento'].includes(tipo)){
     assert.ok(text.includes('Registro verificado en el sistema'));assert.ok(text.includes('SHA-256'));
     assert.equal(await page.$$eval('#essalud-details .label',els=>els.filter(el=>el.textContent==='Estado').length),0);
     assert.ok(text.includes('<img src=x'));assert.equal(await page.evaluate(()=>window.inyectado),undefined);
     assert.ok(!text.includes('Válida y Auténtica'));
     assert.equal(await page.$eval('#logo-img',el=>getComputedStyle(el).display),'none');
     assert.ok(!(await page.$eval('.main-footer',el=>el.textContent)).includes('Ministerio'));
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }else if(tipo==='receta'){
     assert.ok(text.includes('Registro verificado en el sistema'));assert.ok(!text.includes('BORRADOR'));assert.ok(text.includes('Medicamentos registrados'));
     assert.ok(text.includes('<img src=x'));assert.equal(await page.evaluate(()=>window.inyectado),undefined);
     assert.ok(!text.includes('Válida y Auténtica'));assert.ok(!text.includes('Paciente'));
     await page.setViewport({width:390,height:844});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }else assert.ok(text.includes('PACIENTE FICTICIO'));
 }
 current='documento';
 for(const [tipo,nombre] of [['receta-minsa-v2','Receta médica'],['receta-essalud-v1','Receta médica'],['receta-essalud-v2','Receta médica'],['certificado-essalud','Certificado médico'],['laluz-certificado','Certificado médico'],['laluz-receta','Receta médica'],['laluz-descanso','Constancia de descanso médico'],['__proto__','Documento médico']]){
   documentType=tipo;
   await page.goto(`${base}/?documento=DOC-${'A'.repeat(32)}`);await page.waitForSelector('#essalud-details');
   const label=await page.$$eval('#essalud-details .detail-item',els=>els.find(el=>el.querySelector('.label')?.textContent==='Tipo de documento')?.querySelector('.value')?.textContent);
   assert.equal(label,nombre);
 }
 current='essalud';status=404;
 await page.goto(`${base}/?essalud=ESSALUD-${'A'.repeat(32)}`);await page.waitForSelector('#results-container:not(.hidden)');
 assert.ok((await page.$eval('#results-container',el=>el.textContent)).includes('no encontrado'));
 calls=[];
 await page.goto(`${base}/?essalud=%3Cscript%3E`);await page.waitForFunction(()=>document.getElementById('form-error').textContent.includes('no es válido'));
 assert.equal(calls.length,0);
 current='receta';status=404;
 await page.goto(`${base}/?receta=${code}`);await page.waitForSelector('#results-container:not(.hidden)');
 assert.ok((await page.$eval('#results-container',el=>el.textContent)).includes('no encontrado'));
 await page.click('#newSearchBtn');await page.type('#autog-input',code);status=200;
 await page.click('#verify-button');await page.waitForSelector('#receta-details');
 assert.ok((await page.$eval('#results-container',el=>el.textContent)).includes('Registro verificado en el sistema'));
 calls=[];
 await page.goto(`${base}/?receta=%3Cscript%3E`);await page.waitForFunction(()=>document.getElementById('form-error').textContent.includes('no es válido'));
 assert.equal(calls.length,0);assert.deepEqual(errores,[]);
 console.log('Verificador compartido: CITT/MINSA/receta compatibles; EsSalud pendiente, privacidad, 404, código inválido, XSS y móvil correctos. APIs simuladas.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
