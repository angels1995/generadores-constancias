import 'dotenv/config';
import fs from 'node:fs/promises';
import {pool} from '../src/lib/db.js';
const c=await pool.connect();
try{
  await c.query('BEGIN');await c.query("SELECT pg_advisory_xact_lock(hashtext('documentos_pendientes_migration'))");
  await c.query(await fs.readFile(new URL('../sql/005_documentos_pendientes.sql',import.meta.url),'utf8'));
  const {rows}=await c.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='documentos_pendientes' ORDER BY ordinal_position");
  const expected=[['autog','text'],['tipo','text'],['estado','text'],['pdf_sha256','text'],['created_at','timestamp with time zone']];
  if(JSON.stringify(rows.map(r=>[r.column_name,r.data_type]))!==JSON.stringify(expected))throw Error('Esquema incompatible.');
  await c.query('COMMIT');console.log('Registro genérico pendiente disponible; sin datos clínicos.');
}catch{await c.query('ROLLBACK');console.error('Migración cancelada; revisar esquema/permisos.');process.exitCode=1;}
finally{c.release();await pool.end();}
