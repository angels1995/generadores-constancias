import {crearRouterEssalud} from './essalud-demo.js';
import {prepararRecetaEssalud,pdfRecetaEssalud} from '../lib/essalud-receta.js';
export default crearRouterEssalud({preparar:prepararRecetaEssalud,pdf:pdfRecetaEssalud});
