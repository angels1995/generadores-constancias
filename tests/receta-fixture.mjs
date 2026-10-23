// Solo datos ficticios; las indicaciones de prueba no representan un tratamiento.
export const medicamentoDemo = {
  nombre: 'PARACETAMOL', concentracion: '', forma: 'TABLETA', cantidad: 1,
  dosis: 'DOSIS FICTICIA', via: 'ORAL', frecuencia: 'FRECUENCIA DE PRUEBA', dias: 1,
  indicaciones: 'DEMOSTRACIÓN DE DISEÑO. NO USAR COMO TRATAMIENTO.'
};
export const recetaDemo = {
  hospital: 'ESTABLECIMIENTO FICTICIO', paciente_nombre: 'PACIENTE FICTICIO DE DEMOSTRACIÓN',
  paciente_dni: '00000000', paciente_nacimiento: '1990-01-01',
  fecha_atencion: '2026-10-22', valido_hasta: '2026-10-23',
  diagnostico: 'CASO FICTICIO PARA VALIDACIÓN DEL DISEÑO', seguro: 'OTRO',
  atencion: 'CONSULTA DE DEMOSTRACIÓN', especialidad: '', historia_interna: '',
  medico_nombre: '', medico_cmp: '', usuario: 'PRUEBA LOCAL', medicamentos: [medicamentoDemo]
};
