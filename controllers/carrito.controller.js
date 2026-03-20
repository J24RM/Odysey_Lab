const ordenModel = require('../models/orden.model')
const detalle_ordenModel = require('../models/detalle_orden.model');
const { compile } = require('ejs');

exports.getCarrito = async (request, response, next) => {



};

exports.agregarItem = async (request, response, next) => {
    try {
        // Obtener o crear carrito
        const orden = await ordenModel.obtenerOrdenEnEstadoCarrito(request.body.id_usuario);

        // Agregar producto
        await detalle_ordenModel.agregarProductoAlCarrito(
            orden.id_orden,
            request.body.id_producto,
            request.body.cantidad_ingresada
        );

        response.json({ message: "Producto agregado" });

    } catch (err) {
        next(err);
    }
};

exports.actualizarItem = (request, response) => {

};
