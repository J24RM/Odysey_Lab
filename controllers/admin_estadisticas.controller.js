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

exports.getEstadisticasSucursales = async (request, response) => {
    try {
        const topSucursales = await Estadisticas.getTopSucursalesPorOrdenes();
        response.render('admin/stats_sucursales', {
            usuario: request.session.usuario,
            topSucursales
        });
    } catch (error) {
        console.error('Error stats sucursales:', error);
        response.render('admin/stats_sucursales', {
            usuario: request.session.usuario,
            topSucursales: []
        });
    }
};

// Estadisitcas Por Producto

exports.getEstadisticasDetalleProducto = async (request, response) => {
    try {
        const  id  = request.params.id_producto;
        const { periodo = "semana" } = request.query;

        const { inicio, fin } = obtenerRangoFechas(periodo);
        const { inicioAnterior, finAnterior } = obtenerPeriodoAnterior(inicio, fin, periodo);

        const actual = await Estadisticas.getStatsProductoById(id, inicio, fin);
        const anterior = await Estadisticas.getStatsProductoById(id, inicioAnterior, finAnterior);

        const resumen = calcularComparacionProducto(actual, anterior);

        let ordenesPorDia;
        let ordenesPorDiaAnterior;

        if (periodo === 'semana') {
            ordenesPorDia = await Estadisticas.getOrdenesSemana(id, inicio, fin);
            ordenesPorDiaAnterior = await Estadisticas.getOrdenesSemana(id, inicioAnterior, finAnterior);

        } else {
            ordenesPorDia = await Estadisticas.getOrdenesMes(id, inicio, fin);
            ordenesPorDiaAnterior = await Estadisticas.getOrdenesMes(id, inicioAnterior, finAnterior, periodo);
        }


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
        const periodo = request.query.periodo || "semana";
        const { busqueda = "" } = request.query;

        const { inicio, fin } = obtenerRangoFechas(periodo);
        const { inicioAnterior, finAnterior } = obtenerPeriodoAnterior(inicio, fin, periodo);

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
            actual,
            anterior,
            periodo,
            busqueda
        });
    } catch (error) {
        console.error(error);
        response.status(500).send("Error al cargar estadísticas"); 
    }
};

exports.exportarEstadisticasProductosCSV = async (request, response) => {
    try {
        const periodo = request.query.periodo || "semana";
        const { busqueda = "" } = request.query;
        const { inicio, fin } = obtenerRangoFechas(periodo);
        const { inicioAnterior, finAnterior } = obtenerPeriodoAnterior(inicio, fin, periodo);

        const actual = await Estadisticas.getStatsProductos(inicio, fin);
        const anterior = await Estadisticas.getStatsProductos(inicioAnterior, finAnterior);

        let productos = calcularComparacion(actual, anterior);

        if (busqueda) {
            productos = productos.filter(p =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        
        const encabezados = [
            "Producto",
            "Cantidad Actual",
            "Ventas Actuales",
            "Cantidad Anterior",
            "Ventas Anteriores",
            "% Diferencia Cantidad",
            "% Diferencia Ventas"
        ].join(",");

        const mapaAnterior = new Map();
        anterior.forEach(p => mapaAnterior.set(p.id_producto, p));

        const filas = productos.map(p => {
            const prev = mapaAnterior.get(p.id_producto) || { cantidad: 0, ventas: 0 };
            const nombre = `"${p.nombre.replace(/"/g, '""')}"`; 
            return [
                nombre,
                p.cantidad,
                p.ventas,
                prev.cantidad,
                "$" + prev.ventas,
                Math.round(p.porcentajeCantidad),
                Math.round(p.porcentajeVentas)
            ].join(",");
        });

        const csv = [encabezados, ...filas].join("\n");

        response.setHeader("Content-Type", "text/csv; charset=utf-8");
        response.setHeader("Content-Disposition", `attachment; filename="estadisticas_productos_${periodo}.csv"`);
        response.send("\uFEFF" + csv); 

    } catch (error) {
        console.error(error);
        response.status(500).send("Error al exportar estadísticas");
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

    if (periodo === "semana") {
        const dia = hoy.getDay(); 

        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - dia); 

        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6); 
    }

    return { inicio, fin };
}

function obtenerPeriodoAnterior(inicio, fin, periodo) {
    const inicioAnterior = new Date(inicio);
    const finAnterior = new Date(fin);

    if (periodo === "semana") {
        inicioAnterior.setDate(inicioAnterior.getDate() - 7);
        finAnterior.setDate(finAnterior.getDate() - 7);
    } 
    else if (periodo === "mes" || periodo === "3meses") {
        inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);
        finAnterior.setMonth(finAnterior.getMonth() - 1);
    }

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
