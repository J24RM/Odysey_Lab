if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); 
const multer = require('multer');
const csrf = require('csurf');
const csrfProtection = csrf();
const { log } = require('./utils/logger');

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Archivos de rutas
const authRoutes = require('./routes/auth.routes');
const adminHomeRoutes = require('./routes/admin/home.routes');
const adminProductoRoutes = require('./routes/admin/producto.routes');
const adminOrdenesRoutes = require('./routes/admin/ordenes.routes');
const adminClientesRoutes = require('./routes/admin/clientes.routes');
const adminEstadisticasRoutes = require('./routes/admin/estadisticas.routes');
const clienteRoutes = require('./routes/cliente.routes')

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // La sesión no se guardará en cada petición, sino sólo se guardará si algo cambió
    saveUninitialized: false, // Asegura que no se guarde una sesión para una petición que no lo necesita
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de multer para subida de imágenes
const fileStorage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, path.join(__dirname, 'uploads'));
    },
    filename: (request, file, callback) => {
        // Generar nombre único sin caracteres problemáticos
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        callback(null, `${timestamp}_${name}${ext}`);
    },
});

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const fileFilter = (request, file, callback) => {
    const imageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const csvTypes = [
        'text/csv',
        'application/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (imageTypes.includes(file.mimetype) || csvTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

app.use(multer({ storage: fileStorage, fileFilter }).fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'imagenes', maxCount: 50 },
    { name: 'archivoCSV', maxCount: 1 }
]));

app.use(csrfProtection);

app.use((request, response, next) => {
    response.locals.csrfToken = request.csrfToken();
    response.locals.sucursal_activa = request.session.sucursal_activa || null;
    next();
});

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Rutas publicas (sin autenticacion)
app.use(authRoutes);

//Ruta raiz opcional
app.get('/', (request, response) => {
    response.redirect('/login');
});

//Ruta a panel de estadisticas
// const estadisticasRoutes = require('./routes/admin_estadisticas.routes');
// app.use(estadisticasRoutes);
// ESAS LINEAS DAN FALLO

//Middleware global de autenticacion e inactividad
app.use((request, response, next) => {
    const authMiddleware = require('./middlewares/auth.middleware');

    app.use(authMiddleware);

    const now = Date.now();
    if (request.session.lastActivity && (now - request.session.lastActivity) > INACTIVITY_TIMEOUT) {
        return request.session.destroy(() => {
            response.redirect('/login?motivo=inactividad');
        });
    }
    request.session.lastActivity = now;
    next();
});

// Evitar que el navegador cachee páginas protegidas (bloquea el botón regresar post-logout)
app.use((request, response, next) => {
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    next();
});

// Log de navegación entre rutas
app.use((request, response, next) => {
    const rol = request.session.id_rol === 2 ? 'ADMIN' : 'CLIENTE';
    log(rol, 'NAV', `id: ${request.session.usuario} → ${request.method} ${request.path}`);
    next();
});


//Middleware de autorizacion para rutas admin
const requireAdmin = (request, response, next) => {
    if (request.session.id_rol !== 2) {
        return response.status(404).send('La ruta no existe');
    }
    next();
};

//Middleware de autorizacion para rutas cliente
const requireCliente = (request, response, next) => {
    if (request.session.id_rol !== 1) {
        return response.status(404).send('La ruta no existe');
    }
    next();
};

// Rutas para admin (protegidas)
app.use('/admin', requireAdmin, adminHomeRoutes);
app.use('/admin', requireAdmin, adminProductoRoutes);
app.use('/admin', requireAdmin, adminOrdenesRoutes);
app.use('/admin', requireAdmin, adminClientesRoutes);
app.use('/admin', requireAdmin, adminEstadisticasRoutes);


// Rutas del Cliente
app.use('/cliente', requireCliente, clienteRoutes);

// Rutas del producto
const producto = require('./routes/producto.routes');
app.use('/product', requireCliente, producto);

//Rutas del Carrito
const carrito = require('./routes/cliente/carrito.routes');
app.use("/cart",requireCliente,carrito);

//Rutas de Ordenes
const ordenRoutes = require('./routes/orden.routes');
app.use("/orden", requireCliente, ordenRoutes);

app.use((request, response, next) => {
    response.status(404).send("La ruta no existe");
});

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('Token CSRF inválido');
    }
    next(err);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
