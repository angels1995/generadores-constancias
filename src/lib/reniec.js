import { hoyPeruISO } from './vigencia.js';

const API_URL = 'https://api.sin-flower.com/api/reniec';

function errorReniec(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

function fechaNacimiento(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || ''));
  if (!match) throw errorReniec('RENIEC devolvió una fecha de nacimiento inválida.', 502);
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  const today = hoyPeruISO();
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso || iso > today) {
    throw errorReniec('RENIEC devolvió una fecha de nacimiento inválida.', 502);
  }
  return iso;
}

export async function consultarReniec(dni) {
  if (typeof dni !== 'string' || !/^\d{8}$/.test(dni.trim())) {
    throw errorReniec('paciente_dni debe ser un texto de 8 dígitos.', 400);
  }
  const token = process.env.RENIEC_API_TOKEN?.trim();
  if (!token) throw errorReniec('Falta configurar RENIEC_API_TOKEN en el servidor.', 503);

  let response;
  try {
    response = await fetch(`${API_URL}/${dni.trim()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
      redirect: 'error'
    });
  } catch (err) {
    throw errorReniec(
      err.name === 'TimeoutError' ? 'La consulta RENIEC agotó el tiempo de espera.' : 'No se pudo conectar con RENIEC.',
      err.name === 'TimeoutError' ? 504 : 502
    );
  }
  if (!response.ok) {
    const status = response.status === 404 ? 404 : response.status === 429 ? 503 : 502;
    throw errorReniec(response.status === 404 ? 'DNI no encontrado en RENIEC.' : 'La consulta RENIEC no está disponible.', status);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw errorReniec('RENIEC devolvió una respuesta inválida.', 502);
  }
  if (payload?.success === false || !Array.isArray(payload?.listaAni) || !payload.listaAni.length) {
    throw errorReniec('RENIEC no devolvió datos del paciente.', 502);
  }
  const person = payload.listaAni.find((item) => item?.nuDni === dni.trim());
  if (!person) throw errorReniec('El DNI devuelto por RENIEC no coincide con el solicitado.', 502);
  const names = [person.preNombres, person.apePaterno, person.apeMaterno];
  if (names.some((name) => typeof name !== 'string') || !person.preNombres.trim() || !person.apePaterno.trim()) {
    throw errorReniec('RENIEC devolvió un nombre incompleto.', 502);
  }
  const nacimiento = fechaNacimiento(person.feNacimiento);
  const today = hoyPeruISO();
  let edad = Number(today.slice(0, 4)) - Number(nacimiento.slice(0, 4));
  if (today.slice(5) < nacimiento.slice(5)) edad--;
  return {
    paciente_dni: dni.trim(),
    paciente_nombre: names.map((name) => name.trim()).filter(Boolean).join(' ').toUpperCase(),
    paciente_nacimiento: nacimiento,
    paciente_edad: edad
  };
}

export async function completarPaciente(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw errorReniec('El cuerpo debe ser un objeto JSON.', 400);
  }
  if (body.usar_reniec !== undefined && typeof body.usar_reniec !== 'boolean') {
    throw errorReniec('usar_reniec debe ser true o false.', 400);
  }
  if (body.usar_reniec !== true) return { ...body };
  return { ...body, ...await consultarReniec(body.paciente_dni) };
}
