import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

// Validación visual del generador real, con BD simulada y sin consultas RENIEC.
process.env.VERIFICADOR_URL_BASE = 'https://example.invalid/verificar';
delete process.env.DATABASE_URL;
const { pool } = await import('../src/lib/db.js');
const { generarCitt } = await import('../src/generadores/citt.js');
const { cerrarBrowser } = await import('../src/lib/pdf.js');
const output = path.resolve('tmp/pdfs/citt-produccion-validacion');
fs.mkdirSync(output, { recursive: true });
let inserts = 0;
pool.query = async () => { inserts++; return { rows: [] }; };
let externalCalls = 0;
globalThis.fetch = async () => { externalCalls++; throw Error('Sin red en esta prueba'); };
const launch = puppeteer.launch.bind(puppeteer);
const layouts = [];
let current;
puppeteer.launch = async (options) => {
  const browser = await launch({ ...options, ...(process.argv[2] ? { executablePath: process.argv[2] } : {}) });
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async () => {
    const page = await newPage();
    const setContent = page.setContent.bind(page);
    const pdf = page.pdf.bind(page);
    page.setContent = async (html, options) => {
      assert.ok(!html.includes('Texto de ejemplo'));
      assert.ok(!html.includes('{{LOGO}}'));
      // Los archivos de QA llevan marca de muestra; la plantilla activa no cambia.
      return setContent(html.replace('</main>', '<div style="position:absolute;bottom:73px;left:52px;right:52px;text-align:center;color:#a00000;border:1px solid #a00000;padding:6px;font:bold 11px Arial">MUESTRA - SIN VALIDEZ - VALIDACIÓN TÉCNICA</div></main>'), options);
    };
    page.pdf = async (options) => {
      const layout = await page.evaluate(() => {
        const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
        return {
          issuedBottom: rect('.issued').bottom, footerTop: rect('.footer').top,
          pageWidth: rect('.page').width, pageHeight: rect('.page').height,
          images: [...document.images].every((im) => im.complete && im.naturalWidth > 0)
        };
      });
      assert.ok(layout.images);
      assert.ok(layout.issuedBottom < layout.footerTop - 55, JSON.stringify(layout));
      layouts.push({ scenario: current, ...layout });
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
      await page.screenshot({ path: path.join(output, `${current}.png`), fullPage: true });
      return pdf(options);
    };
    return page;
  };
  return browser;
};
const base = {
  paciente_nombre: 'PACIENTE FICTICIO DE VALIDACIÓN', paciente_dni: '00000000', paciente_edad: '',
  hospital: 'HOSPITAL FICTICIO', fecha_atencion: '2026-10-22', hora_atencion: '08:00', descanso_fin: '2026-10-24',
  diagnostico: 'CASO SIMULADO PARA VALIDACIÓN DEL DISEÑO', sintomas: [],
  medico_nombre: 'PROFESIONAL FICTICIO', medico_cmp: '000000', medico_rne: '000000'
};
try {
  for (const [name, extra] of [
    ['legacy', {}],
    ['null', { seguro: null, contingencia: null, establecimiento_direccion: null, paciente_sexo: null, observaciones: null }],
    ['catalogo', {
      establecimiento_catalogo: 'essalud', establecimiento_codigo: '00029680', seguro: 'SIS',
      contingencia: 'ENFERMEDAD PROFESIONAL', paciente_edad: 36, paciente_sexo: 'M',
      observaciones: 'OBSERVACIÓN SIMULADA PARA VALIDAR EL CAMPO OPCIONAL.'
    }]
  ]) {
    current = name;
    const result = await generarCitt({ ...base, ...extra });
    fs.writeFileSync(path.join(output, `${name}.pdf`), Buffer.from(result.pdf_base64, 'base64'));
    assert.equal(result.input.seguro, name === 'catalogo' ? 'SIS' : 'OTRO');
  }
  assert.equal(inserts, 3);
  assert.equal(externalCalls, 0);
  console.log(JSON.stringify({ insertsSimulados: inserts, consultasExternas: externalCalls, layouts }, null, 2));
} finally { await cerrarBrowser(); await pool.end(); }
