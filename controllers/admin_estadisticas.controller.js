const Estadisticas = require('../models/estadisticas.model');
const ExcelJS = require('exceljs');
const campaniaModel = require('../models/configuracion.model')

//Accede al panel de estadisticas generales
exports.getEstadisticas = async (request, response) => {
    const semanaFiltro = [0, 1, 2].includes(Number(request.query.semana))
        ? Number(request.query.semana)
        : 0;

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
        semanaFiltro,
        dbConnected: false
    };

    try {
        const [stats, topSucursalesChart, ventasDiarias] = await Promise.all([
            Estadisticas.getEstadisticasGenerales(),
            Estadisticas.getTopSucursalesPorOrdenes(semanaFiltro),
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
    const edoFiltro    = request.query.edo    || null;
    const edoFiltroFre = request.query.edoFre || null;
    const desdeFre     = request.query.desdeFre || null;
    const hastaFre     = request.query.hastaFre || null;
    const desdeVol     = request.query.desdeVol || null;
    const hastaVol     = request.query.hastaVol || null;
    const DIAS_VALIDOS = [7, 15, 30, 60, 90];
    const diasFre = DIAS_VALIDOS.includes(Number(request.query.diasFre)) ? Number(request.query.diasFre) : 30;
    const diasVol = DIAS_VALIDOS.includes(Number(request.query.diasVol)) ? Number(request.query.diasVol) : null;

    let pageData = {
        usuario: request.session.usuario,
        sucursales: [],
        total: 0,
        estados: [],
        edoFiltro,
        diasVol,
        desdeVol,
        hastaVol,
        diasVolPeriodo: null,
        frecuencias: [],
        estadosFre: [],
        edoFiltroFre,
        diasFre,
        desdeFre,
        hastaFre,
        diasPeriodo: diasFre,
        dbConnected: false
    };

    try {
        const [statsVolumen, statsFrecuencia] = await Promise.all([
            Estadisticas.getEstadisticasSucursales(edoFiltro, diasVol, desdeVol, hastaVol),
            Estadisticas.getFrequenciaSucursales(edoFiltroFre, diasFre, desdeFre, hastaFre)
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
    let periodo      = request.query.periodo    || 'semana';
    const desde      = request.query.desde      || '';
    const hasta      = request.query.hasta      || '';
    const comp_desde = request.query.comp_desde || '';
    const comp_hasta = request.query.comp_hasta || '';

    // Si eligió personalizado pero no llenó las fechas, caer a semana
    if (periodo === 'personalizado' && (!desde || !hasta)) {
        periodo = 'semana';
    }

    const opciones = { desde, hasta, comp_desde, comp_hasta };

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
        desde,
        hasta,
        comp_desde,
        comp_hasta,
        labels: [],
        datosActual: [],
        datosAnterior: [],
        labelActual: 'Período Actual',
        labelAnterior: 'Período Anterior',
        id_sucursal: id,
        dbConnected: false
    };

    try {
        const detalle = await Estadisticas.getDetalleSucursalPagina(id, periodo, opciones);
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

exports.getEstadisticasProductos = async (request, response) => {
    const periodo    = request.query.periodo  || 'semana';
    const busqueda   = request.query.busqueda || '';
    const orden      = ['nombre', 'cantidad', 'ventas'].includes(request.query.orden) ? request.query.orden : 'nombre';
    const dir        = request.query.dir === 'desc' ? 'desc' : 'asc';
    const fechaInicio = request.query.fechaInicio || null;
    const fechaFin    = request.query.fechaFin    || null;

    try {
        const data = await Estadisticas.getEstadisticasProductos(periodo, busqueda, orden, dir, fechaInicio, fechaFin);
        const campaña = await campaniaModel.ObtenerConfig();
        response.render('admin/stats_productos', { usuario: request.session.usuario, ...data, orden, dir, campañaNombre: campaña.nombre });
    } catch (error) {
        console.error('Error fetching estadísticas productos:', error);
        response.render('admin/stats_productos', { usuario: request.session.usuario, productos: [], periodo, busqueda, orden, dir, fechaInicio: null, fechaFin: null ,campañaNombre: ""});
    }
};

exports.getEstadisticasDetalleProducto = async (request, response) => {
    const { id_producto } = request.params;
    const periodo     = request.query.periodo     || 'semana';
    const fechaInicio = request.query.fechaInicio || null;
    const fechaFin    = request.query.fechaFin    || null;

    try {
        const data = await Estadisticas.getEstadisticasDetalleProducto(id_producto, periodo, fechaInicio, fechaFin);
        if (!data) return response.redirect('/admin/stats/productos');
        response.render('admin/stats_producto_detalle', { usuario: request.session.usuario, ...data });
    } catch (error) {
        console.error('Error fetching estadísticas detalle producto:', error);
        response.redirect('/admin/stats/productos');
    }
};

exports.exportarEstadisticasProductosExcel = async (request, response) => {
    const periodo     = request.query.periodo     || 'semana';
    const busqueda    = request.query.busqueda    || '';
    const fechaInicio = request.query.fechaInicio || null;
    const fechaFin    = request.query.fechaFin    || null;

    try {
        const { productos } = await Estadisticas.getEstadisticasProductos(periodo, busqueda, 'nombre', 'asc', fechaInicio, fechaFin);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema';
        const sheet = workbook.addWorksheet('Estadísticas Productos', {
            views: [{ state: 'frozen', ySplit: 2 }]
        });

        // ── Título ──────────────────────────────────────────────────────────
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `Estadísticas de Productos — Período: ${periodo.toUpperCase()}`;
        titleCell.font      = { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 32;

        // ── Cabeceras ────────────────────────────────────────────────────────
        const headers = [
            { header: 'Producto',        key: 'nombre',        width: 30 },
            { header: 'Unidad Venta',    key: 'unidad_venta',  width: 16 },
            { header: 'Unidad Medida',   key: 'unidad_medida', width: 16 },
            { header: 'Peso',            key: 'peso',          width: 10 },
            { header: 'Cant. Ordenada',  key: 'cantidad',      width: 16 },
            { header: '% Cambio Cant.',  key: 'pct_cantidad',  width: 16 },
            { header: 'Ventas',          key: 'ventas',        width: 16 },
            { header: '% Cambio Ventas', key: 'pct_ventas',    width: 17 },
        ];

        sheet.columns = headers;

        const headerRow = sheet.getRow(2);
        headerRow.height = 22;
        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value     = h.header;
            cell.font      = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border    = {
                bottom: { style: 'medium', color: { argb: 'FF1F3864' } },
                right:  { style: 'thin',   color: { argb: 'FFBDD7EE' } },
            };
        });

        // ── Filas de datos ───────────────────────────────────────────────────
        const ROW_LIGHT = 'FFDCE6F1';
        const ROW_WHITE = 'FFFFFFFF';

        (productos || []).forEach((p, idx) => {
            const bgColor = idx % 2 === 0 ? ROW_WHITE : ROW_LIGHT;

            const row = sheet.addRow({
                nombre:        p.nombre,
                unidad_venta:  p.unidad_venta  || '—',
                unidad_medida: p.unidad_medida || '—',
                peso:          p.peso          ?? '—',
                cantidad:      p.cantidad,
                pct_cantidad:  Math.round(p.porcentajeCantidad),
                ventas:        p.ventas,
                pct_ventas:    Math.round(p.porcentajeVentas),
            });
            row.height = 20;

            row.eachCell((cell, colNumber) => {
                cell.font      = { name: 'Arial', size: 10 };
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
                cell.border    = {
                    bottom: { style: 'thin', color: { argb: 'FFBDD7EE' } },
                    right:  { style: 'thin', color: { argb: 'FFBDD7EE' } },
                };
            });

            row.getCell('ventas').numFmt = '"$"#,##0.00';

            // Color semáforo % cantidad
            const pctCantCell  = row.getCell('pct_cantidad');
            const valCant      = Math.round(p.porcentajeCantidad);
            pctCantCell.value  = valCant;
            pctCantCell.numFmt = '0"%"';
            pctCantCell.font   = {
                name: 'Arial', size: 10, bold: true,
                color: { argb: valCant >= 0 ? 'FF1F7A45' : 'FFC00000' },
            };

            // Color semáforo % ventas
            const pctVentasCell  = row.getCell('pct_ventas');
            const valVentas      = Math.round(p.porcentajeVentas);
            pctVentasCell.value  = valVentas;
            pctVentasCell.numFmt = '0"%"';
            pctVentasCell.font   = {
                name: 'Arial', size: 10, bold: true,
                color: { argb: valVentas >= 0 ? 'FF1F7A45' : 'FFC00000' },
            };
        });

        const dataStart = 3;
        const dataEnd   = 2 + (productos || []).length;
        const totalRow  = sheet.addRow({});
        totalRow.height = 22;

        const totalLabel     = totalRow.getCell(1);
        totalLabel.value     = 'TOTAL';
        totalLabel.font      = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        totalLabel.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
        totalLabel.alignment = { horizontal: 'center', vertical: 'middle' };

        [5, 7].forEach(col => {
            const cell      = totalRow.getCell(col);
            const colLetter = sheet.getColumn(col).letter;
            cell.value      = { formula: `=SUM(${colLetter}${dataStart}:${colLetter}${dataEnd})` };
            cell.font       = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            cell.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
            cell.alignment  = { horizontal: 'center', vertical: 'middle' };
            if (col === 7) cell.numFmt = '"$"#,##0.00';
        });

        [2, 3, 4, 6, 8].forEach(col => {
            totalRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
        });

        response.setHeader('Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition',
            `attachment; filename="estadisticas_productos_${periodo}.xlsx"`);

        await workbook.xlsx.write(response);
        response.end();

    } catch (error) {
        console.error('Error exportando estadísticas productos:', error);
        response.status(500).send('Error al exportar');
    }
};

