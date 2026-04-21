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

    static async getEstadisticasSucursales(edoFiltro = null) {
        if (!supabase) return null;

        // 1. Traer todos los estados disponibles para el dropdown
        const { data: edosData } = await supabase
            .from('sucursal')
            .select('edo');
        const estados = [...new Set((edosData || []).map(s => s.edo).filter(Boolean))].sort();

        // 2. Traer sucursales (filtradas por estado si aplica)
        let sucursalQuery = supabase
            .from('sucursal')
            .select('id_sucursal, nombre_sucursal, edo');
        if (edoFiltro) sucursalQuery = sucursalQuery.eq('edo', edoFiltro);
        const { data: sucursalesData } = await sucursalQuery;

        if (!sucursalesData || sucursalesData.length === 0) {
            return { sucursales: [], total: 0, estados, edoFiltro };
        }

        // 3. Traer órdenes solo de esas sucursales
        const ids = sucursalesData.map(s => s.id_sucursal);
        const { data: ordenes } = await supabase
            .from('orden')
            .select('id_sucursal')
            .in('id_sucursal', ids);

        // 4. Agrupar por sucursal
        const conteo = {};
        for (const ord of (ordenes || [])) {
            const id = ord.id_sucursal;
            if (!id) continue;
            conteo[id] = (conteo[id] || 0) + 1;
        }

        // 5. Construir el array resultado, top 10 ordenado de mayor a menor
        const sucursales = sucursalesData.map(s => ({
            nombre: s.nombre_sucursal,
            total: conteo[s.id_sucursal] || 0
        })).sort((a, b) => b.total - a.total).slice(0, 10);

        const total = (ordenes || []).length;

        return { sucursales, total, estados, edoFiltro };
    }

    static async getDetalleSucursal(id_sucursal) {
        if (!supabase) return null;

        const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

        // 1. Nombre de la sucursal
        const { data: sucursal } = await supabase
            .from('sucursal')
            .select('nombre_sucursal')
            .eq('id_sucursal', id_sucursal)
            .single();

        // 2. Órdenes de los últimos 6 meses
        const hace6Meses = new Date();
        hace6Meses.setMonth(hace6Meses.getMonth() - 6);

        const { data: ordenes } = await supabase
            .from('orden')
            .select('fecha_realizada')
            .eq('id_sucursal', id_sucursal)
            .gte('fecha_realizada', hace6Meses.toISOString());

        // 3. Inicializar los últimos 6 meses con 0
        const conteo = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            conteo[key] = { label: MESES[d.getMonth()], total: 0 };
        }

        // 4. Contar órdenes por mes
        for (const ord of (ordenes || [])) {
            const d = new Date(ord.fecha_realizada);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (conteo[key]) conteo[key].total++;
        }

        const meses   = Object.values(conteo).map(m => m.label);
        const totales = Object.values(conteo).map(m => m.total);

        return {
            nombre: sucursal?.nombre_sucursal || 'Sucursal',
            meses,
            totales,
            totalHistorico: (ordenes || []).length
        };
    }

    static async getFrequenciaSucursales() {
        if (!supabase) return null;

        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        // 1. Traer órdenes de los últimos 30 días
        const { data: ordenes } = await supabase
            .from('orden')
            .select('id_sucursal, fecha_realizada')
            .gte('fecha_realizada', hace30Dias.toISOString());

        if (!ordenes || ordenes.length === 0) {
            return { frecuencias: [] };
        }

        // 2. Agrupar conteo por sucursal
        const conteo = {};
        for (const ord of ordenes) {
            const id = ord.id_sucursal;
            if (!id) continue;
            conteo[id] = (conteo[id] || 0) + 1;
        }

        // 3. Traer nombres de sucursales
        const ids = Object.keys(conteo);
        const { data: sucursalesData } = await supabase
            .from('sucursal')
            .select('id_sucursal, nombre_sucursal')
            .in('id_sucursal', ids);

        // 4. Calcular frecuencia: pedidos / 4.3 semanas
        const SEMANAS_EN_30_DIAS = 4.3;
        const frecuencias = (sucursalesData || []).map(s => {
            const totalMes = conteo[s.id_sucursal] || 0;
            const pedidosPorSemana = Math.round((totalMes / SEMANAS_EN_30_DIAS) * 10) / 10;
            return {
                nombre: s.nombre_sucursal,
                totalMes,
                pedidosPorSemana
            };
        }).sort((a, b) => b.pedidosPorSemana - a.pedidosPorSemana);

        return { frecuencias };
    }
};
