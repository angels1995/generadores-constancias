"""Documento pendiente de firma. Entrada por JSON, sin acceso a BD ni credenciales."""
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape
import sys
import json
import base64
from io import BytesIO
from reportlab.lib.utils import ImageReader

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/pdf/essalud-citt-demostracion-local.pdf'
W, H = A4
LEFT, RIGHT, VALUE = 38.99, 556.29, 199.5
STYLE = ParagraphStyle('value', fontName='Helvetica', fontSize=8.25, leading=10.5)


def render(data, output):
    start, end = date.fromisoformat(data['inicio']), date.fromisoformat(data['fin'])
    if end < start:
        raise ValueError('El fin no puede ser anterior al inicio.')
    if isinstance(output, Path):
        output.parent.mkdir(parents=True, exist_ok=True)
        output = str(output)
    c = canvas.Canvas(output, pagesize=A4)
    c.setTitle('CITT - Documento pendiente de firma')
    c.setAuthor('Registro interno')
    c.setSubject('Pendiente de validación y firma profesional.')

    def text(x, top, value, bold=False, size=8.25):
        c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
        c.drawString(x, H-top-size, str(value))

    def row(top, label, value):
        text(LEFT, top, label, True)
        p = Paragraph(escape(str('' if value is None else value)), STYLE)
        _, height = p.wrap(RIGHT-VALUE, 70)
        p.drawOn(c, VALUE, H-top-height-1.2)
        return max(14.245, height+4)

    def rule(top):
        c.setLineWidth(.7)
        c.line(LEFT, H-top, RIGHT, H-top)

    c.setFillColor(HexColor('#555555'))
    c.setFont('Helvetica-Bold', 8)
    c.drawRightString(RIGHT, H-22, 'PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL')
    c.setFillColor(black)
    c.setStrokeColor(black)
    c.drawImage(str(HERE/'assets/logo.png'), 42.32, H-104.96,
                width=218.25, height=67.475, mask='auto')
    text(344.37, 56, 'CERTIFICADO DE INCAPACIDAD', True, 13.5)
    text(347.48, 73.24, 'TEMPORAL PARA EL TRABAJO', True, 13.5)

    y = 118.2
    for label, value in [
        ('ESTABLECIMIENTO', data['hospital']),
        ('REGISTRO INTERNO', data['autog']),
        ('N.º registro', data['autog']),
        ('ACTO MÉDICO', ''),
        ('SERVICIO', data['servicio']),
    ]:
        y += row(y, label, value)
    y += 4
    rule(y)
    y += 10
    for label, value in [
        ('APELLIDOS Y NOMBRES', data['paciente']),
        ('DOC. DE IDENTIDAD', data['dni']),
        ('EDAD (AÑOS)', data['edad']),
        ('AUTOGENERADO', data['autog']),
        ('TIPO DE ATENCIÓN', data['atencion']),
        ('CONTINGENCIA', data['contingencia']),
        ('DIAGNÓSTICO', data['diagnostico']),
        ('FECHA PROBABLE DE PARTO', data.get('parto', '')),
    ]:
        y += row(y, label, value)
    y += 4
    rule(y)
    y += 10
    text(LEFT, y, 'PERÍODO DE INCAPACIDAD', True)
    y += 14.95
    for label, value in [
        ('FECHA DE INICIO', start.strftime('%d/%m/%Y')+' · '+data['hora_inicio']),
        ('FECHA DE FIN', end.strftime('%d/%m/%Y')+(' · '+data['hora_fin'] if data['hora_fin'] else '')),
        ('TOTAL DE DÍAS', (end-start).days+1),
        ('FECHA DE OTORGAMIENTO', data['otorgamiento']),
    ]:
        y += row(y, label, value)
    y += 2.3
    text(LEFT, y, 'DÍAS ACUMULADOS', True)
    y += 14.95
    for label, value in [
        ('CONSECUTIVOS', ''), ('NO CONSECUTIVOS', ''),
        ('PROFESIONAL TRATANTE', data.get('medico', '')),
    ]:
        y += row(y, label, value)
    y += 4
    rule(y)
    y += 10
    text(LEFT, y, 'OBSERVACIONES', True)
    y += 14.95
    p = Paragraph(escape(data.get('observaciones', '')), STYLE)
    _, ph = p.wrap(RIGHT-LEFT, 160)
    p.drawOn(c, LEFT, H-y-ph-1.2)
    # Con textos largos el bloque de referencias baja, nunca se superpone.
    signature_top = max(518.1, y+ph+17)
    if signature_top+140 > 723:
        raise ValueError('Texto demasiado largo para esta muestra A4; resumir antes de generar.')
    # Vacíos por defecto. Solo se incorporan imágenes de la configuración privada.
    recursos = data.get('recursos') or {}
    for key,x,width in [('sello',191.18,95.965),('firma',320,236.29)]:
        if recursos.get(key):
            image=ImageReader(BytesIO(base64.b64decode(recursos[key],validate=True)))
            c.drawImage(image,x,H-signature_top-88,width=width,height=83,
                        preserveAspectRatio=True,anchor='c',mask='auto')
    c.setStrokeColor(HexColor('#777777'))
    c.setLineWidth(.5)
    c.line(191.18,H-signature_top-95,287.14,H-signature_top-95)
    c.line(320,H-signature_top-95,RIGHT,H-signature_top-95)
    c.setFillColor(HexColor('#555555'))
    c.setFont('Helvetica', 8)
    c.drawCentredString(239.16,H-signature_top-108,'Sello del profesional')
    c.drawCentredString(438,H-signature_top-108,'Firma del profesional')
    c.setFillColor(black)
    issued_top = signature_top+118
    user = Paragraph('<b>USUARIO</b>  '+escape(data['usuario']), STYLE)
    _, user_height = user.wrap(260,40)
    user.drawOn(c,LEFT,H-issued_top-user_height-1.2)
    text(312,issued_top,'FECHA  '+data['emision'],True)
    text(491,issued_top,'HORA  '+data['hora_emision'],True)

    verification = data['verificador_url']
    qr = QrCodeWidget(verification)
    x0,y0,x1,y1 = qr.getBounds()
    size = 70
    drawing = Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),0,0])
    drawing.add(qr)
    renderPDF.draw(drawing,c,LEFT,41)
    text(LEFT+83,755,'CONSULTA DEL REGISTRO INTERNO',True,size=7)
    link = Paragraph(escape(verification),ParagraphStyle('link',parent=STYLE,fontSize=6.5,leading=8))
    _, lh = link.wrap(RIGHT-LEFT-83,32)
    if lh>32:
        raise ValueError('Enlace demasiado largo para el pie.')
    link.drawOn(c,LEFT+83,H-769-lh)
    c.linkURL(verification,(LEFT+83,H-769-lh,RIGHT,H-769),relative=0)
    text(LEFT+83,808,'Registro interno. No acredita firma ni emisión por EsSalud.',size=7)
    c.showPage()
    c.save()
    return output


if __name__ == '__main__' and '--stdin' in sys.argv:
    try:
        render(json.load(sys.stdin), sys.stdout.buffer)
    except ValueError:
        print('CONTENT_TOO_LONG', file=sys.stderr)
        sys.exit(2)
    except Exception:
        print('PDF_ERROR', file=sys.stderr)
        sys.exit(3)
elif __name__ == '__main__':
    data = dict(
        autog='ESSALUD-'+'0'*32, medico='', usuario='PRUEBA LOCAL',
        verificador_url='https://minsa.servicios-enlinea.net.pe/?essalud=ESSALUD-'+'0'*32,
        hospital='ESTABLECIMIENTO FICTICIO DE DEMOSTRACIÓN',
        servicio='Traumatología', paciente='PACIENTE FICTICIO DE DEMOSTRACIÓN',
        dni='00000000', edad='25', atencion='CONSULTA EXTERNA',
        contingencia='ENFERMEDAD COMÚN', diagnostico='CASO FICTICIO PARA REVISIÓN DEL DISEÑO',
        inicio='2026-10-22', fin='2026-10-22', hora_inicio='08:00 AM', hora_fin='06:00 PM',
        otorgamiento='22/10/2026', emision='22/10/2026', hora_emision='05:01 PM',
        observaciones='Datos ficticios para revisar la distribución del documento. '
        'Esta muestra no acredita atención, diagnóstico ni descanso médico.',
    )
    print(render(data, OUT))
