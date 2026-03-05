const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");

//Archivos de rutas
const authRoutes = require('./routes/auth.routes')

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(session({
    secret: 'mi string secreto que debe ser un string aleatorio muy largo, no como éste', 
    resave: false, //La sesión no se guardará en cada petición, sino sólo se guardará si algo cambió 
    saveUninitialized: false, //Asegura que no se guarde una sesión para una petición que no lo necesita
}));

app.use(bodyParser.urlencoded({extended: false}));

//Uso de rutas
app.use (authRoutes);

// Ruta raíz opcional
app.get('/', (req, res) => {
    res.redirect('/login');
});

//Ruta a panel de estadisticas
const estadisticasRoutes = require('./routes/admin_estadisticas.routes');
app.use(estadisticasRoutes);

//Ruta al historial de ordenes
const adminHistOrdenesRoutes = require('./routes/admin_hist_ordenes.routes');
app.use(adminHistOrdenesRoutes);

// Ruta a panel del cliente

//Error 404 (La ruta no existe)
app.use((request, response, next) => {
    response.status(404).send("La ruta no existe");
})

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});