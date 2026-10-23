import importlib.util,io,json,unittest
from pathlib import Path
from urllib.error import HTTPError
spec=importlib.util.spec_from_file_location('cliente',Path(__file__).resolve().parents[1]/'scripts/consumir-generadores.py')
cliente=importlib.util.module_from_spec(spec);spec.loader.exec_module(cliente)

class ErrorApiTests(unittest.TestCase):
    def error(self,body):
        return HTTPError('https://example.invalid',403,'Forbidden',{},io.BytesIO(body))
    def test_detalle_anidado_y_codigo(self):
        body=json.dumps({'data':{'detail':'IP no autorizada'},'code':'IP_NOT_ALLOWED'}).encode()
        self.assertIn('IP no autorizada [IP_NOT_ALLOWED]',cliente.mensaje_error_http(self.error(body),''))
    def test_no_expone_token_reflejado(self):
        text=cliente.mensaje_error_http(self.error(b'{"error":"TOKEN-DE-PRUEBA rechazado"}'),'TOKEN-DE-PRUEBA')
        self.assertNotIn('TOKEN-DE-PRUEBA',text);self.assertIn('[TOKEN OCULTO]',text)
    def test_html_no_se_vuelca(self):
        text=cliente.mensaje_error_http(self.error(b'<html>contenido privado</html>'),'')
        self.assertIn('Respuesta no JSON',text);self.assertNotIn('contenido privado',text)

if __name__=='__main__':unittest.main()
