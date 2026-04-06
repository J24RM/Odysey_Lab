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
exports.getAdminHome = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = 20;
        const { productos, total } = await Producto.fetchAllPaginated(page, limit);
        const totalPages = Math.ceil(total / limit);

        response.render('admin/home', {
            usuario: request.session.usuario,
            productos: productos,
            total: total,
            page: page,
            totalPages: totalPages,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching products for admin home:', error);
        response.render('admin/home', {
            usuario: request.session.usuario,
            productos: [],
            total: 0,
            page: 1,
            totalPages: 0,
            limit: 20,
            error: 'Error al cargar los productos'
        });
    }
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
        const page = parseInt(request.query.page) || 1;
        const limit = 20;
        let productos, total;

        if (searchQuery) {
            // Para búsqueda, obtener todos los resultados sin paginación
            productos = await Producto.search(searchQuery);
            total = productos.length;
        } else {
            // Para catálogo, usar paginación
            const result = await Producto.fetchPaginated(page, limit);
            productos = result.productos;
            total = result.total;
        }

        const totalPages = searchQuery ? 1 : Math.ceil(total / limit);

        response.render('cliente/home', {
            usuario: request.session.usuario,
            productos: productos,
            searchQuery: searchQuery,
            total: total,
            page: page,
            totalPages: totalPages,
            limit: limit
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