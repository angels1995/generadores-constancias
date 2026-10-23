import { completarOpciones } from './citt-opciones.js';
import { clasificarAtc } from './receta-atc.js';
import { hoyPeruISO } from './vigencia.js';
import { randomInt, createHash } from 'node:crypto';

// Referencias internas del documento; nunca reemplazan un identificador declarado.
export function completarIdentificadoresReceta(input) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (const campo of ['autogenerado_paciente', 'acto_medico', 'documento_id', 'historia_interna', 'paciente_pi']) {
    input[campo] ||= ['autogenerado_paciente', 'historia_interna', 'paciente_pi'].includes(campo)
      ? createHash('sha256').update(`interno:${campo}:${input.paciente_dni}`).digest('hex').slice(0,9).toUpperCase()
      : Array.from({length: 9}, () => alfabeto[randomInt(alfabeto.length)]).join('');
  }
  return input;
}

export function textoReceta(v, campo, max, requerido = false) {
  if (v != null && typeof v !== 'string') throw new Error(`${campo} debe ser texto.`);
  const text = (v ?? '').trim();
  if (requerido && !text) throw new Error(`Falta el campo requerido: ${campo}`);
  if (text.length > max) throw new Error(`${campo} admite hasta ${max} caracteres.`);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error(`${campo} contiene caracteres inválidos.`);
  return text;
}
function fecha(v, campo) {
  const text = textoReceta(v, campo, 10, true);
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== text) throw new Error(`${campo} debe ser una fecha válida YYYY-MM-DD.`);
  return text;
}
function entero(v, campo, min, max) {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new Error(`${campo} debe ser un entero entre ${min} y ${max}.`);
  }
  return v;
}

/** Solo normaliza datos proporcionados. No elige medicamentos ni calcula tratamientos. */
export function validarReceta(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('El cuerpo debe ser un objeto JSON.');
  const paciente_dni = textoReceta(body.paciente_dni, 'paciente_dni', 8, true);
  if (!/^\d{8}$/.test(paciente_dni)) throw new Error('paciente_dni debe tener 8 dígitos como texto.');
  if (!Array.isArray(body.medicamentos) || body.medicamentos.length < 1 || body.medicamentos.length > 30) {
    throw new Error('medicamentos debe contener entre 1 y 30 elementos.');
  }
  // Validar tipos antes de normalizar los opcionales compartidos.
  const campos = {
    hospital: 100, establecimiento_catalogo: 10, establecimiento_codigo: 12,
    establecimiento_direccion: 140, establecimiento_departamento: 50,
    establecimiento_provincia: 50, establecimiento_distrito: 50,
    seguro: 15, atencion: 45, especialidad: 60, historia_interna: 30,
    diagnostico: 220, cie10: 12, medico_nombre: 100, medico_cmp: 12, usuario: 70
  };
  const limpio = Object.fromEntries(Object.entries(campos).map(([k, max]) => [k, textoReceta(body[k], k, max)]));
  limpio.atencion ||= 'CONSULTA EXTERNA';
  limpio.especialidad ||= 'Traumatología';
  const opciones = completarOpciones(limpio);
  const fecha_atencion = fecha(body.fecha_atencion, 'fecha_atencion');
  const valido_hasta = fecha(body.valido_hasta, 'valido_hasta');
  if (valido_hasta < fecha_atencion) throw new Error('valido_hasta no puede ser anterior a fecha_atencion.');
  let paciente_edad = null;
  let paciente_nacimiento = '';
  if (body.paciente_nacimiento != null && body.paciente_nacimiento !== '') {
    paciente_nacimiento = fecha(body.paciente_nacimiento, 'paciente_nacimiento');
    const hoy = hoyPeruISO();
    if (paciente_nacimiento > hoy || paciente_nacimiento > fecha_atencion) throw new Error('Nacimiento posterior a la atención o a hoy.');
    paciente_edad = Number(fecha_atencion.slice(0, 4)) - Number(paciente_nacimiento.slice(0, 4));
    if (fecha_atencion.slice(5) < paciente_nacimiento.slice(5)) paciente_edad--;
    entero(paciente_edad, 'paciente_edad calculada', 0, 130);
  } else if (body.paciente_edad != null && body.paciente_edad !== '') {
    paciente_edad = entero(body.paciente_edad, 'paciente_edad', 0, 130);
  }
  const medicamentos = body.medicamentos.map((m, i) => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) throw new Error(`medicamentos[${i}] debe ser un objeto.`);
    const prefijo = `medicamentos[${i}]`;
    const result = Object.fromEntries(Object.entries({ nombre: 65, concentracion: 30, forma: 30,
      dosis: 55, via: 25, frecuencia: 45, indicaciones: 100 }).map(([k, max]) => [k,
      textoReceta(m[k], `${prefijo}.${k}`, max, ['nombre', 'dosis', 'via', 'frecuencia'].includes(k))]));
    result.cantidad = entero(m.cantidad, `${prefijo}.cantidad`, 1, 10000);
    result.dias = entero(m.dias, `${prefijo}.dias`, 1, 365);
    return { ...result, ...clasificarAtc(result) };
  });
  return {
    ...limpio, usuario: opciones.usuario, hospital: opciones.hospital, seguro: opciones.seguro,
    establecimiento_catalogo: opciones.establecimiento_catalogo,
    establecimiento_codigo: opciones.establecimiento_codigo,
    establecimiento_direccion: opciones.establecimiento_direccion,
    establecimiento_departamento: opciones.establecimiento_departamento,
    establecimiento_provincia: opciones.establecimiento_provincia,
    establecimiento_distrito: opciones.establecimiento_distrito,
    paciente_dni, paciente_nombre: textoReceta(body.paciente_nombre, 'paciente_nombre', 100, true),
    paciente_nacimiento, paciente_edad, fecha_atencion, valido_hasta,
    medicamentos, usar_reniec: body.usar_reniec === true, estado: 'BORRADOR'
  };
}
