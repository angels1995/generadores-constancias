import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { completarPaciente, consultarReniec } from '../src/lib/reniec.js';

// Sin dotenv: las pruebas nunca leen credenciales ni conectan a servicios reales.
const originalFetch = globalThis.fetch;
const originalToken = process.env.RENIEC_API_TOKEN;
process.env.RENIEC_API_TOKEN = 'token-ficticio';
const person = { nuDni: '00000001', preNombres: 'PERSONA', apePaterno: 'DE', apeMaterno: 'PRUEBA', feNacimiento: '12/05/1990' };
let calls = 0;
function mockReniec(payload = { success: true, listaAni: [person] }, status = 200) {
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.sin-flower.com/api/reniec/00000001');
    assert.equal(options.headers.Authorization, 'Bearer token-ficticio');
    return new Response(JSON.stringify(payload), { status });
  };
}
after(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.RENIEC_API_TOKEN;
  else process.env.RENIEC_API_TOKEN = originalToken;
});

test('completa identidad, conserva DNI con ceros y no devuelve datos adicionales', async () => {
  mockReniec({ success: true, listaAni: [person], foto: 'privada', firma: 'privada' });
  const result = await completarPaciente({ paciente_dni: '00000001', usar_reniec: true }, 'minsa');
  assert.equal(result.paciente_nombre, 'PERSONA DE PRUEBA');
  assert.equal(result.paciente_nacimiento, '1990-05-12');
  assert.equal(result.paciente_dni, '00000001');
  assert.equal(typeof result.paciente_edad, 'number');
  assert.equal(result.foto, undefined);
  assert.equal(result.firma, undefined);
});

test('modo manual no consulta y modo explícito reemplaza la identidad completa', async () => {
  mockReniec();
  const before = calls;
  const manual = { paciente_nombre: 'MANUAL', paciente_nacimiento: '2000-01-01', paciente_edad: 26 };
  assert.deepEqual(await completarPaciente(manual, 'minsa'), manual);
  assert.deepEqual(await completarPaciente(manual, 'citt'), manual);
  assert.deepEqual(await completarPaciente({ usar_reniec: false }, 'citt'), { usar_reniec: false });
  assert.equal(calls, before);
  const legacy = { paciente_nombre: 'MANUAL', paciente_edad: '' };
  assert.deepEqual(await completarPaciente(legacy, 'citt'), legacy);
  assert.equal(calls, before);
  const result = await completarPaciente({ ...manual, paciente_dni: '00000001', usar_reniec: true }, 'citt');
  assert.equal(result.paciente_nombre, 'PERSONA DE PRUEBA');
  assert.equal(result.paciente_nacimiento, '1990-05-12');
  await assert.rejects(completarPaciente({ usar_reniec: 'false' }, 'citt'), { statusCode: 400 });
});

test('rechaza DNI inválido y token ausente antes de consultar', async () => {
  const before = calls;
  await assert.rejects(consultarReniec('123'), { statusCode: 400 });
  await assert.rejects(consultarReniec(12345678), { statusCode: 400 });
  delete process.env.RENIEC_API_TOKEN;
  try { await assert.rejects(consultarReniec('00000001'), { statusCode: 503 }); }
  finally { process.env.RENIEC_API_TOKEN = 'token-ficticio'; }
  assert.equal(calls, before);
});

test('maneja errores del proveedor sin filtrar su contenido', async () => {
  for (const [status, expected] of [[401, 502], [404, 404], [429, 503], [500, 502]]) {
    mockReniec({ message: 'secreto-del-proveedor' }, status);
    await assert.rejects(consultarReniec('00000001'), (err) => err.statusCode === expected && !err.message.includes('secreto'));
  }
  globalThis.fetch = async () => { throw new DOMException('secreto', 'TimeoutError'); };
  await assert.rejects(consultarReniec('00000001'), { statusCode: 504 });
  globalThis.fetch = async () => new Response('no-json');
  await assert.rejects(consultarReniec('00000001'), { statusCode: 502 });
  for (const payload of [null, { success: false }, { listaAni: [] },
    { listaAni: [{ ...person, nuDni: '99999999' }] },
    { listaAni: [{ ...person, feNacimiento: '31/02/1990' }] },
    { listaAni: [{ ...person, preNombres: '' }] }]) {
    mockReniec(payload);
    await assert.rejects(consultarReniec('00000001'), { statusCode: 502 });
  }
});

test('ambos generadores usan la identidad en HTML, BD simulada y respuesta; fallos no escriben', async () => {
  const { pool } = await import('../src/lib/db.js');
  const { generarMinsa } = await import('../src/generadores/minsa.js');
  const { generarCitt } = await import('../src/generadores/citt.js');
  const { cerrarBrowser } = await import('../src/lib/pdf.js');
  const launch = puppeteer.launch;
  const query = pool.query;
  let inserts = 0;
  puppeteer.launch = async () => ({
    newPage: async () => ({
      setContent: async (html) => assert.ok(html.includes('PERSONA DE PRUEBA')),
      pdf: async () => Buffer.from('PDF SIMULADO'), close: async () => {}
    }), close: async () => {}
  });
  pool.query = async (_sql, values) => {
    inserts++;
    assert.equal(values[2], 'PERSONA DE PRUEBA');
    assert.equal(values[3], '00000001');
    return { rows: [] };
  };
  const body = {
    hospital: 'INSTITUCIÓN FICTICIA', paciente_dni: '00000001', usar_reniec: true,
    paciente_nombre: null, paciente_nacimiento: null, paciente_edad: null,
    fecha_atencion: '2026-10-22', hora_atencion: '09:30', descanso_fin: '2026-10-23',
    diagnostico: 'PRUEBA SIMULADA'
  };
  try {
    for (const generate of [generarMinsa, generarCitt]) {
      mockReniec();
      const result = await generate(body);
      assert.equal(result.input.paciente_nombre, 'PERSONA DE PRUEBA');
      assert.equal(body.paciente_nombre, null);
      assert.equal(result.pdf_base64, Buffer.from('PDF SIMULADO').toString('base64'));
      mockReniec({}, 500);
      const before = inserts;
      await assert.rejects(generate(body), { statusCode: 502 });
      assert.equal(inserts, before);
      const beforeCalls = calls;
      await assert.rejects(generate({ paciente_dni: '00000001' }));
      assert.equal(calls, beforeCalls);
    }
    assert.equal(inserts, 2);
  } finally {
    await cerrarBrowser();
    puppeteer.launch = launch;
    pool.query = query;
    await pool.end();
  }
});
