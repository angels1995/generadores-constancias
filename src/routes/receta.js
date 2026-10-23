import { Router } from 'express';
import { generarReceta } from '../generadores/receta.js';
import { catalogoAtc } from '../lib/receta-atc.js';
import { pool } from '../lib/db.js';
import { hoyPeruISO } from '../lib/vigencia.js';

const router = Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store').set('Referrer-Policy', 'no-referrer').set('X-Content-Type-Options', 'nosniff');
  next();
});
router.post('/generar', async (req, res) => {
  try {
    res.json({ status: true, message: 'found', data: await generarReceta(req.body) });
  } catch (err) {
    // No exponer errores SQL, credenciales ni datos clínicos a los registros del servidor.
    const interno = !err.statusCode && (err.code || /Protocol error|Failed to launch|Navigation timeout/i.test(err.message));
    if (interno) console.error('Fallo interno del generador de recetas.');
    res.status(interno ? 500 : err.statusCode || 400).json({ status: false,
      message: interno ? 'No se pudo generar la receta.' : err.message, data: null });
  }
});
router.get('/catalogo-atc', (_req, res) => res.json({ status: true,
  referencia: 'Códigos aportados por el usuario, contrastados el 2026-10-22. No son indicaciones terapéuticas.',
  data: catalogoAtc }));
router.get('/verificar/:autog', async (req, res) => {
  if (!/^RECETA-[A-F0-9]{32}$/.test(req.params.autog)) return res.status(404).json({ status: false, message: 'Registro no encontrado.' });
  try {
    // La consulta pública no recupera nombres, diagnóstico, tratamientos ni el JSON completo.
    const { rows } = await pool.query(`SELECT autog, valido_hasta::text AS valido_hasta, created_at,
      jsonb_array_length(input_json->'medicamentos') AS medicamentos_total
      FROM recetas_minsa WHERE autog = $1`, [req.params.autog]);
    if (!rows.length) return res.status(404).json({ status: false, message: 'Registro no encontrado.' });
    const row = rows[0];
    res.json({ status: true, data: { ...row, estado: 'BORRADOR',
      dentro_del_plazo_declarado: hoyPeruISO() <= row.valido_hasta,
      aviso: 'Verifica el registro del sistema. No acredita firma, habilitación profesional ni emisión por MINSA.' } });
  } catch {
    res.status(503).json({ status: false, message: 'Verificador temporalmente no disponible.' });
  }
});
export default router;
