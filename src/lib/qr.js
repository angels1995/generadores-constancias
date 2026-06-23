import QRCode from 'qrcode';

export async function generarQRBase64(texto) {
  // Devuelve directamente un data URI: "data:image/png;base64,...."
  return QRCode.toDataURL(texto, {
    width: 220,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });
}
