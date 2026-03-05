exports.getMisPedidos = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('PEDIDOS', { usuario: request.session.usuario });
};

exports.getMiCarrito = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('CARRITO', { usuario: request.session.usuario });
};