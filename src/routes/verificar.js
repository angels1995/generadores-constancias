import { Router } from 'express';
import { pool } from '../lib/db.js';
import { estaVigente } from '../lib/vigencia.js';

const router = Router();

router.get('/minsa/verificar/:autog', async (req, res) => {
  try {
    const { autog } = req.params;
    const { rows } = await pool.query(
      `select
        autog,
        hospital,
        paciente_nombre,
        paciente_dni,
        paciente_edad,
        to_char(fecha_atencion, 'YYYY-MM-DD') as fecha_atencion,
        to_char(descanso_inicio, 'YYYY-MM-DD') as descanso_inicio,
        to_char(descanso_fin, 'YYYY-MM-DD') as descanso_fin,
        descanso_dias,
        diagnostico,
        sintomas_json,
        to_char(valido_hasta, 'YYYY-MM-DD') as valido_hasta,
        created_at
      from constancias_minsa
      where autog = $1`,
      [autog]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    const registro = rows[0];
    res.json({
      ...registro,
      vigente: estaVigente(registro.valido_hasta)
    });
  } catch (err) {
    console.error('Error verificando MINSA:', err);
    res.status(500).json({ error: 'Error interno al verificar' });
  }
});

router.get('/citt/verificar/:autog', async (req, res) => {
  try {
    const { autog } = req.params;
    const { rows } = await pool.query(
      `select
        autog,
        hospital,
        paciente_nombre,
        paciente_dni,
        paciente_edad,
        to_char(fecha_atencion, 'YYYY-MM-DD') as fecha_atencion,
        to_char(descanso_inicio, 'YYYY-MM-DD') as descanso_inicio,
        to_char(descanso_fin, 'YYYY-MM-DD') as descanso_fin,
        descanso_dias,
        diagnostico,
        sintomas_json,
        to_char(valido_hasta, 'YYYY-MM-DD') as valido_hasta,
        created_at
      from constancias_citt
      where autog = $1`,
      [autog]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    const registro = rows[0];
    res.json({
      ...registro,
      vigente: estaVigente(registro.valido_hasta)
    });
  } catch (err) {
    console.error('Error verificando CITT:', err);
    res.status(500).json({ error: 'Error interno al verificar' });
  }
});

export default router;