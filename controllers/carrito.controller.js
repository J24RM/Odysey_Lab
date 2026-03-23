const ordenModel = require('../models/orden.model')
const detalle_ordenModel = require('../models/detalle_orden.model');
const { compile } = require('ejs');

exports.getCarrito = async (request, response, next) => {



};

exports.agregarItem = async (request, response, next) => {
    try {
        // Obtener o crear carrito
        const orden = await ordenModel.obtenerOrdenEnEstadoCarrito(request.body.id_usuario);
        request.session.id_orden = orden.id;

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

exports.actualizarItem = async (request, response, next) => {
    const { id_producto } = request.params;
    const { cantidad_ingresada } = request.body;
    const id_orden =  3 ; // req.session.id_orden;

    try {
        if (cantidad_ingresada == 0) {
            await detalle_ordenModel.eliminarProducto(id_orden, id_producto);
            return response.json({ eliminado: true });
        } else {
            await detalle_ordenModel.modificarCantidad(
                id_orden,
                id_producto,
                cantidad_ingresada
            );

            return response.json({
                eliminado: false,
                nuevaCantidad: cantidad_ingresada
            });
        }
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};

exports.eliminarItem = (request, response) => {

};
