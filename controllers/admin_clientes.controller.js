//Accede al panel de clientes
exports.getAdminClientes = (request, response) => {
    response.render('admin/clients', { usuario: request.session.usuario });
};