const estado = document.getElementById('estado');
const codigo = new URL(location.href).searchParams.get('codigo') || '';
async function verificar() {
  if (!/^RECETA-[A-F0-9]{32}$/.test(codigo)) {
    estado.textContent = 'El enlace no contiene un código válido.';
    return;
  }
  try {
    const response = await fetch(`/api/receta/verificar/${encodeURIComponent(codigo)}`, {
      cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000)
    });
    if (response.status === 404) { estado.textContent = 'Registro no encontrado.'; return; }
    if (!response.ok) throw new Error();
    const { data } = await response.json();
    estado.textContent = data.dentro_del_plazo_declarado
      ? 'Registro verificado en el sistema.'
      : 'Registro verificado en el sistema. El plazo declarado ha vencido.';
    document.getElementById('codigo').textContent = data.autog;
    document.getElementById('fecha').textContent = new Date(data.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' });
    document.getElementById('hasta').textContent = data.valido_hasta.split('-').reverse().join('/');
    document.getElementById('total').textContent = data.medicamentos_total;
    document.getElementById('datos').hidden = false;
  } catch { estado.textContent = 'No se pudo consultar el registro. Intenta nuevamente más tarde.'; }
}
verificar();
