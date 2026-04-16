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

exports.getEstadisticasSucursales = (request, response) => {
    response.render('admin/stats_sucursales', { usuario: request.session.usuario });
};

// Estadisitcas Por Producto

exports.getEstadisticasDetalleProducto = async (request, response) => {
    try {
        console.log(request.params.id_producto)
        const  id  = request.params.id_producto;
        console.log(id)
        const { periodo = "mes" } = request.query;

        const { inicio, fin } = obtenerRangoFechas(periodo);
        const { inicioAnterior, finAnterior } = obtenerPeriodoAnterior(inicio, fin);

        const actual = await Estadisticas.getStatsProductoById(id, inicio, fin);
        const anterior = await Estadisticas.getStatsProductoById(id, inicioAnterior, finAnterior);

        const resumen = calcularComparacionProducto(actual, anterior);

        const ordenesPorDia = await Estadisticas.getOrdenesPorDia(id, inicio, fin);
        const ordenesPorDiaAnterior = await Estadisticas.getOrdenesPorDia(id, inicioAnterior, finAnterior);

        const sucursales = await Estadisticas.getSucursalesProducto(id, inicio, fin);

        response.render('admin/stats_producto_detalle', {
        usuario: request.session.usuario,
        producto: resumen,
        ordenesPorDia,
        ordenesPorDiaAnterior,
        sucursales,
        periodo
        });

    } catch (error) {
        console.error(error);
        response.status(500).send("Error en detalle de producto");
    }
    };

function calcularComparacionProducto(actual, anterior) {
    const act = actual[0] || { cantidad: 0, ventas: 0 };
    const prev = anterior[0] || { cantidad: 0, ventas: 0 };

    const porcentajeCantidad = prev.cantidad === 0
        ? 100
        : ((act.cantidad - prev.cantidad) / prev.cantidad) * 100;

    const porcentajeVentas = prev.ventas === 0
        ? 100
        : ((act.ventas - prev.ventas) / prev.ventas) * 100;

    return {
        ...act,
        porcentajeCantidad,
        porcentajeVentas
    };
    }

exports.getEstadisticasProductos = async (request, response) => {
    try {
        const { periodo = "mes", busqueda = "" } = request.query;

        const { inicio, fin } = obtenerRangoFechas(request.query.periodo);
        const { inicioAnterior, finAnterior } = obtenerPeriodoAnterior(inicio, fin);

        const actual = await Estadisticas.getStatsProductos(inicio, fin);
        const anterior = await Estadisticas.getStatsProductos(inicioAnterior, finAnterior);

        let productos = calcularComparacion(actual, anterior);

        if (busqueda) {
                productos = productos.filter(p =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        response.render('admin/stats_productos', {
            usuario: request.session.usuario,
            productos,
            periodo,
            busqueda
        });
    } catch (error) {
        console.error(error);
        response.status(500).send("Error al cargar estadísticas"); 
    }
};

function obtenerRangoFechas(periodo = "mes") {
    const hoy = new Date();
    let inicio, fin;

    if (periodo === "mes") {
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
    if (periodo === "3meses") {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    if (periodo === "anio") {
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
    }
    return { inicio, fin };
}

function obtenerPeriodoAnterior(inicio, fin) {
    const inicioAnterior = new Date(inicio);
    const finAnterior = new Date(fin);
    inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);
    finAnterior.setMonth(finAnterior.getMonth() - 1);
    return { inicioAnterior, finAnterior };
}

function calcularComparacion(actual, anterior) {
    const mapaAnterior = new Map();
    anterior.forEach(p => {
        mapaAnterior.set(p.id_producto, p);
    });
    return actual.map(p => {
        const prev = mapaAnterior.get(p.id_producto) || { cantidad: 0, ventas: 0 };
        const porcentajeCantidad = prev.cantidad === 0 ? 100 : ((p.cantidad - prev.cantidad) / prev.cantidad) * 100;
        const porcentajeVentas = prev.ventas === 0 ? 100 : ((p.ventas - prev.ventas) / prev.ventas) * 100;
        return { ...p, porcentajeCantidad, porcentajeVentas };
    });
}


exports.getEstadisticas2 = (request, response) => {
    response.render('admin_estadisticas2', { usuario: request.session.usuario });
};
