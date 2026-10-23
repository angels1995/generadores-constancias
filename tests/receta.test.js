import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import puppeteer from 'puppeteer';
import { validarReceta } from '../src/lib/receta-input.js';
import { clasificarAtc } from '../src/lib/receta-atc.js';
import { recetaDemo, medicamentoDemo } from './receta-fixture.mjs';
const { pool } = await import('../src/lib/db.js');
const { app } = await import('../src/app.js');
const { cerrarBrowserReceta } = await import('../src/lib/receta-pdf.js');
const fetchOriginal = globalThis.fetch;
const queryOriginal = pool.query;
const launchOriginal = puppeteer.launch;
let html, registros = new Map(), externas = 0;
puppeteer.launch = async () => ({ newPage: async () => ({
  setViewport: async () => {}, evaluate: async () => {},
  setContent: async h => { html = h; }, pdf: async () => Buffer.from('PDF SIMULADO'), close: async () => {}
}), close: async () => {} });
pool.query = async (sql, params) => {
  if (sql.startsWith('INSERT')) {
    registros.set(params[0], {autog: params[0], input: JSON.parse(params[1]), valido_hasta: params[2], created_at: params[3]});
    return { rows: [] };
  }
  assert.ok(!sql.includes('SELECT *'));
  const r = registros.get(params[0]);
  return {rows: r ? [{autog:r.autog, valido_hasta:r.valido_hasta, created_at:r.created_at, medicamentos_total:r.input.medicamentos.length}] : []};
};
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith(base + '/')) return fetchOriginal(url, options);
  externas++;
  if (String(url).endsWith('/00000000')) return new Response(JSON.stringify({success:true, listaAni:[{
    nuDni:'00000000', preNombres:'PACIENTE', apePaterno:'FICTICIO', apeMaterno:'DEMO', feNacimiento:'01/01/1990'
  }]}), {status:200});
  throw Error('Red externa bloqueada');
};
async function post(body) {
  const res = await fetch(`${base}/api/receta/generar`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  return { status: res.status, body: await res.json() };
}
after(async () => {
  globalThis.fetch = fetchOriginal;
  await new Promise(r => server.close(r));
  await cerrarBrowserReceta();
  puppeteer.launch = launchOriginal; pool.query = queryOriginal;
  delete process.env.RENIEC_API_TOKEN;
  await pool.end();
});
test('ATC distingue vías, formas, alias y combinaciones sin inventar códigos', () => {
  for (const [nombre, via, codigo] of [
    ['ACETAMINOFÉN','ORAL','N02BE01'], ['IBUPROFENO','ORAL','M01AE01'],
    ['IBUPROFENO','TÓPICA','M02AA13'], ['NAPROXENO','ORAL','M01AE02'],
    ['NAPROXENO','CUTÁNEA','M02AA12'], ['AMOXICILINA','ORAL','J01CA04'],
    ['CLORHEXIDINA','BUCAL','A01AB03'], ['CLORHEXIDINA','CUTÁNEA','D08AC02'],
    ['CLORHEXIDINA','ORAL',''], ['AMOXICILINA + CLAVULÁNICO','ORAL',''],
    ['PARACETAMOL + IBUPROFENO','ORAL',''], ['IBUPROFENO','OCULAR','']
  ]) assert.equal(clasificarAtc({nombre,via}).atc_codigo, codigo);
  assert.equal(clasificarAtc({nombre:'IBUPROFENO',via:'ORAL',forma:'GEL'}).atc_codigo, '');
});
test('opcionales null/vacíos conservan blanco; seguro OTRO y catálogo local', () => {
  for (const valor of [null, '', '  ']) {
    const r = validarReceta({...recetaDemo, seguro:valor, medico_nombre:valor, medico_cmp:valor, cie10:valor});
    assert.equal(r.seguro, 'OTRO'); assert.equal(r.medico_nombre, ''); assert.equal(r.cie10, '');
  }
  const r = validarReceta({...recetaDemo, establecimiento_catalogo:'minsa',establecimiento_codigo:'00002806'});
  assert.equal(r.hospital,'LA NOVIA'); assert.equal(r.paciente_edad,36);
  assert.equal(validarReceta({...recetaDemo,paciente_nacimiento:null,paciente_edad:0}).paciente_edad,0);
});
test('rechaza fechas falsas, datos incompletos y cantidades inválidas sin truncar', () => {
  for (const extra of [{fecha_atencion:'2026-02-30'}, {valido_hasta:'2026-10-01'},
    {paciente_dni:12345678}, {paciente_nombre:'X'.repeat(101)}, {medicamentos:[]},
    {medicamentos:Array(31).fill(medicamentoDemo)}, {medicamentos:[{...medicamentoDemo,dosis:''}]},
    {medicamentos:[{...medicamentoDemo,cantidad:'1'}]}, {medicamentos:[{...medicamentoDemo,dias:0}]}
  ]) assert.throws(() => validarReceta({...recetaDemo,...extra}));
});
test('HTTP entrega PDF/QR/registro, escapa HTML y no asigna datos clínicos automáticos', async () => {
  const {status,body} = await post({...recetaDemo, paciente_nombre:'PACIENTE <b>& FICTICIO'});
  assert.equal(status,200); assert.equal(body.status,true);
  assert.match(body.data.autog,/^RECETA-[A-F0-9]{32}$/);
  assert.equal(new URL(body.data.verificador_url).searchParams.get('receta'),body.data.autog);
  assert.equal(new URL(body.data.verificador_url).origin,new URL(process.env.VERIFICADOR_URL_BASE || 'https://minsa.servicios-enlinea.net.pe').origin);
  assert.equal(body.data.input.estado,'BORRADOR');
  assert.ok(html.includes('PACIENTE &lt;b&gt;&amp; FICTICIO'));
  assert.ok(html.includes('PENDIENTE DE VALIDACIÓN Y FIRMA'));
  assert.equal((html.match(/alt="Logo de referencia MINSA"/g)||[]).length,2);
  assert.equal((html.match(/alt="Espacio para imagen única de firma y sello"/g)||[]).length,2);
  assert.equal((html.match(/class="seal"/g)||[]).length,0);
  assert.ok(!html.includes('REFERENCIA - SIN VALOR DE FIRMA'));
  assert.equal(body.data.input.medico_cmp,''); assert.equal(externas,0);
  const res = await fetch(`${base}/api/receta/verificar/${body.data.autog}`);
  const verif = await res.json();
  assert.equal(res.status,200); assert.equal(verif.data.estado,'BORRADOR');
  for (const k of ['input','paciente_nombre','paciente_dni','diagnostico','medicamentos']) assert.ok(!(k in verif.data));
  assert.equal(verif.data.medicamentos_total,1);
});
test('nueve medicamentos generan dos secciones sincronizadas y avisan códigos desconocidos', async () => {
  const {body} = await post({...recetaDemo,medicamentos:Array.from({length:9},(_,i)=>({...medicamentoDemo,nombre:i===8?'NO CLASIFICADO':'PARACETAMOL'}))});
  assert.equal((html.match(/class="page"/g)||[]).length,2);
  assert.ok(html.includes('9. NO CLASIFICADO')); assert.equal(body.data.avisos.length,1);
});
test('RENIEC es optativo, falla sin registro; válida estructura antes de consultar', async () => {
  const prev = registros.size;
  const invalid = await post({...recetaDemo,usar_reniec:true,medicamentos:[]});
  assert.equal(invalid.status,400); assert.equal(externas,0); assert.equal(registros.size,prev);
  const sinToken = await post({...recetaDemo,usar_reniec:true,paciente_nombre:null});
  assert.equal(sinToken.status,503); assert.equal(registros.size,prev);
  process.env.RENIEC_API_TOKEN='TOKEN_FICTICIO_DE_PRUEBA';
  const ok = await post({...recetaDemo,usar_reniec:true,paciente_nombre:null,paciente_nacimiento:null,paciente_edad:null});
  assert.equal(ok.status,200); assert.equal(ok.body.data.input.paciente_nombre,'PACIENTE FICTICIO DEMO');
  assert.equal(externas,1);
});
test('verificador y catálogo: 404 claro, página sin datos incrustados y cabeceras privadas', async () => {
  for (const codigo of ['INVALIDO','RECETA-'+'A'.repeat(32)]) {
    assert.equal((await fetch(`${base}/api/receta/verificar/${codigo}`)).status,404);
  }
  const page = await fetch(`${base}/receta/verificar?codigo=<script>`);
  assert.equal(page.status,200); assert.equal(page.headers.get('cache-control'),'no-store');
  assert.ok(page.headers.get('content-security-policy').includes("connect-src 'self'"));
  assert.ok(!(await page.text()).includes('codigo=<script>'));
  const script = await fetch(`${base}/receta/verificador.js`);
  assert.equal(script.status,200); assert.ok(!(await script.text()).includes('innerHTML'));
  const cat = await (await fetch(`${base}/api/receta/catalogo-atc`)).json();
  assert.equal(cat.data.length,8); assert.ok(!JSON.stringify(cat).includes('DDD'));
});
