//Accede al panel de clientes
exports.getClientes = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('admin_clientes', { usuario: request.session.usuario });
};