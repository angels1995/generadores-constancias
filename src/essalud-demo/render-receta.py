"""Receta EsSalud A4 con tabla paginada y recursos configurables."""
import sys
import json
import base64
from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor,white,black
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics import renderPDF

W,H=A4
LEFT,RIGHT=38.99,556.29
BLUE=HexColor('#00649d')
TEXT=ParagraphStyle('cell',fontName='Helvetica',fontSize=8,leading=11)

def render(data,output):
    c=canvas.Canvas(output,pagesize=A4)
    c.setTitle('Receta EsSalud - Pendiente de firma')
    c.setAuthor('Registro interno')
    resources=data.get('recursos') or {}

    def text(x,top,value,bold=False,size=8.25):
        c.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
        c.drawString(x,H-top-size,str(value))

    def height_of(content,width):
        p=Paragraph(escape(str('' if content is None else content)),TEXT)
        _,height=p.wrap(width,44)
        if height>44:
            raise ValueError('Campo de cabecera demasiado largo.')
        return height

    def value(x,top,content,width):
        p=Paragraph(escape(str('' if content is None else content)),TEXT)
        _,height=p.wrap(width,44)
        p.drawOn(c,x,H-top-height)

    header=[('ESTABLECIMIENTO',data['hospital']),('ATENCIÓN',data.get('atencion','')),
            ('SERVICIO',data.get('especialidad','')),('ORDEN',data['numero_orden']),
            ('FECHA DE EMISIÓN',data['emision'])]
    header_tops=[]
    pos=143
    for label,content in header:
        header_tops.append(pos)
        pos+=max(17,height_of(content,RIGHT-199.5)+5)
    divider=pos+4
    left=[('ASEGURADO',data['paciente_nombre']),('AUTOGENERADO',data.get('autogenerado_paciente','')),
          ('ACTO MÉDICO',data.get('acto_medico','')),('DOC. ID',data.get('documento_id','')),('DNI',data['paciente_dni'])]
    right=[('P.I.',data.get('paciente_pi','')),('EDAD',data.get('paciente_edad','')),
           ('H. C.',data.get('historia_interna','')),('VIGENCIA',data['vigencia'])]
    patient_tops=[]
    pos=divider+20
    for n,(_,content) in enumerate(left):
        patient_tops.append(pos)
        lh=height_of(content,195)
        rh=height_of(right[n][1],135) if n<len(right) else 0
        pos+=max(18.8,max(lh,rh)+5)
    table_top=pos+9
    available=180-max(0,table_top-355)
    if available<70:
        raise ValueError('Cabecera demasiado larga.')

    table_data=[['N.º','CÓDIGO','DENOMINACIÓN','DÍAS','UM / FF','CANT.']]
    for n,m in enumerate(data['medicamentos'],1):
        name=' '.join(filter(None,[m['nombre'],m.get('concentracion','')]))
        instruction=' · '.join(filter(None,[m['dosis'],m['via'],m['frecuencia']]))
        description=f'<b>{escape(name)}</b><br/><font size="7">{escape(instruction)}</font>'
        if m.get('indicaciones'):
            description+='<br/>'+escape(m['indicaciones'])
        table_data.append([str(n),m.get('atc_codigo',''),Paragraph(description,TEXT),str(m['dias']),
                           Paragraph(escape(m.get('um_ff','')),TEXT),str(m['cantidad'])])
    table=Table(table_data,colWidths=[26,52,294,42,56,47.3],repeatRows=1,minRowHeights=[25]*len(table_data))
    table.setStyle(TableStyle([
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,0),7.5),
        ('BACKGROUND',(0,0),(-1,0),BLUE),('TEXTCOLOR',(0,0),(-1,0),white),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,1),(-1,-1),8),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(1,-1),'CENTER'),
        ('ALIGN',(3,0),(-1,-1),'CENTER'),('GRID',(0,0),(-1,-1),.5,HexColor('#444444')),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
        ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)
    ]))
    pages=[]
    remaining=table
    while remaining:
        _,height=remaining.wrap(RIGHT-LEFT,available)
        if height<=available:
            pages.append(remaining)
            break
        parts=remaining.split(RIGHT-LEFT,available)
        if len(parts)<2 or len(parts[0]._cellvalues)<2:
            raise ValueError('Una fila excede el espacio disponible.')
        pages.append(parts[0])
        remaining=parts[1]

    for page_no,part in enumerate(pages,1):
        c.setFillColor(HexColor('#555555'))
        c.setFont('Helvetica',7)
        c.drawRightString(RIGHT,H-19,'PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL')
        if resources.get('logo'):
            logo=ImageReader(BytesIO(base64.b64decode(resources['logo'],validate=True)))
            c.drawImage(logo,40.17,H-108.71,width=230.05,height=71.22,
                        preserveAspectRatio=True,anchor='c',mask='auto')
        c.setFillColor(BLUE)
        c.setFont('Helvetica-Bold',18)
        c.drawRightString(RIGHT,H-78,'RECETA MÉDICA')
        c.setStrokeColor(BLUE)
        c.setLineWidth(2)
        c.line(LEFT,H-126,RIGHT,H-126)
        c.setFillColor(black)
        for n,(label,content) in enumerate(header):
            top=header_tops[n]
            text(LEFT,top,label,True)
            value(199.5,top,content,RIGHT-199.5)
        c.setLineWidth(.7)
        c.setStrokeColor(black)
        c.line(LEFT,H-divider,RIGHT,H-divider)
        for n,(label,content) in enumerate(left):
            top=patient_tops[n]
            text(LEFT,top,label,True)
            value(125,top,content,195)
            if n<len(right):
                rlabel,rcontent=right[n]
                text(335,top,rlabel,True)
                value(421,top,rcontent,135)
        _,table_height=part.wrap(RIGHT-LEFT,available)
        part.drawOn(c,LEFT,H-table_top-table_height)
        signature_top=max(440.88,table_top+table_height+22)
        for key,x,width in [('sello',191.18,95.96),('firma',320,236.29)]:
            if resources.get(key):
                image=ImageReader(BytesIO(base64.b64decode(resources[key],validate=True)))
                c.drawImage(image,x,H-signature_top-78,width=width,height=73,
                            preserveAspectRatio=True,anchor='c',mask='auto')
            c.setLineWidth(.5)
            c.line(x,H-signature_top-84,x+width,H-signature_top-84)
        c.setFont('Helvetica',7.5)
        c.drawCentredString(239.16,H-signature_top-96,'Sello del profesional')
        c.drawCentredString(438,H-signature_top-96,'Firma del profesional')
        c.setFont('Helvetica-Bold',8)
        c.drawCentredString(W/2,H-signature_top-116,'TODA ENMENDADURA O DETERIORO INVALIDA LA RECETA')
        issued=signature_top+135
        if issued>714:
            raise ValueError('Texto demasiado largo para una página.')
        text(LEFT,issued,'USUARIO',True)
        value(82,issued,data.get('usuario',''),270)
        c.setFont('Helvetica',8)
        c.drawRightString(RIGHT,H-issued-8,'EMISIÓN  '+data['hora_emision'])
        verification=data['verificador_url']
        qr=QrCodeWidget(verification)
        x0,y0,x1,y1=qr.getBounds()
        side=70
        drawing=Drawing(side,side,transform=[side/(x1-x0),0,0,side/(y1-y0),0,0])
        drawing.add(qr)
        renderPDF.draw(drawing,c,LEFT,42)
        footer=Paragraph('<b>REGISTRO INTERNO</b><br/>'+escape(verification)+
                         '<br/>No acredita firma ni emisión por EsSalud. Código ATC cuando existe coincidencia.',
                         ParagraphStyle('footer',fontName='Helvetica',fontSize=6.5,leading=9))
        _,fh=footer.wrap(RIGHT-LEFT-85,45)
        if fh>45:
            raise ValueError('Enlace demasiado largo.')
        footer.drawOn(c,LEFT+85,49)
        c.linkURL(verification,(LEFT+85,49,RIGHT,49+fh),relative=0)
        c.setFont('Helvetica',7)
        c.drawRightString(RIGHT,23,f'Página {page_no} de {len(pages)}')
        c.showPage()
    c.save()

if __name__=='__main__':
    try:
        render(json.load(sys.stdin),sys.stdout.buffer)
    except ValueError:
        print('CONTENT_TOO_LONG',file=sys.stderr)
        sys.exit(2)
    except Exception:
        print('PDF_ERROR',file=sys.stderr)
        sys.exit(3)
