import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {renderHtmlReceta} from '../src/lib/receta-render.js';
import {validarReceta} from '../src/lib/receta-input.js';
import {paginarReceta} from '../src/lib/receta-pdf.js';
import {recetaDemo, medicamentoDemo} from './receta-fixture.mjs';

test('receta MINSA conserva dos columnas hermanas y pagina 1, 9 y 30 medicamentos', async () => {
  const browser = await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
  try {
    for (const count of [1,9,30]) {
      const input=validarReceta({...recetaDemo,medicamentos:Array.from({length:count},()=>({...medicamentoDemo}))});
      const html=await renderHtmlReceta(input,{autog:'RECETA-PRUEBA',verificador_url:'https://example.test/registro',emitido_lima:'07/11/2026'});
      const page=await browser.newPage();
      try {
        await page.setViewport({width:794,height:1123});
        await page.setContent(html,{waitUntil:'load'});
        const estructura=await page.evaluate(()=>({
          columnas:[...document.querySelectorAll('.page')].map(p=>p.querySelectorAll(':scope > .columns > .col').length),
          anidadas:document.querySelectorAll('.col .col').length
        }));
        assert.ok(estructura.columnas.every(n=>n===2));
        assert.equal(estructura.anidadas,0);
        const resultado=await page.evaluate(paginarReceta);
        assert.equal(resultado.medicamentos,count);
        assert.ok(resultado.paginas>=Math.ceil(count/5));
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
