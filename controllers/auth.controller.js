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
        request.session.rol = "admin";
        return response.redirect('/admin/home');
    }
    else if (usuario === "c" ) {
        request.session.usuario = usuario;
        request.session.rol = "cliente";
        return response.redirect('/home');
    }

    response.render('login', { mensaje: "Credenciales incorrectas" });
};

//Ruta protegida admin
//Se accede si se validan correctamente las credenciales brindadas
exports.getAdminHome = (request, response) => {
    response.render('admin/home', { usuario: request.session.usuario });
};

//Ruta protegida cliente
exports.getClienteHome = (request, response) => {
    response.render('cliente/home', { usuario: request.session.usuario });
};

//Se accede al dar clic en "Cerrar sesion"
exports.logout = (request, response) => {
    request.session.destroy(() => {
        response.redirect('/login');
    });
};

//Ruta protegida, sirve para mostrar el perfil de usuario
exports.getMiPerfil = (request, response) => {
    response.render('cliente/profile', { usuario: request.session.usuario });
};