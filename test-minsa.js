import 'dotenv/config';
import fs from 'fs';
import { generarMinsa } from './src/generadores/minsa.js';

const datosPrueba = {
  hospital: 'Hospital Nacional Dos de Mayo',
  paciente_nombre: 'Juan Perez Lopez',
  paciente_nacimiento: '1990-05-12',
  paciente_dni: '12345678',
  fecha_atencion: '2026-06-17',
  hora_atencion: '09:30',
  descanso_fin: '2026-06-19',
  diagnostico: 'J00 Resfriado comun',
  sintomas: ['Fiebre', 'Tos', 'Dolor de cabeza']
};

try {
  const resultado = await generarMinsa(datosPrueba);

  console.log('autog:', resultado.autog);
  console.log('valido_hasta:', resultado.valido_hasta);
  console.log('datos:', resultado.datos);

  fs.writeFileSync('test-minsa.pdf', Buffer.from(resultado.pdf_base64, 'base64'));
  console.log('PDF guardado como test-minsa.pdf, ábrelo para revisar el diseño.');
} catch (err) {
  console.error('Error al generar:', err.message);
}
