//Accede al panel de historial de ordenes
exports.getHistorialOrdenes = (request, response) => {
    response.render('admin/orders', { usuario: request.session.usuario });
};

exports.getDetalleOrden = (request, response) => {
    const { id } = request.params;

    const ordenesDemo = {
        A0001: {
            folio: 'A0001',
            sucursal: 'Jurica',
            estado: 'Confirmada',
            fecha: '18/02/26',
            totalProductos: 10,
            subtotal: '7,280.00',
            usuario: 'Jose Nava',
            productos: [
                {
                    nombre: 'Sellador Comex 5×1 Clásico Preparación de Superficies PPG Silicona o Poliuretano 4000 ml Sellador',
                    cantidad: 2,
                    total: '1,600',
                    precioUnitario: '800',
                    imagen: '/img/botePintura.png',
                    destacado: false
                },
                {
                    nombre: 'Sellador Comex 5×1 Clásico Preparación de Superficies PPG Silicona o Poliuretano 4000 ml Sellador',
                    cantidad: 2,
                    total: '1,600',
                    precioUnitario: '800',
                    imagen: '/img/botePintura.png',
                    destacado: true
                }
            ]
        }
    };

    const orden = ordenesDemo[id] || {
        folio: id,
        sucursal: 'Jurica',
        estado: 'Confirmada',
        fecha: '18/02/26',
        totalProductos: 10,
        subtotal: '7,280.00',
        usuario: 'Jose Nava',
        productos: [
            {
                nombre: 'Sellador Comex 5×1 Clásico Preparación de Superficies PPG Silicona o Poliuretano 4000 ml Sellador',
                cantidad: 2,
                total: '1,600',
                precioUnitario: '800',
                imagen: '/img/botePintura.png',
                destacado: false
            }
        ]
    };

    response.render('admin/order_detail', {
        usuario: request.session.usuario,
        orden
    });
};
