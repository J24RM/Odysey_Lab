const ordenModel = require('../../models/orden.model')
const detalle_ordenModel = require('../../models/detalle_orden.model');
const productoModel = require('../../models/producto.model')
const { compile } = require('ejs');
const { log } = require('../../utils/logger');

exports.getCarrito = async (request, response, next) => {
    try {
        const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(request.session.usuario); 

        if(!carrito){
            request.session.id_carrito = null;
        }
        else{
            request.session.id_carrito = carrito.id_orden;
        }
        let productosCarrito = null;
        let detalleProductos = null;
        sucursal_activa = request.session.sucursal_activa || "";

        if (request.session.id_carrito != null) {
            productosCarrito = await detalle_ordenModel.detalleOrden(request.session.id_carrito);

            // detalleOrden regresa un array, hay que iterar cada producto
            detalleProductos = await Promise.all(
                productosCarrito.map(item =>
                    productoModel.encontrarProductoPorId(item.id_producto)
                )
            );
        }

        response.render('cliente/cart', {
            csrfToken: request.csrfToken(),
            usuario: request.session.usuario,
            error: null,
            productosCarrito: productosCarrito,
            detalleProductos: detalleProductos,
            sucursal_activa: sucursal_activa,
            carrito: request.session.id_carrito,
        });

    } catch (err) {
        next(err);
    }
};

exports.agregarItem = async (request, response, next) => {
    try {

        // Obtener carrito
        const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(request.session.usuario);
        if(!carrito){
            const carrito = await ordenModel.crearCarrito(request.session.usuario);
            request.session.id_carrito = carrito.id_orden;
        }

        else{
            request.session.id_carrito = carrito.id_orden;
        }


        // Agregar producto
        await detalle_ordenModel.agregarProductoAlCarrito(
            request.session.id_carrito,
            request.body.id_producto,
            request.body.cantidad_ingresada
        );


        response.redirect('/cliente/home')

    } catch (err) {
        response.redirect(`/cliente/product/${request.body.id_producto}?error=` + encodeURIComponent("No se pudo agregar el producto al carrito"));
    }
};

exports.actualizarItem = async (request, response, next) => {
    const { id_producto } = request.params;
    const { cantidad_ingresada } = request.body;
    
    try {
        if (cantidad_ingresada == 0) {
            await detalle_ordenModel.eliminarProducto(request.session.id_carrito, id_producto);
            log('CLIENTE', 'CARRITO: PRODUCTO ELIMINADO', `id_cliente: ${request.session.usuario}, id_producto: ${id_producto}`);
            return response.json({
                eliminado: true ,
                csrfToken: request.csrfToken()
            });
        } else {
            await detalle_ordenModel.modificarCantidad(
                request.session.id_carrito,
                id_producto,
                cantidad_ingresada
            );
            log('CLIENTE', 'CARRITO: CANTIDAD ACTUALIZADA', `id_cliente: ${request.session.usuario}, id_producto: ${id_producto}, nueva_cantidad: ${cantidad_ingresada}`);

            return response.json({
                eliminado: false,
                nuevaCantidad: cantidad_ingresada,
                csrfToken: request.csrfToken()
            });
        }
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};
