import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { once } from 'node:events';

// Sin dotenv, sin BD real ni navegador real; probar la ruta HTTP y su contrato.
process.env.VERIFICADOR_URL_BASE = 'https://example.invalid/verificar';
const { pool } = await import('../src/lib/db.js');
const { app } = await import('../src/app.js');
const { cerrarBrowser } = await import('../src/lib/pdf.js');
const originalFetch = globalThis.fetch;
const originalLaunch = puppeteer.launch;
const originalQuery = pool.query;
let html = '';
let inserts = 0;
let values;
puppeteer.launch = async () => ({ once: () => {}, isConnected: () => true,
  newPage: async () => ({
    setContent: async (value) => { html = value; },
    pdf: async () => Buffer.from('PDF SIMULADO'), close: async () => {}
  }), close: async () => {}
});
pool.query = async (_sql, params) => { inserts++; values = params; return { rows: [] }; };
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}/api/citt/generar`;
globalThis.fetch = async (target, options) => {
  if (target !== url) throw Error('Consulta externa no permitida en esta prueba');
  return originalFetch(target, options);
};
const legacy = {
  hospital: 'HOSPITAL DEMO', paciente_nombre: 'PERSONA DE PRUEBA',
  paciente_dni: '00000000', paciente_edad: '', fecha_atencion: '2026-10-22',
  hora_atencion: '08:00', descanso_fin: '2026-10-24', diagnostico: 'CASO SIMULADO', sintomas: []
};
async function post(body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}
after(async () => {
  globalThis.fetch = originalFetch;
  await new Promise((resolve) => server.close(resolve));
  await cerrarBrowser();
  puppeteer.launch = originalLaunch;
  pool.query = originalQuery;
  await pool.end();
});

test('payload anterior sigue devolviendo la misma estructura, PDF y verificador', async () => {
  const { status, body } = await post(legacy);
  assert.equal(status, 200);
  assert.equal(body.status, true);
  assert.equal(body.message, 'found');
  assert.deepEqual(Object.keys(body.data).sort(), ['autog', 'input', 'pdf_base64', 'valido_hasta', 'verificador_url']);
  assert.equal(body.data.verificador_url, `${process.env.VERIFICADOR_URL_BASE}?citt=${body.data.autog}`);
  assert.equal(body.data.valido_hasta, '2026-10-25');
  assert.equal(body.data.input.seguro, 'OTRO');
  assert.equal(body.data.input.contingencia, 'ENFERMEDAD COMÚN');
  assert.equal(body.data.input.paciente_edad, '');
  assert.equal(values[8], 3);
  assert.ok(html.includes('JUAN PEREZ'));
  assert.ok(!html.includes('MUESTRA - SIN VALIDEZ'));
  assert.ok(!html.includes('Texto de ejemplo'));
});

test('todos los campos nuevos admiten null, vacío y espacios sin cambiar el payload antiguo', async () => {
  const keys = ['seguro', 'contingencia', 'establecimiento_codigo', 'establecimiento_catalogo',
    'establecimiento_direccion', 'establecimiento_departamento', 'establecimiento_provincia',
    'establecimiento_distrito', 'establecimiento_ubigeo', 'paciente_sexo', 'observaciones'];
  for (const value of [null, '', '  ']) {
    const { status, body } = await post({ ...legacy, ...Object.fromEntries(keys.map((key) => [key, value])) });
    assert.equal(status, 200);
    assert.equal(body.data.input.hospital, legacy.hospital);
    assert.equal(body.data.input.seguro, 'OTRO');
    assert.equal(body.data.input.contingencia, 'ENFERMEDAD COMÚN');
    for (const key of ['diris_diresa_geresa', 'dias_acumulados_consecutivos', 'dias_acumulados_no_consecutivos', 'dias_acumulados_total']) {
      assert.equal(body.data.input[key], '');
    }
  }
});

test('catálogo y opciones nuevas llegan al HTML y datos usados sin confundir seguro con catálogo', async () => {
  const { status, body } = await post({
    ...legacy, establecimiento_catalogo: 'minsa', establecimiento_codigo: '00002806',
    seguro: 'PARTICULAR', contingencia: 'accidente de trabajo', paciente_edad: 0,
    paciente_sexo: 'F', observaciones: '<script>alert(1)</script>', paciente_nombre: 'NOMBRE <b>& DEMO'
  });
  assert.equal(status, 200);
  assert.equal(body.data.input.hospital, 'LA NOVIA');
  assert.equal(values[1], 'LA NOVIA');
  assert.equal(values[4], '0 años');
  assert.ok(html.includes('PARTICULAR'));
  assert.ok(html.includes('ACCIDENTE DE TRABAJO'));
  assert.ok(html.includes('CARRETERA IBERIA KM 80'));
  assert.ok(html.includes('0 / F'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('NOMBRE &lt;B&gt;&amp; DEMO'));
});

test('opciones inválidas fallan antes del PDF, consulta externa o escritura', async () => {
  const before = inserts;
  const { status, body } = await post({ ...legacy, usar_reniec: true, seguro: 'NO_EXISTE' });
  assert.equal(status, 400);
  assert.equal(body.status, false);
  assert.equal(body.data, null);
  assert.equal(inserts, before);
});
