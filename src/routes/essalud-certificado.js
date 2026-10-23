import {crearRouterEssalud} from './essalud-demo.js';
import {prepararCertificadoEssalud,pdfCertificadoEssalud} from '../lib/essalud-certificado.js';

// Reutiliza el registro mínimo: código, estado pendiente, huella y fecha.
export default crearRouterEssalud({preparar:prepararCertificadoEssalud,pdf:pdfCertificadoEssalud});
