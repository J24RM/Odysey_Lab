const Usuario = require('../models/usuario.model');

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

        const cliente = {
            ...clienteDB,
            nombre: clienteDB.nombre || clienteDB.email,
            correo: clienteDB.email,
            telefono: clienteDB.telefono || 'N/A',
            ultimaSesion: 'N/A',
            sucursales: [],
            pedidos: []
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
