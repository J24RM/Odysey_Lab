function log(rol, accion, detalle) {
    const ts = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    console.log(`[${rol}] [${accion}] ${detalle} | ${ts}`);
}

module.exports = { log };
