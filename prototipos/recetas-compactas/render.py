"""Candidato local: recetas compactas MINSA/SIS y EsSalud, sin firma incorporada."""
import sys,json,base64
from io import BytesIO
from xml.sax.saxutils import escape
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,black
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.graphics.barcode import code128
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

W,H=595.92,842.88
L,R=30,565.5
FONTS=Path(__file__).resolve().parents[2]/'src/assets/fonts/liberation'
for name in ['LiberationSans-Regular','LiberationSans-Bold','LiberationMono-Bold']:
    pdfmetrics.registerFont(TTFont(name,str(FONTS/(name+'.ttf'))))
pdfmetrics.registerFontFamily('LiberationSans-Regular',normal='LiberationSans-Regular',bold='LiberationSans-Bold',
                             italic='LiberationSans-Regular',boldItalic='LiberationSans-Bold')
STYLE=ParagraphStyle('cell',fontName='LiberationSans-Regular',fontSize=8.25,leading=11)

def render(d,output):
    c=canvas.Canvas(output,pagesize=(W,H))
    c.setTitle('Receta compacta - '+('Registro del sistema' if d.get('modo')=='produccion' else 'muestra local sin validación'))
    c.setAuthor('Prototipo local')
    def label(x,y,s,size=8.25,bold=False,mono=False,right=False):
        c.setFont('LiberationMono-Bold' if mono else ('LiberationSans-Bold' if bold else 'LiberationSans-Regular'),size)
        (c.drawRightString if right else c.drawString)(x,H-y,str('' if s is None else s))
    def para(x,y,s,width,bold=False,mono=False):
        content=escape(str(s or ''))
        style=ParagraphStyle('mono',parent=STYLE,fontName='LiberationMono-Bold',fontSize=9) if mono else STYLE
        p=Paragraph('<b>'+content+'</b>' if bold and not mono else content,style)
        _,h=p.wrap(width,100)
        if h>11:raise ValueError('Cabecera demasiado larga; resumir.')
        p.drawOn(c,x,H-y-h)
    def date(s):return '/'.join(s.split('-')[::-1])
    def img(key,x,top,width,height):
        raw=d['recursos'].get(key)
        if raw:
            c.drawImage(ImageReader(BytesIO(base64.b64decode(raw,validate=True))),x,H-top-height,
                        width=width,height=height,preserveAspectRatio=True,anchor='c',mask='auto')
    rows=[['No.','CODIGO','DENOMINACION','DIAS','UM/FF','Cant.']]
    for i,m in enumerate(d['medicamentos'],1):
        name=' '.join(filter(None,[m['nombre'],m['concentracion']]))
        pauta=' - '.join(filter(None,[m['dosis'],m['via'],m['frecuencia'],m['indicaciones']]))
        description=Paragraph('<b><font size="9">'+escape(name)+'</font></b><br/><font size="7.5">Via Admin: '+escape(pauta)+'</font>',STYLE)
        rows.append([str(i),Paragraph(escape(m['codigo_producto']),STYLE),description,
                     str(m['dias']),Paragraph(escape(m['um_ff']),STYLE),str(m['cantidad'])])
    table=Table(rows,colWidths=[27,53,267.5,54,53,81],repeatRows=1)
    table.setStyle(TableStyle([
        ('FONTNAME',(0,0),(-1,-1),'LiberationSans-Regular'),
        ('FONTNAME',(0,0),(-1,0),'LiberationSans-Bold'),('FONTSIZE',(0,0),(-1,-1),8.25),
        ('BACKGROUND',(0,0),(-1,0),HexColor('#e5e5e5')),
        ('GRID',(0,0),(-1,-1),.6,black),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('ALIGN',(0,1),(0,-1),'CENTER'),('ALIGN',(3,1),(3,-1),'CENTER')]))
    pages=[]
    while True:
        _,h=table.wrap(R-L,370)
        if h<=370:pages.append(table);break
        parts=table.split(R-L,370)
        if len(parts)!=2 or len(parts[0]._cellvalues)<2:raise ValueError('Fila demasiado larga.')
        pages.append(parts[0]);table=parts[1]
    for n,part in enumerate(pages,1):
        c.setFillColor(HexColor('#555555'))
        label(R,15,('REGISTRO VERIFICADO EN EL SISTEMA' if d.get('modo')=='produccion' else 'MUESTRA LOCAL - PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL'),6,right=True)
        c.setFillColor(black)
        img('logo',L,22.5,75 if d['perfil']=='minsa' else 234,75)
        label(L,114,'No. DE ORDEN:',8.25,bold=True)
        label(112,114,d['numero_orden'] or '',9,mono=True)
        label(415,114,'FECHA EMISION:',8.25,bold=True)
        label(R,114,date(d['fecha_atencion']),9,mono=True,right=True)
        para(L,120,d['hospital'],300,mono=True)
        label(L,151,d['atencion'],9,mono=True)
        label(L,162,d['especialidad'],9,mono=True)
        barcode=code128.Code128(d['autog'],barHeight=27,barWidth=.65,humanReadable=False)
        c.saveState();c.translate(400,H-157);c.scale(165/barcode.width,1);barcode.drawOn(c,0,0);c.restoreState()
        for y,k,v in [(181,'ASEGU:',d['paciente_nombre']),(192,'AUTOG.:',d['autogenerado_paciente']),
                      (203,'ACT.MED:',d['acto_medico']),(214,'DOC.ID:',d['documento_id'] or 'D.N.I. '+d['paciente_dni'])]:
            label(L,y,k,8.25,bold=True);para(75,y-9,v,275,mono=True)
        age=d['edad_detallada'] or (str(d['paciente_edad'])+' años' if d['paciente_edad'] is not None else '')
        pharmacy='-'.join(filter(None,[d['farmacia_codigo'],d['farmacia_nombre']]))
        for y,k,v in [(181,'P.I.:',d['paciente_pi']),(192,'',pharmacy),(207,'EDAD:',age),
                      (219,'H/C:',d['historia_interna']),(230,'VIGENCIA:',date(d['valido_hasta']))]:
            label(365,y,k,8.25,bold=True)
            # Right-aligned values wrap instead of silently extending beyond the page.
            width=200 if not k else 159
            p=Paragraph(escape(str(v or '')),ParagraphStyle('right',parent=STYLE,alignment=2,fontName='LiberationMono-Bold',fontSize=9))
            _,ph=p.wrap(width,22)
            if ph>11:raise ValueError('Campo derecho demasiado largo; resumir.')
            p.drawOn(c,R-width,H-y-2)
        c.setLineWidth(1.3);c.line(L,H-237,R,H-237)
        _,th=part.wrap(R-L,370);part.drawOn(c,L,H-249-th)
        top=249+th+15
        qr=QrCodeWidget(d['verificador_url']);x0,y0,x1,y1=qr.getBounds()
        drawing=Drawing(75,75,transform=[75/(x1-x0),0,0,75/(y1-y0),0,0]);drawing.add(qr)
        renderPDF.draw(drawing,c,L,H-top-75)
        c.linkURL(d['verificador_url'],(L,H-top-75,L+75,H-top),relative=0)
        img('sello',330,top,85,80);img('firma',430.5,top,135,80)
        label(R,top+86,'Espacio para firma y sello autorizados',6,right=True)
        label(L,top+88,('Registro interno: ' if d.get('modo')=='produccion' else 'Código local de muestra: ')+d['autog'],6)
        label(L,730,'MEDICO:',8.25)
        physician='  '.join(filter(None,[d['medico_cmp'],d['medico_nombre']]))
        size=9
        while size>7 and pdfmetrics.stringWidth(physician,'LiberationMono-Bold',size)>R-70:
            size-=.25
        if pdfmetrics.stringWidth(physician,'LiberationMono-Bold',size)>R-70:
            raise ValueError('Nombre del médico demasiado largo.')
        label(70,730,physician,size,mono=True)
        c.setLineWidth(.6);c.line(L,H-741,R,H-741)
        label(L,754,'USUARIO:',7.5);label(73,754,d['usuario'],9,mono=True)
        label(250,754,'FEC.IMP:',7.5);label(292,754,d['fecha_impresion'],9,mono=True)
        label(491,754,'HORA:',7.5);label(R,754,d['hora_impresion'],9,mono=True,right=True)
        c.setFont('LiberationSans-Bold',7.5)
        c.drawCentredString(W/2,H-773,'TODA ENMENDADURA O DETERIORO INVALIDA LA RECETA')
        c.drawCentredString(W/2,H-787,'VÁLIDA HASTA: '+date(d['valido_hasta']))
        if d['aviso_atencion_usuario']:
            p=Paragraph(escape(d['aviso_atencion_usuario']),ParagraphStyle('notice',fontName='LiberationSans-Regular',fontSize=6.75,leading=8,alignment=1))
            _,ph=p.wrap(R-L,20)
            if ph>16:raise ValueError('Aviso demasiado largo.')
            p.drawOn(c,L,H-805-ph)
        label(R,833,f'Página {n} de {len(pages)}',6,right=True)
        c.showPage()
    c.save()

if __name__=='__main__':
    try:render(json.load(sys.stdin),sys.stdout.buffer)
    except ValueError:
        print('CONTENT_TOO_LONG',file=sys.stderr);sys.exit(2)
