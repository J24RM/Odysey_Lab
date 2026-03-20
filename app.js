require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");

// Archivos de rutas
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const clienteRoutes = require('./routes/cliente.routes');

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
const estadisticasRoutes = require('./routes/admin_estadisticas.routes');
app.use(estadisticasRoutes);

//Ruta al historial de ordenes
const adminHistOrdenesRoutes = require('./routes/admin_hist_ordenes.routes');
app.use(adminHistOrdenesRoutes);




//Rutas del Carrito
const carrito = require('./routes/carrito.routes');
app.use("/carrito", carrito);


//Middleware global de autenticacion
app.use((request, response, next) => {
    if (!request.session.usuario) {
        return response.redirect('/login');
    }
    next();
});

//Middleware de autorizacion para rutas admin
const requireAdmin = (request, response, next) => {
    if (request.session.rol !== 'admin') {
        return response.status(403).send('Acceso denegado. Solo administradores pueden acceder aquí.');
    }
    next();
};

//Middleware de autorizacion para rutas cliente
const requireCliente = (request, response, next) => {
    if (request.session.rol !== 'cliente') {
        return response.status(403).send('Acceso denegado. Solo clientes pueden acceder aquí.');
    }
    next();
};

//Rutas para admin 
app.use('/admin', requireAdmin, adminRoutes);

//Rutas para cliente
app.use(requireCliente, clienteRoutes);

app.use((request, response, next) => {
    response.status(404).send("La ruta no existe");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});