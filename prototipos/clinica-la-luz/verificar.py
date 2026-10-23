"""PDF reales con datos ficticios. Sin conexión de red ni BD."""
import json,subprocess,sys
from pathlib import Path
import pymupdf
ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT/'tmp/pdfs/clinica-la-luz'
def render(data,name):
    result=subprocess.run([sys.executable,str(Path(__file__).with_name('render.py'))],
        input=json.dumps(data).encode(),capture_output=True,check=True,timeout=15)
    (TMP/(name+'.pdf')).write_bytes(result.stdout)
    return pymupdf.open(stream=result.stdout,filetype='pdf')
def common(doc,data):
    for page in doc:
        text=page.get_text()
        assert 'PENDIENTE DE VALIDACIÓN' in text
        assert data['autog'] in text
        assert 'ZENON' not in text and 'CERVERA' not in text
        assert any(link.get('uri')==data['verificador_url'] for link in page.get_links())
        for word in page.get_text('words'):
            assert 0<=word[0]<word[2]<=596 and 0<=word[1]<word[3]<=842
for tipo in ['certificado','descanso','receta']:
    data=json.loads((TMP/(tipo+'.json')).read_text())
    data.update(medico_nombre='PROFESIONAL DE PRUEBA',medico_especialidad='SERVICIO DE PRUEBA')
    doc=render(data,tipo+'-medico')
    common(doc,data)
    assert 'PROFESIONAL DE PRUEBA' in doc[0].get_text()
    assert len(doc)==1
    # Reutilizar logo como imagen neutra prueba el ajuste sin una firma ficticia.
    image_case=dict(data,recursos={**data['recursos'],'firma':data['recursos']['logo'],'sello':data['recursos']['logo']})
    common(render(image_case,tipo+'-ajuste-neutro'),image_case)
    if tipo=='receta':
        for count in [1,9,30]:
            case=dict(data,medicamentos=[dict(data['medicamentos'][0],nombre=f'PRODUCTO FICTICIO {i+1:02d}') for i in range(count)])
            doc=render(case,f'receta-{count}')
            common(doc,case)
            all_text=' '.join(' '.join(p.get_text() for p in doc).split())
            for i in range(count):assert all_text.count(f'PRODUCTO FICTICIO {i+1:02d}')==2,'Falta fila en una de las columnas'
            print(f'receta: {count} productos completos en ambas columnas, {len(doc)} páginas')
    else:
        case=dict(data,diagnostico='CONTENIDO EXTENSO '*35,observaciones='OBSERVACIÓN '*85)
        result=subprocess.run([sys.executable,str(Path(__file__).with_name('render.py'))],input=json.dumps(case).encode(),capture_output=True)
        assert result.returncode==2 and b'CONTENT_TOO_LONG' in result.stderr
        print(tipo+': página completa; rechaza exceso sin entregar PDF recortado')
