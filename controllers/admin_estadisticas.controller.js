//Accede al panel de estadisticas
exports.getEstadisticas = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('admin_estadisticas', { usuario: request.session.usuario });
};

//Accede al panel de estadísticas de pedidos
exports.getEstadisticas2 = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('admin_estadisticas2', { usuario: request.session.usuario });
};
