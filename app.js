require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");

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
    secret: 'mi string secreto que debe ser un string aleatorio muy largo, no como éste',
    resave: false, // La sesión no se guardará en cada petición, sino sólo se guardará si algo cambió
    saveUninitialized: false, // Asegura que no se guarde una sesión para una petición que no lo necesita
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

//Middleware global de autenticacion
app.use((request, response, next) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }
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

app.use((request, response, next) => {
    response.status(404).send("La ruta no existe");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
