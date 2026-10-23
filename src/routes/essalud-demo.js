import { Router } from 'express';
import { prepararEssaludDemo, pdfEssaludDemo } from '../lib/essalud-demo.js';
import { createHash } from 'node:crypto';
import { pool } from '../lib/db.js';

export function crearRouterEssalud({db=pool, preparar=prepararEssaludDemo, pdf=pdfEssaludDemo}={}) {
const router = Router();
router.use((_req,res,next)=>{
  res.set('Cache-Control','no-store').set('Referrer-Policy','no-referrer').set('X-Content-Type-Options','nosniff');
  next();
});
router.post('/generar',async (req,res)=>{
  try {
    const data = await preparar(req.body);
    const pdf_base64 = await pdf(data.render);
    const pdf_sha256 = createHash('sha256').update(Buffer.from(pdf_base64,'base64')).digest('hex');
    try {
      await db.query('INSERT INTO essalud_documentos_pendientes (autog, pdf_sha256) VALUES ($1,$2)',[data.autog,pdf_sha256]);
    } catch {
      return res.status(503).json({status:false,message:'Registro interno temporalmente no disponible. No se entregó el PDF.',data:null});
    }
    res.json({status:true,message:'Documento operativo generado.',data:{
      estado:'OPERATIVO',autog:data.autog,registrado:true,verificador_url:data.verificador_url,pdf_sha256,
      descanso_inicio:data.inicio,total_dias:data.dias,input:data.input,pdf_base64,
      aviso:'Documento operativo en el sistema. El enlace verifica el registro interno; no acredita firma ni emisión por EsSalud.'
    }});
  } catch(error) {
    res.status(error.statusCode || 400).json({status:false,message:error.statusCode?error.message:'No se pudo validar la solicitud.',data:null});
  }
});
router.get('/verificar/:autog',async(req,res)=>{
  if(!/^ESSALUD-[A-F0-9]{32}$/.test(req.params.autog))return res.status(404).json({status:false,message:'Registro no encontrado.'});
  try {
    const {rows}=await db.query('SELECT autog, estado, pdf_sha256, created_at FROM essalud_documentos_pendientes WHERE autog = $1',[req.params.autog]);
    if(!rows.length)return res.status(404).json({status:false,message:'Registro no encontrado.'});
    const row=rows[0];
    res.json({status:true,data:{autog:row.autog,estado:row.estado,pdf_sha256:row.pdf_sha256,created_at:row.created_at,
      aviso:'Registro operativo del documento en el sistema. No acredita atención médica, firma ni emisión por EsSalud.'}});
  } catch {
    res.status(503).json({status:false,message:'Verificador temporalmente no disponible.'});
  }
});
return router;
}
export default crearRouterEssalud();
