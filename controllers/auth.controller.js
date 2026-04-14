// Controllers
const Usuario = require('../models/usuario.model');
const Producto = require('../models/producto.model');
const Calificacion = require('../models/calificacion.model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const { log } = require('../utils/logger');

//Muestra el Login
exports.getLogin = (request, response) => {
    const motivo = request.query.motivo || null;
    response.render('login', { mensaje: "Ingresa tus credenciales para acceder", motivo });
};

exports.postLogin = async (request, response) => {
    try {
        const { usuario, password } = request.body;

        let usuarioData;

        try {
            usuarioData = await Usuario.encontrarPorEmail(usuario);
        } catch (error) {
            usuarioData = null;
        }

        // Validar existencia
        if (!usuarioData) {
            return response.render('login', { 
                mensaje: "Usuario y/o contraseña incorrectos", 
                motivo: null 
            });
        }

        const match = await bcrypt.compare(password, usuarioData.password_hash);

        if (!match) {
            return response.render('login', { 
                mensaje: "Usuario y/o contraseña incorrectos", 
                motivo: null 
            });
        }

        const token = generateToken({
            id: usuarioData.id_usuario,
            id_rol: usuarioData.id_rol,
            id_cuenta: usuarioData.id_cuenta
        });

        response.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        if (usuarioData.id_rol === 2) {
            log('ADMIN', 'LOGIN', `id: ${usuarioData.id_usuario}`);
            return response.redirect('/admin/home');
        } else if (usuarioData.id_rol === 1) {
            log('CLIENTE', 'LOGIN', `id: ${usuarioData.id_usuario}`);
            return response.redirect('/cliente/home');
        }

        return response.render('login', { 
            mensaje: "Usuario y/o contraseña incorrectos", 
            motivo: null 
        });

    } catch (error) {
        console.error('Error en login:', error);
        return response.render('login', { 
            mensaje: "Error en el servidor. Intenta de nuevo.", 
            motivo: null 
        });
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
        const promedios = await Calificacion.obtenerPromediosTodos();

        productos = productos.map(p => ({
            ...p,
            promedio: promedios[p.id_producto] || 0
        }));

        response.render('cliente/home', {
            usuario: request.session.usuario,
            productos,
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
    const usuario = request.session.usuario;
    const rol = request.session.id_rol === 2 ? 'ADMIN' : 'CLIENTE';

    request.session.destroy((err) => {
        if (err) {
            log(rol, 'LOGOUT ERROR', `id: ${usuario} — no se pudo destruir la sesión`);
            return response.redirect('/login?motivo=error_logout');
        }
        log(rol, 'LOGOUT', `id: ${usuario}`);
        response.redirect('/login?motivo=logout');
    });
};

//Ruta protegida, sirve para mostrar el perfil de usuario
exports.getMiPerfil = (request, response) => {
    response.render('cliente/profile', { usuario: request.session.usuario });
};