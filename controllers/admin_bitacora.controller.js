const Log = require('../models/log.model');
const Usuario = require('../models/usuario.model');

function calcularFechaDesde() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'America/Mexico_City'
    });
}

exports.getBitacora = async (req, res) => {
    const search = req.query.search?.trim() || '';
    const id_usuario_filtro = req.query.id_usuario ? parseInt(req.query.id_usuario) : null;

    const base = {
        usuario: req.session.usuario,
        fechaDesde: calcularFechaDesde(),
        logs: [],
        admins: [],
        adminSeleccionado: null,
        searchQuery: search,
        id_usuario_filtro,
        mensaje: null,
        errorBusqueda: null
    };

    try {
        // Ver logs de un admin específico (última semana)
        if (id_usuario_filtro) {
            const [logs, adminSeleccionado] = await Promise.all([
                Log.obtenerPorUsuario(id_usuario_filtro),
                Usuario.obtenerAdminPorId(id_usuario_filtro)
            ]);

            const mensaje = logs.length === 0
                ? 'Este administrador no tiene actividad registrada en la última semana.'
                : null;

            return res.render('admin/bitacora', { ...base, logs, adminSeleccionado, mensaje });
        }

        // Buscar admins por nombre o email
        if (search) {
            const admins = await Usuario.buscarAdminsPorNombreOEmail(search);

            if (admins.length === 0) {
                return res.render('admin/bitacora', {
                    ...base,
                    errorBusqueda: 'El usuario o email no existe.'
                });
            }

            return res.render('admin/bitacora', { ...base, admins });
        }

        // Vista general: todos los logs
        const logs = await Log.obtenerTodos();
        const mensaje = logs.length === 0 ? 'No se cuenta con información de bitácora.' : null;

        return res.render('admin/bitacora', { ...base, logs, mensaje });

    } catch (error) {
        console.error('Error en bitácora:', error);
        res.status(500).send('Error interno del servidor');
    }
};
