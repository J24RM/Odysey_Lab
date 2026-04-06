const Orden = require('../models/orden.model');

exports.getMisPedidos = async (request, response) => {
    try {
        const id_usuario = 35; // Hardcoded until auth sessions are implemented
        const pedidos = await Orden.obtenerOrdenesPorUsuario(id_usuario);
        response.render('cliente/mis_pedidos', { 
            usuario: request.session.usuario,
            pedidos: pedidos
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        response.render('cliente/mis_pedidos', { 
            usuario: request.session.usuario,
            pedidos: []
        });
    }
};

exports.getPerfil = (request, response) => {

};

exports.setCuentaActiva = (request, response) => {

};

exports.setSucursalActiva = (request, response) => {

};