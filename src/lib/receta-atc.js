// Códigos aportados por el usuario, contrastados con las fichas ATC el 2026-10-22.
// No es una copia del índice ni una guía de prescripción. No contiene DDD.
const normalizar = (v) => String(v ?? '').trim().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase();
const topicas = ['TOPICA', 'CUTANEA', 'DERMICA', 'EXTERNA'];
const sistemicas = ['ORAL', 'RECTAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'PARENTERAL'];
const formasTopicas = ['GEL', 'CREMA', 'POMADA', 'UNGUENTO'];
const filas = [
  ['PARACETAMOL', ['ACETAMINOFEN', 'ACETAMINOFENO'], 'N02BE01', ['ORAL', 'RECTAL', 'INTRAVENOSA', 'PARENTERAL']],
  ['IBUPROFENO', [], 'M01AE01', sistemicas],
  ['IBUPROFENO', [], 'M02AA13', topicas],
  ['AMOXICILINA', [], 'J01CA04', ['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'PARENTERAL']],
  ['NAPROXENO', [], 'M01AE02', ['ORAL', 'RECTAL']],
  ['NAPROXENO', [], 'M02AA12', topicas],
  ['CLORHEXIDINA', [], 'A01AB03', ['BUCAL', 'ENJUAGUE BUCAL', 'ORAL LOCAL']],
  ['CLORHEXIDINA', [], 'D08AC02', topicas]
];
export const catalogoAtc = filas.map(([nombre, aliases, codigo, vias]) => ({
  nombre, aliases, codigo, vias,
  fuente: `https://atcddd.fhi.no/atc_ddd_index/?code=${codigo}`
}));

export function clasificarAtc(medicamento) {
  const nombre = normalizar(medicamento.nombre);
  const via = normalizar(medicamento.via);
  const forma = normalizar(medicamento.forma);
  // Coincidencia exacta: una combinación o marca comercial nunca hereda el código de un ingrediente.
  const candidatos = catalogoAtc.filter((r) => [r.nombre, ...r.aliases].includes(nombre));
  const regla = candidatos.find((r) => r.vias.includes(via));
  const contradiccion = formasTopicas.includes(forma) && !topicas.includes(via);
  if (!regla || contradiccion) return {
    atc_codigo: '', atc_fuente: '',
    atc_aviso: 'ATC sin asignar: revisar principio activo, vía, forma y posibles combinaciones.'
  };
  return { atc_codigo: regla.codigo, atc_fuente: regla.fuente, atc_aviso: '' };
}
