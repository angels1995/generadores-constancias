import { Router } from 'express';
import { generarMinsa } from '../generadores/minsa.js';
import { generarCitt } from '../generadores/citt.js';

const router = Router();

router.post('/minsa/generar', async (req, res) => {
  try {
    const resultado = await generarMinsa(req.body);
    res.json(resultado);
  } catch (err) {
    console.error('Error generando MINSA:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/citt/generar', async (req, res) => {
  try {
    const resultado = await generarCitt(req.body);
    res.json(resultado);
  } catch (err) {
    console.error('Error generando CITT:', err);
    res.status(400).json({ error: err.message });
  }
});

// Cuando estén listos:
// router.post('/receta/generar', ...)
// router.post('/certificado-essalud/generar', ...)

export default router;