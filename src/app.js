import express from 'express';
import cors from 'cors';
import generarRouter from './routes/generar.js';
import verificarRouter from './routes/verificar.js';

export const app = express();

const origenesPermitidos = process.env.ORIGIN_PERMITIDO
  ? process.env.ORIGIN_PERMITIDO.split(',').map((s) => s.trim())
  : '*';

app.use(cors({ origin: origenesPermitidos }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', generarRouter);
app.use('/api', verificarRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});
