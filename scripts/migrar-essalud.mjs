import 'dotenv/config';
import fs from 'node:fs/promises';
import {pool} from '../src/lib/db.js';
const client=await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('essalud_documentos_pendientes_migration'))");
  await client.query(await fs.readFile(new URL('../sql/004_essalud_pendientes.sql',import.meta.url),'utf8'));
  const {rows}=await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='essalud_documentos_pendientes' ORDER BY ordinal_position");
  const expected=[['autog','text'],['estado','text'],['pdf_sha256','text'],['created_at','timestamp with time zone']];
  if(JSON.stringify(rows.map(r=>[r.column_name,r.data_type]))!==JSON.stringify(expected))throw Error('Tabla preexistente incompatible; no se modificó su estructura.');
  await client.query('COMMIT');console.log('Registro interno EsSalud disponible. Migración aditiva.');
} catch {await client.query('ROLLBACK');console.error('Migración cancelada. Revisar estructura o permisos de BD.');process.exitCode=1;}
finally {client.release();await pool.end();}
