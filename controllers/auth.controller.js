// Controllers
const Usuario = require('../models/usuario.model');
const Producto = require('../models/producto.model');

//Muestra el Login
exports.getLogin = (request, response) => {
    response.render('login', { mensaje: "Ingresa tus credenciales para acceder" });
};

//Ingresa credenciales
exports.postLogin = async (request, response) => {
    try {
        const { usuario, password } = request.body;

        // Buscar usuario por email en la BD
        let usuarioData;
        try {
            usuarioData = await Usuario.encontrarPorEmail(usuario);
        } catch (error) {
            // Si no encuentra el usuario, tratarlo como credenciales incorrectas
            usuarioData = null;
        }

        // Validar que existe el usuario y la contraseña coincide
        if (!usuarioData || usuarioData.password_hash !== password) {
            return response.render('login', { mensaje: "Usuario y/o contraseña incorrectos" });
        }

        // Guardar solo id_usuario en la sesión
        request.session.usuario = usuarioData.id_usuario;
        request.session.id_rol = usuarioData.id_rol;

        // Redirigir según id_rol (1 = cliente, 2 = admin)
        if (usuarioData.id_rol === 2) {
            return response.redirect('/admin/home');
        } else if (usuarioData.id_rol === 1) {
            return response.redirect('/cliente/home');
        }

        // Si id_rol no es reconocido
        response.render('login', { mensaje: "Usuario y/o contraseña incorrectos" });

    } catch (error) {
        console.error('Error en login:', error);
        response.render('login', { mensaje: "Error en el servidor. Intenta de nuevo." });
    }
};

//Ruta protegida admin
//Se accede si se validan correctamente las credenciales brindadas
exports.getAdminHome = (request, response) => {
    response.render('admin/home', { usuario: request.session.usuario });
};

exports.getAdminEditarProducto = async (request, response) => {
    try {
        const productos = await Producto.fetchLimit(10);
        response.render('admin/home_editarProducto', {
            usuario: request.session.usuario,
            productos: productos,
            formulario: null,
            mensaje: null,
            error: null,
            productoSeleccionado: null
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        response.render('admin/home_editarProducto', {
            usuario: request.session.usuario,
            productos: [],
            formulario: null,
            mensaje: null,
            error: 'Error al cargar los productos',
            productoSeleccionado: null
        });
    }
};

//Ruta protegida cliente
exports.getClienteHome = async (request, response) => {
    try {
        const searchQuery = request.query.search || '';
        let productos;
        
        if (searchQuery) {
            productos = await Producto.search(searchQuery);
        } else {
            productos = await Producto.fetchAll();
        }
        response.render('cliente/home', { 
            usuario: request.session.usuario,
            productos: productos,
            searchQuery: searchQuery
        });
    } catch (error) {
        console.error('Error fetching products for client home:', error);
        response.status(500).send('Error interno del servidor');
    }
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