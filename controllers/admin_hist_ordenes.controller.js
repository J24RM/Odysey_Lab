//Accede al panel de historial de ordenes
exports.getHistorialOrdenes = (request, response) => {
    response.render('admin/orders', { usuario: request.session.usuario });
};
