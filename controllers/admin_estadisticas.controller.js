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
        topSucursalesChart: [],
        porcentajeSucursales: 0,
        dbConnected: false
    };

    try {
        const [stats, topSucursalesChart, ventasDiarias] = await Promise.all([
            Estadisticas.getEstadisticasGenerales(),
            Estadisticas.getTopSucursalesPorOrdenes(),
            Estadisticas.getVentasDiariasGenerales()
        ]);
        if (stats) {
            pageData = { ...pageData, ...stats, dbConnected: true };
        }
        pageData.topSucursalesChart = topSucursalesChart || [];
        pageData.ventasDiarias = ventasDiarias || { actual: [], anterior: [], diasEnMes: 30, diasEnMesAnterior: 30 };
    } catch (error) {
        console.error("Error fetching admin estadísticas from Model:", error);
    }

    response.render('admin/stats', pageData);
};

exports.getEstadisticasSucursales = async (request, response) => {
    const edoFiltro = request.query.edo || null;

    let pageData = {
        usuario: request.session.usuario,
        sucursales: [],
        total: 0,
        estados: [],
        edoFiltro,
        frecuencias: [],
        dbConnected: false
    };

    try {
        const [statsVolumen, statsFrecuencia] = await Promise.all([
            Estadisticas.getEstadisticasSucursales(edoFiltro),
            Estadisticas.getFrequenciaSucursales()
        ]);

        if (statsVolumen)   pageData = { ...pageData, ...statsVolumen,   dbConnected: true };
        if (statsFrecuencia) pageData = { ...pageData, ...statsFrecuencia };
    } catch (error) {
        console.error('Error fetching estadísticas de sucursales:', error);
    }

    response.render('admin/stats_sucursales', pageData);
};

exports.getDetalleSucursalPagina = async (request, response) => {
    const { id } = request.params;
    const periodo = request.query.periodo || 'semana';

    let pageData = {
        usuario: request.session.usuario,
        nombre: '',
        edo: '',
        municipio: '',
        cantActual: 0,
        subtotalActual: '0.00',
        cambioCantidad: 0,
        cambioSubtotal: 0,
        periodo,
        labels: [],
        datosActual: [],
        datosAnterior: [],
        labelActual: 'Período Actual',
        labelAnterior: 'Período Anterior',
        id_sucursal: id,
        dbConnected: false
    };

    try {
        const detalle = await Estadisticas.getDetalleSucursalPagina(id, periodo);
        if (detalle) pageData = { ...pageData, ...detalle, id_sucursal: id, dbConnected: true };
    } catch (error) {
        console.error('Error fetching detalle sucursal página:', error);
    }

    response.render('admin/stats_sucursal_detalle', pageData);
};

exports.getDetalleSucursal = async (request, response) => {
    try {
        const detalle = await Estadisticas.getDetalleSucursal(request.params.id);
        response.json(detalle);
    } catch (error) {
        console.error('Error fetching detalle sucursal:', error);
        response.status(500).json({ error: 'Error al obtener detalle' });
    }
};

exports.getEstadisticasProductos = (request, response) => {
    response.render('admin/stats_productos', { usuario: request.session.usuario });
};

exports.getEstadisticas2 = (request, response) => {
    response.render('admin_estadisticas2', { usuario: request.session.usuario });
};
