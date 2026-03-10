const Estadisticas = require('../models/estadisticas.model');

// Accede al panel de estadísticas generales (Página 1)
exports.getEstadisticas = async (request, response) => {
    if (!request.session.usuario) return response.redirect('/login');

    let pageData = {
        usuario: request.session.usuario,
        totalMensual: 0,
        productosMensual: 0,
        totalSemanal: 0,
        productosSemanal: 0,
        productoMasVendido: null,
        porcentajeProducto: 0,
        topSucursales: [],
        porcentajeSucursales: 0,
        dbConnected: false
    };

    try {
        const stats = await Estadisticas.getEstadisticasGenerales();
        if (stats) {
            pageData = { ...pageData, ...stats, dbConnected: true };
        }
    } catch (error) {
        console.error("Error fetching admin_estadisticas from Model:", error);
    }

    response.render('admin_estadisticas', pageData);
};

// Accede al panel de estadísticas de pedidos (Página 2)
exports.getEstadisticas2 = async (request, response) => {
    if (!request.session.usuario) return response.redirect('/login');

    let pageData = {
        usuario: request.session.usuario,
        diasSemana: [0, 0, 0, 0, 0], // Lun(0) - Vie(4) - asumiendo solo 5 dias
        productosSemana: [],
        dbConnected: false
    };

    try {
        const stats = await Estadisticas.getEstadisticasPedidos();
        if (stats) {
            pageData = { ...pageData, ...stats, dbConnected: true };
        }
    } catch (error) {
        console.error("Error fetching admin_estadisticas2 from Model:", error);
    }

    response.render('admin_estadisticas2', pageData);
};
