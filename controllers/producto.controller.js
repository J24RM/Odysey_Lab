//Obtener todos los productos (admin)
exports.getProductos = async (request, response) => {

};

//Ver producto especifico (admin)
exports.getProductoAdmin = (request, response) => {
    const { id } = request.params;

    const productosDemo = {
        sellador_1: {
            id,
            nombre: 'Sellador Comex 5×1 Clásico Preparación de Superficies PPG Silicona o Poliuretano 4000 ml Sellador',
            precio: '800',
            peso: '2Kg',
            volumen: '0.3 m3',
            unidadVenta: 'Pieza',
            unidadMedida: 'Mililitros',
            descripcion: [
                'Alta calidad y rendimiento profesional: Fórmula acrílica premium para superficies interiores y exteriores, con gran durabilidad',
                'Excelente cobertura: Cubre fácilmente imperfecciones con una sola mano en la mayoría de las superficies'
            ],
            imagen: '/img/botePintura.png',
            similars: [
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png'
            ]
        }
    };

    const producto = productosDemo[id] || productosDemo.sellador_1;

    response.render('admin/product', {
        usuario: request.session.usuario,
        productoId: id,
        producto
    });
};

//Ver producto especifico (cliente)
exports.getProductoCliente = (request, response) => {
    response.render('cliente/product.ejs')
};
