const Orden = require('../models/orden.model');
const Usuario = require('../models/usuario.model');

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
            usuarioData: usuarioData
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        response.render('cliente/mis_pedidos', {
            usuario: request.session.usuario,
            pedidos: [],
            usuarioData: null
        });
    }
};

exports.getPerfil = (request, response) => {

};

exports.setCuentaActiva = (request, response) => {

};

exports.setSucursalActiva = (request, response) => {

};