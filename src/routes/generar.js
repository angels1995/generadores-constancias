import { Router } from "express";
import { generarMinsa } from "../generadores/minsa.js";
import { generarCitt } from "../generadores/citt.js";

const router = Router();

router.post("/minsa/generar", async (req, res) => {
  try {
    const resultado = await generarMinsa(req.body);
    res.json({
      status: true,
      message: "found",
      data: {
        autog: resultado.autog,
        valido_hasta: resultado.valido_hasta,
        verificador_url: `${process.env.VERIFICADOR_URL_BASE}?citt=${resultado.autog}`,
        input: req.body,
        pdf_base64: resultado.pdf_base64,
      },
    });
  } catch (err) {
    console.error("Error generando MINSA:", err);
    res.status(400).json({
      status: false,
      message: err.message,
      data: null,
    });
  }
});

router.post("/citt/generar", async (req, res) => {
  try {
    const resultado = await generarCitt(req.body);
    res.json({
      status: true,
      message: "found",
      data: {
        autog: resultado.autog,
        valido_hasta: resultado.valido_hasta,
        verificador_url: `${process.env.VERIFICADOR_URL_BASE}?minsa=${resultado.autog}`,
        input: req.body,
        pdf_base64: resultado.pdf_base64,
      },
    });
  } catch (err) {
    console.error("Error generando CITT:", err);
    res.status(400).json({
      status: false,
      message: err.message,
      data: null,
    });
  }
});

// Cuando estén listos:
// router.post('/receta/generar', ...)
// router.post('/certificado-essalud/generar', ...)

export default router;
