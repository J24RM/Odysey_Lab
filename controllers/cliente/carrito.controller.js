const ordenModel = require('../../models/orden.model')
const detalle_ordenModel = require('../../models/detalle_orden.model');
const productoModel = require('../../models/producto.model')
const { compile } = require('ejs');

exports.getCarrito = async (request, response, next) => {
    try {
        const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(35); // hardcoded user until auth
        const id_carrito = carrito.id_orden;
        let productosCarrito = null;
        let detalleProductos = null;
        let sucursal = "Apaseo";

        if (id_carrito != null) {
            productosCarrito = await detalle_ordenModel.detalleOrden(id_carrito);

            // detalleOrden regresa un array, hay que iterar cada producto
            console.log([productosCarrito])
            detalleProductos = await Promise.all(
                productosCarrito.map(item =>
                    productoModel.encontrarProductoPorId(item.id_producto)
                )
            );
            console.log(productosCarrito)
        }

        response.render('cliente/cart', {
            // csrfToken: request.csrfToken(),
            username: request.session.username || '',
            error: null,
            productosCarrito: productosCarrito,
            detalleProductos: detalleProductos,
            sucursal: sucursal,
            id_carrito: id_carrito,
        });

    } catch (err) {
        next(err);
    }
};

exports.agregarItem = async (request, response, next) => {
    try {
        // const id_usuario = request.session.id_usuario;

        // Obtener o crear carrito
        const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(request.body.id_usuario);
        request.session.id_carrito = carrito.id_orden;

        // Agregar producto
        await detalle_ordenModel.agregarProductoAlCarrito(
            carrito.id_orden,
            request.body.id_producto,
            request.body.cantidad_ingresada
        );

        response.redirect('/cart')

    } catch (err) {
        response.redirect('/cart?error=' + encodeURIComponent(err.message));
    }
};

exports.actualizarItem = async (request, response, next) => {
    const { id_producto } = request.params;
    const { cantidad_ingresada } = request.body;
    const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(35); // hardcoded user until auth
    const id_carrito = carrito.id_orden;
    
    try {
        if (cantidad_ingresada == 0) {
            await detalle_ordenModel.eliminarProducto(id_carrito, id_producto);
            return response.json({ eliminado: true });
        } else {
            await detalle_ordenModel.modificarCantidad(
                id_carrito,
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
