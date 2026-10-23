/** Nuevo estado optativo. Las peticiones anteriores sin este campo conservan su formato. */
export function validarEstadoSintomas(body) {
  const v=body.sintomas_no_consignados;
  if(v!=null && typeof v!=='boolean')throw new Error('sintomas_no_consignados debe ser true, false o null.');
  if(v===true && (!Array.isArray(body.sintomas)||body.sintomas.length))throw new Error('Síntomas no consignados requiere sintomas: [].');
  return v===true?{...body,sintomas_estado:'NO_CONSIGNADOS'}:body;
}
