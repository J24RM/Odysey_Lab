const Usuario = require('../models/usuario.model');
const Cuenta = require('../models/cuenta.model');
const Orden = require('../models/orden.model');

exports.getAdminClientes = async (request, response) => {
    try {
        const clientes = await Usuario.obtenerClientes();
        response.render('admin/clients', {
            usuario: request.session.usuario,
            clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        response.render('admin/clients', {
            usuario: request.session.usuario,
            clientes: []
        });
    }
};

exports.getDetalleCliente = async (request, response) => {
    try {
        const { id } = request.params;
        const clienteDB = await Usuario.obtenerClientePorId(id);

        const cuentasRaw = await Cuenta.obtenerCuentasPorUsuario(id);
        const cuentas = await Promise.all(
            cuentasRaw.map(async (cuenta) => {
                const sucursales = await Cuenta.obtenerSucursalesPorCuenta(cuenta.id_cuenta);
                return { ...cuenta, sucursales };
            })
        );

        const ordenesRaw = await Orden.obtenerOrdenesPorUsuario(id);
        const pedidos = ordenesRaw.map(o => ({
            folio: o.folio,
            fecha: o.fecha_realizada
                ? new Date(o.fecha_realizada).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'N/A',
            sucursal: o.sucursal?.nombre_sucursal || '—',
            total: o.subtotal != null
                ? `$${Number(o.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                : 'N/A',
            estado: o.estado ? o.estado.charAt(0).toUpperCase() + o.estado.slice(1) : ''
        }));

        const cliente = {
            ...clienteDB,
            nombre: clienteDB.Nombre_usuario || clienteDB.email,
            correo: clienteDB.email,
            cuentas,
            pedidos
        };

        response.render('admin/client_detail', {
            usuario: request.session.usuario,
            cliente
        });
    } catch (error) {
        console.error('Error al obtener detalle cliente:', error);
        response.redirect('/admin/clients');
    }
};
