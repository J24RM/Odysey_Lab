const ordenModel = require('../../models/orden.model')
const detalle_ordenModel = require('../../models/detalle_orden.model');
const productoModel = require('../../models/producto.model')
const { compile } = require('ejs');

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
        let sucursal = "Apaseo"; // request.session.sucursal;

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
            sucursal: sucursal,
            carrito: request.session.id_carrito,
        });

    } catch (err) {
        next(err);
    }
};

exports.agregarItem = async (request, response, next) => {
    try {
        // const id_usuario = request.session.id_usuario;

        // Obtener carrito
        const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(request.session.usuario);
        if(!carrito){
            const carrito = await ordenModel.crearCarrito(request.session.usuario);
            request.session.id_carrito = carrito.id_orden;
            console.log("Se creo un carrito")
        }

        else{
            request.session.id_carrito = carrito.id_orden;
        }

        console.log("Id del Carrito" + request.session.id_carrito);

        // Agregar producto
        await detalle_ordenModel.agregarProductoAlCarrito(
            request.session.id_carrito,
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
    
    try {
        if (cantidad_ingresada == 0) {
            await detalle_ordenModel.eliminarProducto(request.session.id_carrito, id_producto);
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
