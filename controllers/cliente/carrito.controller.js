const ordenModel = require('../../models/orden.model')
const detalle_ordenModel = require('../../models/detalle_orden.model');
const productoModel = require('../../models/producto.model')
const { compile } = require('ejs');
const { log } = require('../../utils/logger');
const cartcount = require('../../utils/cartcount');

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

        // Productos sugeridos: todos los activos, excluir los del carrito, tomar 4 al azar
        const idsEnCarrito = new Set((productosCarrito || []).map(i => i.id_producto));
        const todosLosProductos = await productoModel.fetchAll();
        const disponibles = todosLosProductos.filter(p => !idsEnCarrito.has(p.id_producto));
        for (let i = disponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
        }
        const productosSugeridos = disponibles.slice(0, 4);

        response.render('cliente/cart', {
            csrfToken: request.csrfToken(),
            usuario: request.session.usuario,
            error: null,
            productosCarrito: productosCarrito,
            detalleProductos: detalleProductos,
            sucursal_activa: sucursal_activa,
            carrito: request.session.id_carrito,
            productosSugeridos,
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


        const page = request.body.page || '1';  
        const search = request.body.search || '';
        
        if (search) {
            response.redirect(`/cliente/home?search=${encodeURIComponent(search)}`);
        } else {
            response.redirect(`/cliente/home?page=${page}`);
        }

    } catch (err) {
        response.redirect(`/cliente/product/${request.body.id_producto}?error=` + encodeURIComponent("No se pudo agregar el producto al carrito"));
    }
};

exports.agregarItem = async (request, response) => {
    try {

        const data = await detalle_ordenModel.agregarProductoAlCarrito(
            request.session.usuario,
            request.body.id_producto,
            request.body.cantidad_ingresada
        );


        request.session.id_carrito = data;

        response.redirect('/cliente/home?info=' + encodeURIComponent("Se agrego el producto al carrito"));

    } catch (error) {
        console.log(error)
        response.redirect(`/cliente/product/${request.body.id_producto}?error=` + encodeURIComponent("No se pudo agregar el producto al carrito"));
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

            const items = await detalle_ordenModel.detalleOrden(request.session.id_carrito);
            const nuevoTotal = items.reduce((sum, i) => sum + i.cantidad, 0);

            return response.json({
                eliminado: false,
                nuevaCantidad: cantidad_ingresada,
                cartCount: nuevoTotal,
                csrfToken: request.csrfToken()
            });
        }
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};
