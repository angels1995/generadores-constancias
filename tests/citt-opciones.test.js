import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completarOpciones, SEGUROS, CONTINGENCIAS } from '../src/lib/citt-opciones.js';

test('payload anterior y nuevos campos vacíos mantienen los valores predeterminados', () => {
  const legacy = { hospital: 'HOSPITAL EXISTENTE', paciente_nombre: 'PERSONA DEMO', diagnostico: 'EJEMPLO' };
  for (const value of [undefined, null, '', '  ']) {
    const result = completarOpciones({ ...legacy, seguro: value, contingencia: value, establecimiento_codigo: value });
    assert.equal(result.hospital, legacy.hospital);
    assert.equal(result.seguro, 'OTRO');
    assert.equal(result.contingencia, 'ENFERMEDAD COMÚN');
    assert.equal(result.diris_diresa_geresa, '');
    assert.equal(result.dias_acumulados_total, '');
    assert.equal(result.dias_acumulados_consecutivos, '');
    assert.equal(result.dias_acumulados_no_consecutivos, '');
  }
});
test('catálogos conservan códigos de texto y completan el establecimiento seleccionado', () => {
  const r = completarOpciones({ establecimiento_catalogo: 'minsa', establecimiento_codigo: '00002806' });
  assert.equal(r.hospital, 'LA NOVIA');
  assert.equal(r.establecimiento_ubigeo, '170303');
  assert.equal(r.establecimiento_direccion, 'CARRETERA IBERIA KM 80');
  const e = completarOpciones({ establecimiento_catalogo: 'essalud', establecimiento_codigo: '00029680' });
  assert.equal(e.hospital, 'CENTRO MEDICO AYAVIRI');
  assert.throws(() => completarOpciones({ establecimiento_codigo: '00002806' }));
  assert.throws(() => completarOpciones({ establecimiento_catalogo: 'minsa', establecimiento_codigo: 'no-existe' }));
});
test('admite todas las opciones acordadas y normaliza mayúsculas y tildes', () => {
  for (const seguro of SEGUROS) assert.equal(completarOpciones({ seguro }).seguro, seguro);
  for (const contingencia of CONTINGENCIAS) assert.equal(completarOpciones({ contingencia }).contingencia, contingencia);
  assert.equal(completarOpciones({ contingencia: 'enfermedad comun' }).contingencia, 'ENFERMEDAD COMÚN');
  assert.throws(() => completarOpciones({ seguro: 'inventado' }));
});
