const supabase = require('../utils/supabase');

module.exports = class Estadisticas {

    static getLastWeekRange() {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start: start.toISOString(), end: end.toISOString() };
    }

    static async getEstadisticasGenerales() {
        if (!supabase) return null;

        let result = {
            totalMensual: 0,
            totalSemanal: 0,
            productosSemanal: 0,
            productoMasVendido: null,
            porcentajeProducto: 0,
            topSucursales: [],
            porcentajeSucursales: 0
        };

        const { start: weekStart } = this.getLastWeekRange();
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);

        // 1. Total pedidos del mes
        const { data: ordenesMes } = await supabase
            .from('orden')
            .select('id_orden')
            .gte('fecha_realizada', monthStart.toISOString());
        result.totalMensual = ordenesMes?.length || 0;

        // 2. Total pedidos semanales y agrupación de sucursales
        const { data: ordenesSemana } = await supabase
            .from('orden')
            .select('id_orden, id_sucursal')
            .gte('fecha_realizada', weekStart);

        result.totalSemanal = ordenesSemana?.length || 0;

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

            result.topSucursales = topSucursales;
            result.porcentajeSucursales = result.totalSemanal > 0
                ? Math.round((sumTop3 / result.totalSemanal) * 100)
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
            result.productosSemanal = totalProductosSemanales;

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
                    result.productoMasVendido = {
                        nombre: "ID Producto: " + prodData.id_producto,
                        desc: prodData.unidad_venta + " " + prodData.unidad_medida,
                        img: prodData.url_imagen
                    };
                    result.porcentajeProducto = totalProductosSemanales > 0
                        ? Math.round((cantProd / totalProductosSemanales) * 100)
                        : 0;
                }
            }
        }

        return result;
    }

    static async getEstadisticasPedidos() {
        if (!supabase) return null;

        let result = {
            diasSemana: [0, 0, 0, 0, 0], // Lun(0) - Vie(4)
            productosSemana: []
        };

        const { start: weekStart } = this.getLastWeekRange();

        // 1. Array de Días de Pedidos
        const { data: ordenesSemana } = await supabase
            .from('orden')
            .select('id_orden, fecha_realizada')
            .gte('fecha_realizada', weekStart);

        (ordenesSemana || []).forEach(ord => {
            const date = new Date(ord.fecha_realizada);
            const day = date.getDay(); // 0(Sun) to 6(Sat)
            if (day >= 1 && day <= 5) { // Lunes=1.. Viernes=5
                result.diasSemana[day - 1]++;
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

            // Top 3 productos de la semana
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
                    result.productosSemana = prodsData.map(p => ({
                        nombre: "ID Producto: " + p.id_producto,
                        desc: p.unidad_venta + " " + p.unidad_medida,
                        precio: p.precio_unitario,
                        img: p.url_imagen
                    }));
                }
            }
        }

        return result;
    }

    static async getStatsProductos(inicio, fin) {
        const { data, error } = await supabase.rpc('stats_productos', {
            fecha_inicio: inicio.toISOString().split('T')[0],
            fecha_fin: fin.toISOString().split('T')[0]
        });

        if (error) throw error;

        return data;
    }

    static async getStatsProductoById(id, inicio, fin) {
        const { data, error } = await supabase.rpc('stats_producto_by_id', {
            fecha_inicio: inicio.toISOString().split('T')[0],
            fecha_fin: fin.toISOString().split('T')[0],
            p_id_producto: id,
        });

        if (error) throw error;
        return data;
    }

    static async getOrdenesMes(id, inicio, fin) {
        const { data, error } = await supabase.rpc('ordenes_por_dia_mes', {
            fecha_inicio: inicio.toISOString().split('T')[0],
            fecha_fin: fin.toISOString().split('T')[0],
            p_id_producto: id
        });

        if (error) throw error;
        return data;
    }

    static async getOrdenesSemana(id, inicio, fin) {
        const { data, error } = await supabase.rpc('ordenes_por_dia_semana', {
            fecha_inicio: inicio.toISOString().split('T')[0],
            fecha_fin: fin.toISOString().split('T')[0],
            p_id_producto: id
        });

        if (error) throw error;
        return data;
    }

    static async getSucursalesProducto(id, inicio, fin) {
        const { data, error } = await supabase.rpc('sucursales_producto', {
            p_id_producto: id,
            fecha_inicio: inicio.toISOString().split('T')[0],
            fecha_fin: fin.toISOString().split('T')[0]
        });

        if (error) throw error;
        return data;
    }

    static async getVentasDiariasGenerales() {
        if (!supabase) return { actual: [], anterior: [], diasEnMes: 30, diasEnMesAnterior: 30 };

        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        const mesFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const mesAnteriorFin = new Date(now.getFullYear(), now.getMonth(), 0);

        const [{ data: actual }, { data: anterior }] = await Promise.all([
            supabase.from('orden').select('fecha_realizada')
                .gte('fecha_realizada', mesInicio.toISOString())
                .lte('fecha_realizada', mesFin.toISOString()),
            supabase.from('orden').select('fecha_realizada')
                .gte('fecha_realizada', mesAnteriorInicio.toISOString())
                .lte('fecha_realizada', mesAnteriorFin.toISOString())
        ]);

        const diasEnMes = mesFin.getDate();
        const diasEnMesAnterior = mesAnteriorFin.getDate();

        const actualPorDia = Array(diasEnMes).fill(0);
        for (const o of (actual || [])) {
            const d = new Date(o.fecha_realizada).getDate() - 1;
            if (d >= 0 && d < diasEnMes) actualPorDia[d]++;
        }

        const anteriorPorDia = Array(diasEnMesAnterior).fill(0);
        for (const o of (anterior || [])) {
            const d = new Date(o.fecha_realizada).getDate() - 1;
            if (d >= 0 && d < diasEnMesAnterior) anteriorPorDia[d]++;
        }

        return { actual: actualPorDia, anterior: anteriorPorDia, diasEnMes, diasEnMesAnterior };
    }

    static async getTopSucursalesPorOrdenes() {
        const { data: ordenes, error: e1 } = await supabase
            .from('orden')
            .select('id_sucursal, subtotal')
            .eq('estado', 'confirmada')
            .not('id_sucursal', 'is', null);
        if (e1) throw e1;

        const map = {};
        for (const o of (ordenes || [])) {
            const id = o.id_sucursal;
            if (!map[id]) map[id] = { total_ordenes: 0, total_ventas: 0 };
            map[id].total_ordenes++;
            map[id].total_ventas += parseFloat(o.subtotal) || 0;
        }

        if (Object.keys(map).length === 0) return [];

        const ids = Object.keys(map).map(Number);

        const { data: sucursales, error: e2 } = await supabase
            .from('sucursal')
            .select('id_sucursal, nombre_sucursal')
            .in('id_sucursal', ids);
        if (e2) throw e2;

        const { data: junctions, error: e3 } = await supabase
            .from('sucursal_cuenta')
            .select('id_sucursal, cuenta(nombre_dueno)')
            .in('id_sucursal', ids);
        if (e3) throw e3;

        const sucMap = {};
        for (const s of (sucursales || [])) sucMap[s.id_sucursal] = s.nombre_sucursal;

        const cuentaMap = {};
        for (const j of (junctions || [])) {
            if (!cuentaMap[j.id_sucursal]) cuentaMap[j.id_sucursal] = j.cuenta?.nombre_dueno || 'Sin cuenta';
        }

        return Object.entries(map)
            .map(([id, stats]) => ({
                id_sucursal: parseInt(id),
                nombre_sucursal: sucMap[parseInt(id)] || 'Sucursal ' + id,
                nombre_cuenta: cuentaMap[parseInt(id)] || 'Sin cuenta',
                total_ordenes: stats.total_ordenes,
                total_ventas: parseFloat(stats.total_ventas.toFixed(2))
            }))
            .sort((a, b) => b.total_ordenes - a.total_ordenes)
            .slice(0, 10);
    }

};
