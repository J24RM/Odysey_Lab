exports.getMisPedidos = (request, response) => {
    response.render('cliente/mis_pedidos', { usuario: request.session.usuario });
};

exports.getPerfil = (request, response) => {

};

exports.setCuentaActiva = (request, response) => {

};

exports.setSucursalActiva = (request, response) => {

};