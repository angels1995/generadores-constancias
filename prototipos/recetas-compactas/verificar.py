"""Prueba de paginación y ausencia de firmas copiadas, sin red ni BD."""
import json,subprocess,sys
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[2]
for profile in ['minsa','essalud']:
    data=json.loads((ROOT/f'tmp/pdfs/recetas-compactas/{profile}.json').read_text())
    for count in [1,9,30]:
        case=dict(data)
        case['medico_nombre']='PROFESIONAL DE PRUEBA'
        case['medicamentos']=[dict(data['medicamentos'][0],nombre=f'PRODUCTO FICTICIO {i+1:02d}') for i in range(count)]
        result=subprocess.run([sys.executable,str(Path(__file__).with_name('render.py'))],
                              input=json.dumps(case).encode(),capture_output=True,check=True,timeout=15)
        path=ROOT/f'tmp/pdfs/recetas-compactas/{profile}-{count}.pdf'
        path.write_bytes(result.stdout)
        doc=pymupdf.open(stream=result.stdout,filetype='pdf')
        text=''.join(p.get_text() for p in doc)
        for i in range(count):assert f'PRODUCTO FICTICIO {i+1:02d}' in text
        assert 'CALLE PEÑA' not in text
        for page in doc:
            assert 'PENDIENTE DE VALIDACIÓN' in page.get_text()
            assert len(page.get_images())==1,'Solo logo raster; QR y barras vectoriales, sin firma/sello'
            assert any(link.get('uri')==case['verificador_url'] for link in page.get_links())
            for word in page.get_text('words'):
                assert 0<=word[0]<word[2]<=596 and 0<=word[1]<word[3]<=843
            spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans']]
            assert all(s['font'].startswith('Liberation') for s in spans)
            doctor=next(s for s in spans if s['text']=='PROFESIONAL DE PRUEBA')
            assert doctor['font']=='LiberationMono-Bold' and doctor['size']==9
            assert abs(doctor['origin'][0]-70)<.01 and abs(doctor['origin'][1]-730)<.01
        print(f'{profile}: {count} productos, {len(doc)} páginas, contenido completo y QR coherente')
