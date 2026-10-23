import {Router} from 'express';
import {createHash} from 'node:crypto';
import {pool} from '../lib/db.js';
import {TIPOS_DOCUMENTO,prepararVersionado,pdfVersionado} from '../lib/documentos-versionados.js';
export function crearRouterDocumentos({db=pool,preparar=prepararVersionado,pdf=pdfVersionado}={}) {
  const r=Router();
  r.use((_req,res,next)=>{res.set('Cache-Control','no-store').set('Referrer-Policy','no-referrer').set('X-Content-Type-Options','nosniff');next();});
  r.post('/:tipo/generar',async(req,res)=>{
    if(!Object.hasOwn(TIPOS_DOCUMENTO,req.params.tipo))return res.status(404).json({status:false,message:'Tipo no encontrado.'});
    try{
      const d=await preparar(req.params.tipo,req.body);
      const pdf_base64=await pdf(d.tipo,d.render);
      const pdf_sha256=createHash('sha256').update(Buffer.from(pdf_base64,'base64')).digest('hex');
      try{await db.query('INSERT INTO documentos_pendientes (autog,tipo,pdf_sha256) VALUES ($1,$2,$3)',[d.autog,d.tipo,pdf_sha256]);}
      catch{return res.status(503).json({status:false,message:'Registro no disponible. No se entregó el PDF.'});}
      res.json({status:true,data:{estado:'PENDIENTE_FIRMA',autog:d.autog,tipo:d.tipo,registrado:true,
        verificador_url:d.verificador_url,pdf_sha256,input:d.input,pdf_base64,
        aviso:'Registro interno. Pendiente de validación y firma profesional; no acredita emisión institucional.'}});
    }catch(e){res.status(e.statusCode||400).json({status:false,message:e.statusCode?e.message:'No se pudo validar la solicitud.'});}
  });
  r.get('/verificar/:autog',async(req,res)=>{
    if(!/^DOC-[A-F0-9]{32}$/.test(req.params.autog))return res.status(404).json({status:false,message:'Registro no encontrado.'});
    try{
      const {rows}=await db.query('SELECT autog,tipo,estado,pdf_sha256,created_at FROM documentos_pendientes WHERE autog=$1',[req.params.autog]);
      if(!rows.length)return res.status(404).json({status:false,message:'Registro no encontrado.'});
      const {autog,tipo,estado,pdf_sha256,created_at}=rows[0];
      res.json({status:true,data:{autog,tipo,estado,pdf_sha256,created_at,
        aviso:'Registro interno pendiente de firma; no acredita atención, firma ni emisión institucional.'}});
    }catch{res.status(503).json({status:false,message:'Verificador no disponible.'});}
  });return r;
}
export default crearRouterDocumentos();
