"""Tres candidatos locales de Clínica La Luz. Recursos propios configurables."""
import sys,json,base64
from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor,black
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

W,H=595.28,841.89
L,R=39,556.28
BLUE=HexColor('#226da9')
MONTHS=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
def esc(v):return escape(str('' if v is None else v)).replace('\n','<br/>')
def date(v):return '/'.join(v.split('-')[::-1]) if v else ''
def time(v):
    if not v:return ''
    h,m=map(int,v.split(':'))
    return f'{h%12 or 12:02d}:{m:02d} '+('PM' if h>=12 else 'AM')
def long_date(v):
    y,m,d=v.split('-')
    return f'{int(d)} DE {MONTHS[int(m)-1]} DE {y}'

class Document:
    def __init__(self,d,out):
        self.d=d;self.c=canvas.Canvas(out,pagesize=(W,H))
        self.c.setTitle('Clínica La Luz - '+d['tipo']+(' - Registro del sistema' if d.get('modo')=='produccion' else ' - muestra local pendiente de firma'))
        self.c.setAuthor('Prototipo local')
    def text(self,x,y,s,size=10,bold=False,align='left',width=None):
        s=str(s or '');font='Helvetica-Bold' if bold else 'Helvetica'
        if width:
            while size>6 and stringWidth(s,font,size)>width:size-=.25
            if stringWidth(s,font,size)>width:raise ValueError('Texto demasiado largo.')
        self.c.setFont(font,size)
        {'left':self.c.drawString,'center':self.c.drawCentredString,'right':self.c.drawRightString}[align](x,H-y,s)
    def para(self,x,top,content,width,size=11,leading=17,bold=False,max_height=130,align=0):
        p=Paragraph(content,ParagraphStyle('p',fontName='Helvetica-Bold' if bold else 'Helvetica',
            fontSize=size,leading=leading,alignment=align))
        _,h=p.wrap(width,max_height)
        if h>max_height:raise ValueError('El contenido excede el espacio disponible; resumir.')
        p.drawOn(self.c,x,H-top-h)
        return top+h
    def image(self,key,x,top,w,h,alpha=1):
        raw=self.d['recursos'].get(key)
        if not raw:return
        self.c.saveState();self.c.setFillAlpha(alpha);self.c.setStrokeAlpha(alpha)
        self.c.drawImage(ImageReader(BytesIO(base64.b64decode(raw,validate=True))),x,H-top-h,
                         width=w,height=h,preserveAspectRatio=True,anchor='c',mask='auto')
        self.c.restoreState()
    def begin(self):
        self.c.setFillColor(HexColor('#555555'))
        self.text(R,25,('REGISTRO VERIFICADO EN EL SISTEMA' if self.d.get('modo')=='produccion' else 'MUESTRA LOCAL - PENDIENTE DE VALIDACIÓN Y FIRMA PROFESIONAL'),6,align='right')
        self.c.setFillColor(black)
    def physician(self,x,top,width):
        self.image('sello',x+width*.08,top, width*.32,58)
        self.image('firma',x+width*.4,top,width*.55,58)
        self.c.setLineWidth(.4);self.c.line(x,H-top-62,x+width,H-top-62)
        if self.d['medico_nombre']:
            self.text(x+width/2,top+74,self.d['medico_nombre'],9,True,'center',width)
        if self.d['medico_especialidad']:
            self.text(x+width/2,top+85,self.d['medico_especialidad'],8,False,'center',width)
        if self.d['medico_cmp']:
            self.text(x+width/2,top+96,'CMP: '+self.d['medico_cmp'],8,True,'center',width)
        if not any(self.d.get(k) for k in ['medico_nombre','medico_especialidad','medico_cmp']):
            self.text(x+width/2,top+76,'Espacio para profesional autorizado',7,False,'center',width)
    def footer(self,page=1,pages=1,top=690):
        self.text(L,top,'USUARIO  '+self.d['usuario'],8,True,width=350)
        self.text(R,top,'HORA  '+self.d['hora_emision'],8,align='right')
        qr=QrCodeWidget(self.d['verificador_url']);x0,y0,x1,y1=qr.getBounds()
        side=76;drawing=Drawing(side,side,transform=[side/(x1-x0),0,0,side/(y1-y0),0,0]);drawing.add(qr)
        renderPDF.draw(drawing,self.c,L,H-808)
        self.c.linkURL(self.d['verificador_url'],(L,H-808,L+side,H-732),relative=0)
        self.text(L+86,773,('Registro interno: ' if self.d.get('modo')=='produccion' else 'Código local de muestra: ')+self.d['autog'],6.5)
        self.text(L+86,784,'Registro verificado en el sistema.' if self.d.get('modo')=='produccion' else 'Sin registro público ni firma profesional.',6.5)
        self.text(R,827,f'Página {page} de {pages}',6,align='right')
        self.c.showPage()

def certificado(doc):
    d=doc.d;doc.begin();doc.image('logo',95.21,40.65,404.85,128.62)
    doc.text(W/2,198,'CERTIFICADO MÉDICO',19,True,'center')
    doc.c.line(190,H-202,405,H-202)
    doc.image('logo',100,350,395,135,.07)
    age=f", de {d['paciente_edad']} años" if d['paciente_edad']!='' else ''
    y=doc.para(L,231,f"Certifico atender al paciente <b>{esc(d['paciente_nombre'])}</b>{age}, identificado con DNI "
               f"<b>{d['paciente_dni']}</b>, quien acude a evaluación clínica y presenta:",R-L)
    y=doc.para(L,y+25,'<b>DIAGNÓSTICO:</b> '+esc(d['diagnostico']),R-L,max_height=70)
    if d['cie10']:y=doc.para(L,y+8,'<b>CIE-10:</b> '+esc(d['cie10']),R-L,max_height=30)
    if d['observaciones']:y=doc.para(L,y+22,esc(d['observaciones']),R-L,max_height=80)
    period=esc(date(d['descanso_inicio']))
    if d['descanso_hora_inicio']:period+=' · '+time(d['descanso_hora_inicio'])
    period+=' al '+date(d['descanso_fin'])
    if d['descanso_hora_fin']:period+=' · '+time(d['descanso_hora_fin'])
    y=doc.para(L,y+20,f"Se indica descanso médico por <b>{d['dias']} {'día' if d['dias']==1 else 'días'}</b>, "
               f'del <b>{period}</b>.',R-L,max_height=50)
    y=doc.para(L,y+16,'Se expide el presente documento a solicitud del interesado para los fines correspondientes.',R-L,max_height=40)
    if y>455:raise ValueError('Contenido del certificado demasiado largo; resumir.')
    doc.text(W/2,476,d['ubicacion'],11,True,'center',R-L)
    doc.text(W/2,495,date(d['fecha_emision']),10,True,'center')
    doc.text(W/2,516,d['direccion'],8,False,'center',R-L)
    doc.physician(172,535,251)
    doc.footer(top=675)

def descanso(doc):
    d=doc.d;doc.begin()
    doc.c.setFillColor(HexColor('#4e97d1'));doc.c.rect(49,H-17,R-49,13,fill=1,stroke=0);doc.c.setFillColor(black)
    # La marca de agua se reconstruye desde el isotipo, sin copiar datos del ejemplo.
    doc.image('isotipo',165,325,270,270,.08)
    doc.text(92,65,'DNI: '+d['paciente_dni'],9)
    doc.text(180,65,'NHC: '+d['historia_interna'],8.5,width=160)
    doc.text(350,65,'EDAD: '+(str(d['paciente_edad'])+' AÑOS' if d['paciente_edad']!='' else ''),9,width=70)
    doc.text(430,65,'SEXO: '+d['paciente_sexo'],9,width=R-430)
    for y,label,value in [(104,'HORA',time(d['hora_atencion'])),(128,'PACIENTE',d['paciente_nombre']),
                           (151,'SEDE CLÍNICA',' · '.join(filter(None,[d['sede'],d['direccion']])) )]:
        doc.text(92,y,label,10,True);doc.para(183,y-10,': '+esc(value),R-183,10,13,max_height=26)
    doc.c.setLineWidth(.6);doc.c.rect(49,H-260,R-49,87)
    doc.image('logo',66,183,212,67.4);doc.c.line(298,H-180,298,H-252)
    doc.image('isotipo',318,188,57,57)
    doc.c.setFillColor(BLUE);doc.text(395,221,'DESCANSO MÉDICO',12,True,width=151);doc.c.setFillColor(black)
    y=doc.para(76,290,'<b>Consta por la presente que</b> '+esc(d['paciente_nombre'])+
               f" <b>identificado con DNI {d['paciente_dni']}</b> ha sido atendido(a) el día: {date(d['fecha_atencion'])}.",
               R-76,10.5,15,max_height=45)
    for label,key in [('DIAGNÓSTICO','diagnostico'),('PRESENTA','presenta'),('PROCEDIMIENTO','procedimiento')]:
        y+=17;doc.text(76,y+10,label,10,True)
        y=doc.para(250,y,': '+esc(d[key]),R-250,10.5,15,max_height=60)
    if d['observaciones']:y=doc.para(76,y+16,esc(d['observaciones']),R-76,10,14,max_height=42)
    y=doc.para(76,y+22,'<b>POR TAL MOTIVO SE LE OTORGA:</b> DESCANSO MÉDICO POR '+
               f"{d['dias']} {'DÍA' if d['dias']==1 else 'DÍAS'}.",R-76,10,15,max_height=30)
    for label,key,hkey in [('INICIO','descanso_inicio','descanso_hora_inicio'),('FIN','descanso_fin','descanso_hora_fin')]:
        y+=23;doc.text(76,y,label,10,True)
        doc.text(250,y,': '+date(d[key])+(' · '+time(d[hkey]) if d[hkey] else ''),10)
    y=doc.para(76,y+25,'EXPEDIDA PARA LOS FINES CONSIGUIENTES QUE EL PACIENTE VEA NECESARIOS.',R-76,9.5,14,True,max_height=30)
    if y>550:raise ValueError('Contenido del descanso demasiado largo; resumir.')
    doc.text(R,575,', '.join(filter(None,[d['ubicacion'],long_date(d['fecha_emision'])]))+'.',9.5,True,'right',R-76)
    doc.physician(188,592,220);doc.footer(top=711)

def receta(doc):
    d=doc.d;cw=(R-L-24)/2;right=L+cw+24
    style=ParagraphStyle('cell',fontName='Helvetica',fontSize=7,leading=9)
    def cell(s):return Paragraph(esc(s),style)
    left_widths=[cw-115,50,40,25]
    right_widths=[cw-160,45,30,60,25]
    left_rows=[];right_rows=[];heights=[]
    for m in d['medicamentos']:
        name=m['nombre']+('\n'+m['atc_codigo'] if m.get('atc_codigo') else '')
        lr=[cell(name),cell(m['concentracion']),cell(m['forma']),cell(m['cantidad'])]
        rr=[cell(m['nombre']+('\n'+m['indicaciones'] if m['indicaciones'] else '')),
            cell(m['dosis']),cell(m['via']),cell(m['frecuencia']),cell(m['dias'])]
        h=max(p.wrap(w-8,500)[1] for row,widths in [(lr,left_widths),(rr,right_widths)] for p,w in zip(row,widths))+12
        if h>145:raise ValueError('Una fila de medicamento es demasiado larga; resumir.')
        left_rows.append(lr);right_rows.append(rr);heights.append(max(26,h))
    # Medir los bloques antes de paginar evita recortar campos de cabecera largos.
    def measure(s,w,size=8,leading=11):
        p=Paragraph(esc(s),ParagraphStyle('measure',fontName='Helvetica',fontSize=size,leading=leading))
        return p.wrap(w,200)[1]
    header_height=max(measure('CLÍNICA LA LUZ'+(' · '+d['sede'] if d['sede'] else ''),cw),measure(d['direccion'],cw))
    if header_height>22:raise ValueError('Sede o dirección demasiado largas; resumir.')
    if measure(d['paciente_nombre'],cw)>22:raise ValueError('Nombre del paciente demasiado largo.')
    metadata=[('USUARIO / SEGURO',d['seguro']),('ATENCIÓN',d['atencion']),('ESPECIALIDAD',d['especialidad']),('HISTORIA INTERNA',d['historia_interna'])]
    metadata_heights=[max(17,measure(v,cw-90)+5) for _,v in metadata]
    diag_height=measure('Diagnóstico: '+d['diagnostico'],cw)
    left_top=max(408,282+sum(metadata_heights)+diag_height+45)
    available=560-left_top-24
    if available<40:raise ValueError('Cabecera demasiado larga; resumir.')
    groups=[];start=0
    while start<len(heights):
        end=start;used=0
        while end<len(heights) and used+heights[end]<=available:used+=heights[end];end+=1
        if end==start:raise ValueError('Fila demasiado larga para la página.')
        groups.append((start,end));start=end
    def table(x,top,rows,widths,header,hs):
        headers=[]
        for h,w in zip(header,widths):
            font_size=max(5.5,min(6.5,(w-8)/stringWidth(h,'Helvetica-Bold',1)))
            headers.append(Paragraph(esc(h),ParagraphStyle('header',fontName='Helvetica-Bold',fontSize=font_size,leading=8)))
        t=Table([headers]+rows,colWidths=widths,rowHeights=[24]+hs)
        t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('GRID',(0,0),(-1,-1),.4,HexColor('#777777')),
            ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
        t.setStyle(TableStyle([('TOPPADDING',(0,0),(-1,0),4),('BOTTOMPADDING',(0,0),(-1,0),4)]))
        _,h=t.wrap(cw,500);t.drawOn(doc.c,x,H-top-h);return top+h
    for page,(a,b) in enumerate(groups,1):
        doc.begin()
        for x in [L,right]:
            doc.image('logo',x+8,38,cw-16,68)
            doc.para(x,116,'<b>CLÍNICA LA LUZ'+(' · '+esc(d['sede']) if d['sede'] else '')+'</b>',cw,9,11,max_height=22,align=1)
            doc.para(x,143,esc(d['direccion']),cw,6.5,9,max_height=22,align=1)
            doc.text(x+cw/2,181,'RECETA ÚNICA ESTANDARIZADA',8.5,True,'center',cw)
            if x==right:doc.text(x+cw/2,195,'INDICACIONES',8,True,'center')
            doc.text(x+cw/2,210,'N.º '+d['autog'],6.5,False,'center',cw)
            doc.text(x,238,'Nombres y apellidos:',8,True)
            bottom=doc.para(x,244,esc(d['paciente_nombre']),cw,8,11,max_height=22)
            doc.text(x,bottom+14,'DNI: '+d['paciente_dni']+' · Edad: '+str(d['paciente_edad']),8)
        y=282
        for (label,v),h in zip(metadata,metadata_heights):
            doc.text(L,y+9,label,6.7,True,width=87)
            doc.para(L+90,y,esc(v),cw-90,8,11,max_height=h)
            y+=h
        y=doc.para(L,y+9,'<b>Diagnóstico:</b> '+esc(d['diagnostico']),cw,8,11,max_height=80)
        doc.text(L,y+20,'CIE-10: '+d['cie10'],8,True)
        ends=[]
        for x,top,rows,widths,headers in [(L,left_top,left_rows[a:b],left_widths,['Medicamento / insumo','Concentración','Forma','Cant.']),
             (right,300,right_rows[a:b],right_widths,['Medicamento','Dosis','Vía','Frecuencia','Días'])]:
            end=table(x,top,rows,widths,headers,heights[a:b]);ends.append(end)
            doc.physician(x+16,end+16,cw-32)
            fy=end+132
            doc.text(x,fy,'Fecha de atención',7,True);doc.text(x+cw,fy,'Válido hasta',7,True,'right')
            doc.text(x,fy+12,date(d['fecha_atencion']),7);doc.text(x+cw,fy+12,date(d['valido_hasta']),7,False,'right')
        doc.footer(page,len(groups),top=max(615,max(ends)+155))

def render(data,output):
    doc=Document(data,output)
    {'certificado':certificado,'descanso':descanso,'receta':receta}[data['tipo']](doc)
    doc.c.save()

if __name__=='__main__':
    try:render(json.load(sys.stdin),sys.stdout.buffer)
    except ValueError as exc:
        print('CONTENT_TOO_LONG: '+str(exc),file=sys.stderr);sys.exit(2)
