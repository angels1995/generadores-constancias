import 'dotenv/config';
import fs from 'fs';
import { generarCitt } from './src/generadores/citt.js';

const datosPrueba = {
  hospital: 'Hospital Nacional Edgardo Rebagliati Martins',
  paciente_nombre: 'Carlos Mendoza Ruiz',
  paciente_nacimiento: '1985-11-23',
  paciente_dni: '87654321',
  fecha_atencion: '2026-06-18',
  hora_atencion: '14:15',
  descanso_fin: '2026-06-22',
  diagnostico: 'K29 Gastritis aguda',
  sintomas: ['Dolor abdominal', 'Nauseas', 'Reflujo']
};

try {
  const resultado = await generarCitt(datosPrueba);

  console.log('autog:', resultado.autog);
  console.log('valido_hasta:', resultado.valido_hasta);
  console.log('datos:', resultado.datos);

  fs.writeFileSync('test-citt.pdf', Buffer.from(resultado.pdf_base64, 'base64'));
  console.log('PDF guardado como test-citt.pdf, ábrelo para revisar el diseño.');
} catch (err) {
  console.error('Error al generar CITT:', err.message);
}