//Accede al panel de clientes
exports.getAdminClientes = (request, response) => {
    response.render('admin/clients', { usuario: request.session.usuario });
};

exports.getDetalleCliente = (request, response) => {
    const { id } = request.params;

    const clientesDemo = {
        jose_nava: {
            nombre: 'Jose Nava',
            correo: 'joseNava@gmail.com',
            ultimaSesion: 'hace 1 dia',
            telefono: '442 891 2133',
            sucursales: ['Concesionario Jurica', 'Concesionario Centro'],
            pedidos: [
                { folio: 'A0001', fecha: '12 de Marzo de 2026', sucursal: 'Concesionario Jurica', total: '$189.00', estado: 'Confirmada' },
                { folio: 'A0002', fecha: '12 de Marzo de 2026', sucursal: 'Concesionario Jurica', total: '$189.00', estado: 'Cancelada' },
                { folio: 'A0003', fecha: '12 de Marzo de 2026', sucursal: 'Concesionario Jurica', total: '$189.00', estado: 'Confirmada' }
            ]
        },
        nicolas_bravo_miguel: {
            nombre: 'Nicolás Bravo Miguel',
            correo: 'nicoBM@gmail.com',
            ultimaSesion: 'hace 10 horas',
            telefono: '442 334 2298',
            sucursales: ['Concesionario Norte'],
            pedidos: [
                { folio: 'A0004', fecha: '10 de Marzo de 2026', sucursal: 'Concesionario Norte', total: '$280.00', estado: 'Confirmada' }
            ]
        },
        dante_hernandez: {
            nombre: 'Dante Hernandez',
            correo: 'danteHer@gmail.com',
            ultimaSesion: 'hace 20 dias',
            telefono: '442 100 1122',
            sucursales: ['Concesionario Jurica', 'Concesionario Sur'],
            pedidos: [
                { folio: 'A0005', fecha: '03 de Marzo de 2026', sucursal: 'Concesionario Sur', total: '$450.00', estado: 'Confirmada' }
            ]
        },
        jesus_rodriguez: {
            nombre: 'Jesus Rodriguez',
            correo: 'chuyRo@gmail.com',
            ultimaSesion: 'hace 3 horas',
            telefono: '442 555 0099',
            sucursales: ['Concesionario Centro'],
            pedidos: [
                { folio: 'A0006', fecha: '20 de Marzo de 2026', sucursal: 'Concesionario Centro', total: '$129.00', estado: 'Confirmada' }
            ]
        }
    };

    const cliente = clientesDemo[id] || clientesDemo.jose_nava;

    response.render('admin/client_detail', {
        usuario: request.session.usuario,
        cliente
    });
};
