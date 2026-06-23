import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import generarRouter from './routes/generar.js';
import verificarRouter from './routes/verificar.js';

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

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', generarRouter);
app.use('/api', verificarRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});