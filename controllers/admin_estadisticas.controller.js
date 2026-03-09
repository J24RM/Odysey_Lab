const supabase = require('../utils/supabase');

// Helper para obtener inicio y fin de hace 7 días
const getLastWeekRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return { start: start.toISOString(), end: end.toISOString() };
};

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

    if (supabase) {
        pageData.dbConnected = true;
        const { start: weekStart, end: now } = getLastWeekRange();

        // Obtenemos mes para los cálculos
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);

        try {
            // 1. Total pedidos del mes
            const { data: ordenesMes } = await supabase
                .from('orden')
                .select('id_orden')
                .gte('fecha_realizada', monthStart.toISOString());
            pageData.totalMensual = ordenesMes?.length || 0;

            // 2. Total pedidos semanales y agrupación de sucursales
            const { data: ordenesSemana } = await supabase
                .from('orden')
                .select('id_orden, id_sucursal')
                .gte('fecha_realizada', weekStart);

            pageData.totalSemanal = ordenesSemana?.length || 0;

            // Agrupar pedidos por sucursal
            const sucursalCounts = {};
            for (const ord of (ordenesSemana || [])) {
                if (!sucursalCounts[ord.id_sucursal]) sucursalCounts[ord.id_sucursal] = 0;
                sucursalCounts[ord.id_sucursal]++;
            }

            // Top 3 sucursales
            if (Object.keys(sucursalCounts).length > 0) {
                const topIds = Object.entries(sucursalCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3);

                let sumTop3 = 0;
                const topSucursales = [];

                for (const [sId, count] of topIds) {
                    sumTop3 += count;
                    const { data: sucData } = await supabase
                        .from('sucursal')
                        .select('nombre_sucursal')
                        .eq('id_sucursal', sId)
                        .single();
                    if (sucData) {
                        topSucursales.push({ nombre: sucData.nombre_sucursal, cantidad: count });
                    }
                }

                pageData.topSucursales = topSucursales;
                pageData.porcentajeSucursales = pageData.totalSemanal > 0
                    ? Math.round((sumTop3 / pageData.totalSemanal) * 100)
                    : 0;
            }

            // 3. Obtener detalle de ordenes (productos vendidos) semanales
            const ordenIds = ordenesSemana?.map(o => o.id_orden) || [];
            if (ordenIds.length > 0) {
                const { data: detalles } = await supabase
                    .from('detalle_orden')
                    .select('id_producto, cantidad')
                    .in('id_orden', ordenIds);

                let totalProductosSemanales = 0;
                const prodCounts = {};

                // Sumar totales
                (detalles || []).forEach(d => {
                    const q = d.cantidad || 0;
                    totalProductosSemanales += q;
                    if (!prodCounts[d.id_producto]) prodCounts[d.id_producto] = 0;
                    prodCounts[d.id_producto] += q;
                });
                pageData.productosSemanal = totalProductosSemanales;

                // Encontrar el producto más vendido de la semana
                if (Object.keys(prodCounts).length > 0) {
                    const topProdId = Object.entries(prodCounts).sort(([, a], [, b]) => b - a)[0];
                    const [idProd, cantProd] = topProdId;

                    const { data: prodData } = await supabase
                        .from('producto')
                        .select('id_producto, unidad_venta, unidad_medida, precio_unitario, url_imagen')
                        .eq('id_producto', idProd)
                        .single();

                    if (prodData) {
                        pageData.productoMasVendido = {
                            nombre: "ID Producto: " + prodData.id_producto, // As fallback as name column is unseen
                            desc: prodData.unidad_venta + " " + prodData.unidad_medida,
                            img: prodData.url_imagen
                        };
                        pageData.porcentajeProducto = totalProductosSemanales > 0
                            ? Math.round((cantProd / totalProductosSemanales) * 100)
                            : 0;
                    }
                }
            }

        } catch (error) {
            console.error("Error fetching admin_estadisticas Supabase:", error);
        }
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

    if (supabase) {
        pageData.dbConnected = true;
        const { start: weekStart, end: now } = getLastWeekRange();

        try {
            // 1. Array de Días de Pedidos (usando JS Dates local)
            const { data: ordenesSemana } = await supabase
                .from('orden')
                .select('id_orden, fecha_realizada')
                .gte('fecha_realizada', weekStart);

            (ordenesSemana || []).forEach(ord => {
                const date = new Date(ord.fecha_realizada);
                const day = date.getDay(); // 0(Sun) to 6(Sat)
                if (day >= 1 && day <= 5) { // Lunes=1.. Viernes=5
                    pageData.diasSemana[day - 1]++;
                }
            });

            // 2. Productos Más pedidos semanalmente
            const ordenIds = ordenesSemana?.map(o => o.id_orden) || [];
            if (ordenIds.length > 0) {
                const { data: detalles } = await supabase
                    .from('detalle_orden')
                    .select('id_producto, cantidad')
                    .in('id_orden', ordenIds);

                const prodCounts = {};
                (detalles || []).forEach(d => {
                    const q = d.cantidad || 0;
                    if (!prodCounts[d.id_producto]) prodCounts[d.id_producto] = 0;
                    prodCounts[d.id_producto] += q;
                });

                // Top 2/3 productos de la semana
                const topProdIds = Object.entries(prodCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([id]) => id);

                if (topProdIds.length > 0) {
                    const { data: prodsData } = await supabase
                        .from('producto')
                        .select('id_producto, unidad_venta, unidad_medida, precio_unitario, url_imagen')
                        .in('id_producto', topProdIds);

                    if (prodsData) {
                        pageData.productosSemana = prodsData.map(p => ({
                            nombre: "ID Producto: " + p.id_producto,
                            desc: p.unidad_venta + " " + p.unidad_medida,
                            precio: p.precio_unitario,
                            img: p.url_imagen
                        }));
                    }
                }
            }

        } catch (error) {
            console.error("Error fetching admin_estadisticas2 Supabase:", error);
        }
    }

    response.render('admin_estadisticas2', pageData);
};
