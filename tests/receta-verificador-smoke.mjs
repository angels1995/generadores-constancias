import assert from 'node:assert/strict';
import { once } from 'node:events';
import puppeteer from 'puppeteer';
delete process.env.DATABASE_URL;
const { app } = await import('../src/app.js');
const { pool } = await import('../src/lib/db.js');
const code = 'RECETA-'+'A'.repeat(32);
let mode = 'ok', llamadas = 0;
pool.query = async () => {
  llamadas++;
  if(mode==='error') throw Error('FALLO FICTICIO');
  return {rows:mode==='missing'?[]:[{autog:code,valido_hasta:'2026-10-23',created_at:'2026-10-22T13:00:00Z',medicamentos_total:9}]};
};
const server=app.listen(0,'127.0.0.1'); await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox'],
  ...(process.argv[2]?{executablePath:process.argv[2]}:{})});
try {
  const page=await browser.newPage();
  let external=0;const errores=[];
  page.on('pageerror',e=>errores.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',r=>{if(r.url().startsWith(base+'/'))r.continue();else{external++;r.abort();}});
  for(const [m,text] of [['ok','Registro encontrado.'],['missing','Registro no encontrado.'],['error','No se pudo consultar']]) {
    mode=m;
    await page.goto(`${base}/receta/verificar?codigo=${code}`);
    await page.waitForFunction(()=>!document.querySelector('#estado').textContent.includes('Consultando'));
    assert.ok((await page.$eval('#estado',el=>el.textContent)).includes(text));
    if(m==='ok') {
      assert.equal(await page.$eval('#codigo',el=>el.textContent),code);
      assert.equal(await page.$eval('#total',el=>el.textContent),'9');
      assert.equal(await page.$eval('#datos',el=>el.hidden),false);
      await page.setViewport({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
  }
  const antes=llamadas;
  await page.goto(`${base}/receta/verificar?codigo=%3Cscript%3E`);
  await page.waitForFunction(()=>document.querySelector('#estado').textContent.includes('código válido'));
  assert.equal(llamadas,antes);assert.equal(external,0);assert.deepEqual(errores,[]);
  console.log('Verificador Chrome: registro, 404, error, código inválido, CSP y móvil correctos; sin red externa ni BD real.');
} finally {await browser.close();await new Promise(r=>server.close(r));await pool.end();}
