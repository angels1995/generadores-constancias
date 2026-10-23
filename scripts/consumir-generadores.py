"""Consume una ruta del panel y guarda su PDF. Solo biblioteca estándar de Python."""
import argparse,base64,getpass,hashlib,json,os,sys
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

def mensaje_error_http(exc,token):
    """Muestra el motivo de rechazo sin volcar el cuerpo ni las credenciales."""
    raw=exc.read(8192).decode('utf-8',errors='replace')
    def detail(value):
        if isinstance(value,str):return value.strip()
        if isinstance(value,dict):
            for key in ['message','error','detail','mensaje','reason','data','errors']:
                result=detail(value.get(key))
                if result:return result
        if isinstance(value,list):return '; '.join(filter(None,(detail(v) for v in value)))
        return ''
    try:
        payload=json.loads(raw)
        message=detail(payload) or 'La respuesta JSON no incluye un motivo reconocible.'
        if isinstance(payload,dict) and isinstance(payload.get('code'),str):message+=' ['+payload['code']+']'
    except ValueError:
        message='Respuesta no JSON; el rechazo puede venir del proxy o de Cloudflare.'
    if token:message=message.replace(token,'[TOKEN OCULTO]')
    ray=exc.headers.get('CF-Ray') if exc.headers else None
    return f'HTTP {exc.code}: '+message[:700]+(' (CF-Ray: '+ray+')' if ray else '')

def main():
    root=Path(__file__).resolve().parents[1]
    routes=json.loads((root/'docs/rutas-publicacion.json').read_text(encoding='utf-8'))
    by_slug={r['slug']:r for r in routes}
    parser=argparse.ArgumentParser(description='Genera un documento pendiente y guarda su PDF desde el panel Sinflower.')
    parser.add_argument('ruta',choices=sorted(by_slug))
    parser.add_argument('--payload',type=Path,help='JSON propio; por defecto usa el ejemplo ficticio incluido.')
    parser.add_argument('--salida',type=Path,help='Archivo PDF de salida.')
    args=parser.parse_args()
    token=os.environ.get('SINFLOWER_API_TOKEN') or getpass.getpass('Token del panel (oculto): ')
    if not token.strip():raise ValueError('Falta el token del panel.')
    route=by_slug[args.ruta]
    payload_path=args.payload or root/'docs/payloads-publicacion'/route['payloadFile']
    payload=json.loads(payload_path.read_text(encoding='utf-8-sig'))
    req=Request(route['url'],data=json.dumps(payload).encode('utf-8'),method='POST',
        headers={'Authorization':'Bearer '+token.strip(),'Content-Type':'application/json','Accept':'application/json',
                 'User-Agent':'generadores-constancias/1.0'})
    try:
        with urlopen(req,timeout=90) as response:
            result=json.load(response)
    except HTTPError as exc:
        raise RuntimeError(mensaje_error_http(exc,token.strip())) from None
    except URLError as exc:raise RuntimeError('No se pudo conectar con el panel.') from exc
    data=result.get('data') or {}
    if result.get('status') is not True or not data.get('pdf_base64'):raise RuntimeError('La API no devolvió un PDF; no se guardó archivo.')
    pdf=base64.b64decode(data['pdf_base64'],validate=True)
    if not pdf.startswith(b'%PDF-'):raise RuntimeError('El contenido devuelto no es PDF.')
    if data.get('pdf_sha256') and hashlib.sha256(pdf).hexdigest()!=data['pdf_sha256']:raise RuntimeError('La huella SHA-256 no coincide.')
    target=args.salida or Path(args.ruta+'-'+str(data.get('autog','documento'))+'.pdf')
    target.parent.mkdir(parents=True,exist_ok=True)
    with target.open('xb') as stream:stream.write(pdf)
    print('PDF guardado:',target.resolve())
    print('Código:',data.get('autog',''))
    print('Estado:',data.get('estado','BORRADOR'))
    print('Verificación:',data.get('verificador_url',''))
    print('El registro no acredita firma ni emisión institucional.')

if __name__=='__main__':
    try:main()
    except (ValueError,RuntimeError,OSError) as exc:
        print('Error:',str(exc),file=sys.stderr);sys.exit(1)
