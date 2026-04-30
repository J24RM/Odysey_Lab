const Orden = require('../models/orden.model');
const Usuario = require('../models/usuario.model');
const Cuenta = require('../models/cuenta.model');

exports.getMisPedidos = async (request, response) => {
    try {
        const id_usuario = request.session.usuario;
        const [pedidos, usuarioData] = await Promise.all([
            Orden.obtenerOrdenesPorUsuario(id_usuario),
            Usuario.obtenerClientePorId(id_usuario).catch(() => null)
        ]);

        response.render('cliente/mis_pedidos', {
            usuario: request.session.usuario,
            pedidos: pedidos,
            usuarioData: usuarioData,
            error: request.session.error,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        response.render('cliente/mis_pedidos', {
            usuario: request.session.usuario,
            pedidos: [],
            usuarioData: null,
            error: request.session.error,
        });
    }
};

exports.getPerfil = (request, response) => {

};

exports.setCuentaActiva = async (request, response) => {
    try {
        const id_usuario = request.session.usuario;
        const { id_cuenta } = request.body;

        const cuentas = await Cuenta.obtenerCuentasPorUsuario(id_usuario);
        const cuenta = cuentas.find(c => c.id_cuenta === parseInt(id_cuenta));
        if (!cuenta) return response.status(403).json({ error: 'Cuenta no autorizada' });

        request.session.cuenta_activa = cuenta;
        request.session.sucursal_activa = null;

        const sucursales = await Cuenta.obtenerSucursalesPorCuenta(cuenta.id_cuenta);

        // Auto-asignar sucursal si solo hay una
        if (sucursales.length === 1) {
            request.session.sucursal_activa = sucursales[0];
        }

        return response.json({
            cuenta_activa: cuenta,
            sucursales,
            sucursal_activa: request.session.sucursal_activa
        });
    } catch (error) {
        console.error('Error en setCuentaActiva:', error);
        return response.status(500).json({ error: 'Error al cambiar cuenta' });
    }
};

exports.setSucursalActiva = async (request, response) => {
    try {
        const { id_sucursal } = request.body;
        const cuenta_activa = request.session.cuenta_activa;
        if (!cuenta_activa) return response.status(400).json({ error: 'No hay cuenta activa' });

        const sucursales = await Cuenta.obtenerSucursalesPorCuenta(cuenta_activa.id_cuenta);
        const sucursal = sucursales.find(s => s.id_sucursal === parseInt(id_sucursal));
        if (!sucursal) return response.status(403).json({ error: 'Sucursal no autorizada' });

        request.session.sucursal_activa = sucursal;
        return response.json({ sucursal_activa: sucursal });
    } catch (error) {
        console.error('Error en setSucursalActiva:', error);
        return response.status(500).json({ error: 'Error al cambiar sucursal' });
    }
};
