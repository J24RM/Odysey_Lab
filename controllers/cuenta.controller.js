const Cuenta = require('../models/cuenta.model');
const Usuario = require('../models/usuario.model');

exports.getProfile = (request, response) => {
    response.render('cliente/profile', { usuario: request.session.usuario });
};

exports.getProfileData = async (request, response) => {
    try {
        const id_usuario = request.session.usuario;

        const [usuario, cuentas] = await Promise.all([
            Usuario.obtenerClientePorId(id_usuario),
            Cuenta.obtenerCuentasPorUsuario(id_usuario)
        ]);

        // Auto-asignar si solo hay una cuenta y aún no está en sesión
        if (cuentas.length === 1 && !request.session.cuenta_activa) {
            request.session.cuenta_activa = cuentas[0];
            const sucursales = await Cuenta.obtenerSucursalesPorCuenta(cuentas[0].id_cuenta);
            if (sucursales.length === 1) {
                request.session.sucursal_activa = sucursales[0];
            }
        }

        let sucursales = [];
        if (request.session.cuenta_activa) {
            sucursales = await Cuenta.obtenerSucursalesPorCuenta(request.session.cuenta_activa.id_cuenta);
        }

        return response.json({
            usuario,
            cuentas,
            cuenta_activa: request.session.cuenta_activa || null,
            sucursal_activa: request.session.sucursal_activa || null,
            sucursales,
            multiple_cuentas: cuentas.length > 1
        });
    } catch (error) {
        console.error('Error en getProfileData:', error);
        return response.status(500).json({ error: 'Error al cargar el perfil' });
    }
};
