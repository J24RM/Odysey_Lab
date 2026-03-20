//Obtener todos los productos (admin)
exports.getProductos = async (request, response) => {
    // Limitar 20 productos por pagina
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;

        const offset = (page - 1) * limit;

        const productos = await Producto.getAll(limit, offset);
        const total = await Producto.getTotal();

        response.json({
            data: productos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        response.status(500).json({ error: 'Error al obtener productos' });
    }
};

//Ver producto especifico (admin)
exports.getProductoAdmin = (request, response) => {
    const { id } = request.params;
    response.render('admin/product', {
        usuario: request.session.usuario,
        productoId: id
    });
};

//Ver producto especifico (cliente)
exports.getProductoCliente = (request, response) => {
    const { id } = request.params;
    response.render('cliente/product', {
        usuario: request.session.usuario,
        productoId: id
    });
};
