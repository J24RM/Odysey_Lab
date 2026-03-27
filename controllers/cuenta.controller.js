//Ver perfil del cliente
exports.getProfile = (request, response) => {
    response.render('cliente/profile', { usuario: request.session.usuario });
};


