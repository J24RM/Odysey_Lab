const Estadisticas = require('../models/estadisticas.model');

//Accede al panel de estadisticas generales
exports.getEstadisticas = async (request, response) => {
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
        console.error("Error fetching admin estadísticas from Model:", error);
    }

    response.render('admin/stats', pageData);
};
