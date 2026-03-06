//Accede al panel de historial de ordenes
exports.getHistorialOrdenes = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('admin_historial_ordenes', { usuario: request.session.usuario });
};
