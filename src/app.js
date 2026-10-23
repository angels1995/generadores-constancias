import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import generarRouter from './routes/generar.js';
import verificarRouter from './routes/verificar.js';
import recetaRouter from './routes/receta.js';
import essaludDemoRouter from './routes/essalud-demo.js';
import essaludCertificadoRouter from './routes/essalud-certificado.js';
import essaludRecetaRouter from './routes/essalud-receta.js';
import documentosRouter from './routes/documentos.js';
import { fileURLToPath } from 'node:url';

export const app = express();

const origenesPermitidos = process.env.ORIGIN_PERMITIDO
  ? process.env.ORIGIN_PERMITIDO.split(',').map((s) => s.trim())
  : '*';

app.use(cors({ origin: origenesPermitidos }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting para verificar — público pero controlado
const limiterVerificar = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 20,                    // 20 requests por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta más tarde.' }
});

// Rate limiting para generar — más estricto
const limiterGenerar = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 10,                    // 10 requests por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de generación alcanzado, intenta más tarde.' }
});

app.use('/api/citt/verificar', limiterVerificar);
app.use('/api/minsa/verificar', limiterVerificar);
app.use('/api/citt/generar', limiterGenerar);
app.use('/api/minsa/generar', limiterGenerar);
app.use('/api/receta/generar', limiterGenerar);
app.use('/api/essalud/citt-demo/generar', limiterGenerar);
app.use('/api/essalud/citt-demo/verificar', limiterVerificar);
app.use('/api/essalud/certificado/generar', limiterGenerar);
app.use('/api/essalud/certificado/verificar', limiterVerificar);
app.use('/api/essalud/receta/generar', limiterGenerar);
app.use('/api/essalud/receta/verificar', limiterVerificar);
app.use('/api/receta/verificar', limiterVerificar);
app.use('/api/receta/catalogo-atc', limiterVerificar);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/documentos/verificar',limiterVerificar);
app.use('/api/documentos',(req,res,next)=>req.method==='POST'?limiterGenerar(req,res,next):next(),documentosRouter);

app.use('/api', generarRouter);
app.use('/api', verificarRouter);
app.use('/api/receta', recetaRouter);
app.use('/api/essalud/citt-demo', essaludDemoRouter);
app.use('/api/essalud/certificado', essaludCertificadoRouter);
app.use('/api/essalud/receta', essaludRecetaRouter);
app.get('/receta/verificar', limiterVerificar, (_req, res) => {
  res.set('Cache-Control', 'no-store').set('Referrer-Policy', 'no-referrer')
    .set('X-Frame-Options', 'DENY').set('X-Content-Type-Options', 'nosniff')
    .set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
  res.sendFile(fileURLToPath(new URL('./public/receta-verificar.html', import.meta.url)));
});
app.get('/receta/verificador.js', (_req, res) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.sendFile(fileURLToPath(new URL('./public/receta-verificador.js', import.meta.url)));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});
