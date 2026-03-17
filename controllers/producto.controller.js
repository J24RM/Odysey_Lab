exports.getProductos = async (req, res) => {
    // Limitar 20 productos por pagina
    try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const offset = (page - 1) * limit;

    const productos = await Producto.getAll(limit, offset);
    const total = await Producto.getTotal();

    res.json({
        data: productos,
        pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
        }
    });

    } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
    }
};

exports.getConsultarProducto = (request, response) => {
    response.render('', {
        // Aqui verificar la sesion
        // Verificar csrfToken
    })
};
