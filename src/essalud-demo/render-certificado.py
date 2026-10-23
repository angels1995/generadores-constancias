"""Certificado narrativo A4: datos declarados, pendiente de firma profesional."""
import sys
import json
import base64
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics import renderPDF

W,H=A4
LEFT,RIGHT=44.98,550.30
BODY=ParagraphStyle('body',fontName='Times-Roman',fontSize=12,leading=18.5,alignment=4)

def render(data,output):
    c=canvas.Canvas(output,pagesize=A4)
    c.setTitle('Certificado médico - Pendiente de firma')
    c.setAuthor('Registro interno')
    c.setSubject('Documento pendiente de validación y firma profesional.')
    c.setFont('Helvetica',7)
    c.setFillColor(HexColor('#555555'))
    c.drawRightString(RIGHT,H-14,'PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL')
    c.setFillColor(black)
    resources=data.get('recursos') or {}
    if resources.get('logo'):
        logo=ImageReader(BytesIO(base64.b64decode(resources['logo'],validate=True)))
        for x in [64.5,424.5]:
            c.drawImage(logo,x,H-57,width=107,height=33,preserveAspectRatio=True,anchor='c',mask='auto')

    def para(value,top,bold=False,width=RIGHT-LEFT,left=LEFT):
        style=ParagraphStyle('p',parent=BODY,fontName='Times-Bold' if bold else 'Times-Roman')
        p=Paragraph(value,style)
        _,height=p.wrap(width,700)
        p.drawOn(c,left,H-top-height)
        return top+height

    if data.get('lema'):
        motto=ParagraphStyle('motto',fontName='Times-BoldItalic',fontSize=11.25,leading=14,alignment=1)
        p=Paragraph(escape(data['lema']),motto)
        _,height=p.wrap(RIGHT-LEFT,38)
        if height>38:
            raise ValueError('Lema demasiado largo.')
        p.drawOn(c,LEFT,H-93-height)

    doctor=escape(data.get('medico') or '________________________')
    specialty=escape(data.get('especialidad') or '____________________')
    hospital=escape(data.get('hospital') or '____________________')
    y=para(f'El suscrito, Médico Cirujano, con especialidad en {specialty}, <b>{doctor}</b>, '
           f'cuyos registros profesionales constan en el bloque de firma, de la institución prestadora '
           f'de servicios de salud <b>{hospital}</b>.',132)
    title_top=max(209,y+26)
    c.setFont('Times-Bold',13.5)
    title='CERTIFICADO MÉDICO'
    title_width=c.stringWidth(title,'Times-Bold',13.5)
    c.drawCentredString(W/2,H-title_top-13.5,title)
    c.setLineWidth(.6)
    c.line((W-title_width)/2,H-title_top-15,(W+title_width)/2,H-title_top-15)
    y=para('<u>Certifica que:</u>',title_top+43)

    age='' if data['edad']=='' else f", de {escape(str(data['edad']))} años"
    y=para(f"En la fecha, {escape(data['fecha_atencion'])}, a las {escape(data['hora_atencion'])}, "
           f"se revisó al paciente <b>{escape(data['paciente'])}</b>{age}, quien presenta el diagnóstico "
           f"de: <b>{escape(data['diagnostico'])}</b>.",y+20)
    end=f"hasta el día {escape(data['fin'])}"
    if data.get('hora_fin'):
        end+=f" a las {escape(data['hora_fin'])}"
    days=f"{data['dias']} día"+('s' if data['dias']!=1 else '')
    y=para(f"Se indica descanso médico desde el día <b>{escape(data['inicio'])} a las "
           f"{escape(data['hora_inicio'])}</b> <b>{end}</b>, por un total de {days}.",y+14)
    if data.get('recomendaciones'):
        recommendation=escape(data['recomendaciones']).replace('\n','<br/>')
        y=para(recommendation,y+20,bold=True)
    district=escape(data.get('distrito') or '________________________')
    y=para('Se expide el presente certificado a solicitud del interesado, en el distrito de '
           f"<b>{district}</b>, el día {escape(data['fecha_expedicion'])}.",y+20)
    signature_top=max(535,y+52)
    if signature_top+104>706:
        raise ValueError('El contenido excede una página. Resume los campos.')
    c.setFont('Times-Roman',12)
    c.drawString(299,H-signature_top+12,'Atte.')
    for key,x,width in [('sello',177.68,86.22),('firma',280.4,236.16)]:
        if resources.get(key):
            image=ImageReader(BytesIO(base64.b64decode(resources[key],validate=True)))
            c.drawImage(image,x,H-signature_top-81,width=width,height=76,
                        preserveAspectRatio=True,anchor='c',mask='auto')
        c.setLineWidth(.5)
        c.line(x,H-signature_top-86,x+width,H-signature_top-86)
    c.setFont('Times-Roman',9)
    c.drawCentredString(220.79,H-signature_top-99,'Sello del profesional')
    c.drawCentredString(398.48,H-signature_top-99,'Firma del profesional')
    if data.get('cmp') or data.get('rne'):
        c.setFont('Times-Roman',8)
        c.drawCentredString(398.48,H-signature_top-112,
                           f"CMP: {data.get('cmp','')}   RNE: {data.get('rne','')}")
    verification=data['verificador_url']
    qr=QrCodeWidget(verification)
    x0,y0,x1,y1=qr.getBounds()
    size=70
    drawing=Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),0,0])
    drawing.add(qr)
    renderPDF.draw(drawing,c,LEFT,42)
    style=ParagraphStyle('footer',fontName='Helvetica',fontSize=6.5,leading=9)
    footer=Paragraph('<b>CONSULTA DEL REGISTRO INTERNO</b><br/>'+escape(verification)+
                     '<br/>No acredita firma ni emisión por EsSalud.',style)
    _,height=footer.wrap(RIGHT-LEFT-85,45)
    if height>45:
        raise ValueError('Enlace demasiado largo.')
    footer.drawOn(c,LEFT+85,49)
    c.linkURL(verification,(LEFT+85,49,RIGHT,49+height),relative=0)
    c.setFont('Helvetica',6.5)
    c.setFillColor(HexColor('#555555'))
    c.drawRightString(RIGHT,23,f"Registro: {data['autog']} · Emisión: {data['emision']} {data['hora_emision']}")
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
