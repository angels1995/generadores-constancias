/*
 * Todas las fechas se manejan como 'YYYY-MM-DD' y se parsean siempre
 * con sufijo 'Z' (UTC explícito) para que el cálculo no dependa del
 * timezone configurado en el servidor donde corra este proceso.
 */

export function parseFechaUTC(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function formatoFechaISO(date) {
  return date.toISOString().slice(0, 10);
}

// 'Hoy' según el calendario de Perú (UTC-5 fijo, sin horario de verano).
export function hoyPeruISO() {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' });
  return formatter.format(new Date()); // ya devuelve 'YYYY-MM-DD'
}

// Regla: si la atención fue a las 17:00 o después, el descanso inicia al día siguiente.
export function calcularInicioDescanso(fechaAtencionStr, horaAtencionStr) {
  const hora = parseInt(horaAtencionStr.split(':')[0], 10);
  const fecha = parseFechaUTC(fechaAtencionStr);
  if (hora >= 17) {
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return formatoFechaISO(fecha);
}

export function calcularDias(inicioStr, finStr) {
  const inicio = parseFechaUTC(inicioStr);
  const fin = parseFechaUTC(finStr);
  if (fin < inicio) return { total: 0, texto: '0 DÍAS' };
  const diffDias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
  return { total: diffDias, texto: diffDias === 1 ? '1 DÍA' : `${diffDias} DÍAS` };
}

// Vigencia: inicio + fin + 1 día de gracia. Después de esa fecha, el código está vencido.
export function calcularValidoHasta(finStr) {
  const fin = parseFechaUTC(finStr);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return formatoFechaISO(fin);
}

export function estaVigente(validoHastaStr) {
  return hoyPeruISO() <= validoHastaStr;
}
