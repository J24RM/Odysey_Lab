const Orden = require('../models/orden.model');

exports.getMisPedidos = async (request, response) => {
    try {
        const id_usuario = request.session.usuario;
        const pedidos = await Orden.obtenerOrdenesPorUsuario(id_usuario);

        response.render('cliente/mis_pedidos', { 
            usuario: request.session.usuario,
            pedidos: pedidos,
            error: request.session.error,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        response.render('cliente/mis_pedidos', { 
            usuario: request.session.usuario,
            pedidos: [],
            error: request.session.error,
        });
    }
};

exports.getPerfil = (request, response) => {

};

exports.setCuentaActiva = (request, response) => {

};

exports.setSucursalActiva = (request, response) => {

};