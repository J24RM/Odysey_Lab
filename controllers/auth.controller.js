// Controllers

//Muestra el Login
exports.getLogin = (request, response) => {
    response.render('login', { mensaje: "Ingresa tus credenciales para acceder" });
};

//Ingresa credenciales
//Para iniciar sesion de prueba:
//Usuario: admin
//Contraseña: a
exports.postLogin = (request, response) => {
    const { usuario, password } = request.body;

    if (usuario === "admin" && password === "a") {
        request.session.usuario = usuario;
        return response.redirect('/admin_home');
    }
    else if (usuario === "c" ) {
        request.session.usuario = usuario;
        return response.redirect('/cliente_home');
    }

    response.render('login', { mensaje: "Credenciales incorrectas" });
};


//Ruta protegida,
//Se accede si se validan correctamente las credenciales brindadas
exports.getHome = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('admin_home', { usuario: request.session.usuario });
};

exports.getHomeCliente = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('navbar', { usuario: request.session.usuario });
};

//Se accede al dar clic en "Cerrar sesion"
exports.logout = (request, response) => {
    request.session.destroy(() => {
        response.redirect('/login');
    });
};

exports.getMiPerfil = (request, response) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }

    response.render('', { usuario: request.session.usuario });
};