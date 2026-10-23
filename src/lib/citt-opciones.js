import fs from 'node:fs';

export const SEGUROS = ['SIS', 'ESSALUD', 'PARTICULAR', 'OTRO'];
export const CONTINGENCIAS = [
  'ENFERMEDAD COMÚN', 'MATERNIDAD', 'ACCIDENTE COMÚN',
  'ACCIDENTE DE TRABAJO', 'ENFERMEDAD PROFESIONAL'
];
const limpio = (value) => value == null ? '' : String(value).trim();
const clave = (value) => limpio(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
function opcion(value, values, fallback) {
  if (!limpio(value)) return fallback;
  const result = values.find((item) => clave(item) === clave(value));
  if (!result) throw new Error(`Opción inválida: ${limpio(value)}. Opciones: ${values.join(', ')}`);
  return result;
}

const catalogos = Object.fromEntries(['minsa', 'essalud'].map((tipo) => [tipo,
  JSON.parse(fs.readFileSync(new URL(`../../data/establecimientos/${tipo}.json`, import.meta.url), 'utf8'))[tipo]
]));

/** Normaliza campos opcionales del CITT sin acceder a servicios externos. */
export function completarOpciones(input) {
  const tipo = limpio(input.establecimiento_catalogo).toLowerCase();
  const codigo = limpio(input.establecimiento_codigo);
  let establecimiento;
  if (codigo) {
    if (!catalogos[tipo]) throw new Error('Indica establecimiento_catalogo: minsa o essalud al seleccionar un código.');
    establecimiento = catalogos[tipo].find((row) => row[0] === codigo);
    if (!establecimiento) throw new Error('Código de establecimiento no encontrado en el catálogo seleccionado.');
  }
  const [, nombre, departamento, provincia, distrito, ubigeo, direccion] = establecimiento || [];
  return {
    ...input,
    usuario: limpio(input.usuario) || 'JUAN PEREZ RODRIGUEZ',
    hospital: nombre || limpio(input.hospital) || 'HOSPITAL NACIONAL',
    establecimiento_catalogo: codigo ? tipo : '',
    establecimiento_codigo: codigo,
    establecimiento_direccion: direccion ?? limpio(input.establecimiento_direccion),
    establecimiento_departamento: departamento ?? limpio(input.establecimiento_departamento),
    establecimiento_provincia: provincia ?? limpio(input.establecimiento_provincia),
    establecimiento_distrito: distrito ?? limpio(input.establecimiento_distrito),
    establecimiento_ubigeo: ubigeo ?? limpio(input.establecimiento_ubigeo),
    seguro: opcion(input.seguro, SEGUROS, 'OTRO'),
    contingencia: opcion(input.contingencia, CONTINGENCIAS, 'ENFERMEDAD COMÚN'),
    observaciones: limpio(input.observaciones),
    paciente_sexo: limpio(input.paciente_sexo),
    // Campos deliberadamente vacíos: no se infieren del catálogo ni del descanso actual.
    diris_diresa_geresa: '',
    dias_acumulados_consecutivos: '',
    dias_acumulados_no_consecutivos: '',
    dias_acumulados_total: ''
  };
}
