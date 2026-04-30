const supabase = require('../utils/supabase');

// Decodifica strings con encoding roto (bytes UTF-8 leídos como Latin-1)
function dec(s) {
    if (!s || (!s.includes('Ã') && !s.includes('Â'))) return s;
    try { return Buffer.from(s, 'latin1').toString('utf8'); } catch (_) { return s; }
}

// Formatea una fecha como "YYYY-MM-DD HH:MM:SS" (mismo formato que toLocaleString guarda en BD)
function toDbStr(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Extrae solo "YYYY-MM-DD" de una fecha local para comparar contra startsWith
function toDateStr(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

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
                    .select('id_producto, nombre, unidad_venta, unidad_medida, precio_unitario, url_imagen')
                    .eq('id_producto', idProd)
                    .single();

                if (prodData) {
                    result.productoMasVendido = {
                        nombre: dec(prodData.nombre) || ("ID Producto: " + prodData.id_producto),
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
                    .select('id_producto, nombre, unidad_venta, unidad_medida, precio_unitario, url_imagen')
                    .in('id_producto', topProdIds);

                if (prodsData) {
                    result.productosSemana = prodsData.map(p => ({
                        nombre: dec(p.nombre) || ("ID Producto: " + p.id_producto),
                        desc: p.unidad_venta + " " + p.unidad_medida,
                        precio: p.precio_unitario,
                        img: p.url_imagen
                    }));
                }
            }
        }

        return result;
    }

    static async getEstadisticasSucursales(edoFiltro = null, diasVol = null, desdeVol = null, hastaVol = null) {
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
            return { sucursales: [], total: 0, estados, edoFiltro, diasVol, desdeVol, hastaVol, diasVolPeriodo: null };
        }

        // 3. Calcular rango de fechas
        let fechaDesde = null, fechaHasta = null, diasVolPeriodo = null;
        if (desdeVol && hastaVol) {
            fechaDesde    = new Date(desdeVol + 'T00:00:00');
            fechaHasta    = new Date(hastaVol + 'T23:59:59');
            diasVolPeriodo = Math.round((fechaHasta - fechaDesde) / 86400000) + 1;
        } else if (diasVol) {
            fechaDesde    = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - diasVol);
            diasVolPeriodo = diasVol;
        }

        // 4. Traer órdenes de esas sucursales (con filtro de fecha si aplica)
        const ids = sucursalesData.map(s => s.id_sucursal);
        let ordenQuery = supabase
            .from('orden')
            .select('id_sucursal')
            .in('id_sucursal', ids);
        if (fechaDesde) ordenQuery = ordenQuery.gte('fecha_realizada', fechaDesde.toISOString());
        if (fechaHasta) ordenQuery = ordenQuery.lte('fecha_realizada', fechaHasta.toISOString());
        const { data: ordenes } = await ordenQuery;

        // 5. Agrupar por sucursal
        const conteo = {};
        for (const ord of (ordenes || [])) {
            const id = ord.id_sucursal;
            if (!id) continue;
            conteo[id] = (conteo[id] || 0) + 1;
        }

        // 6. Top 10 ordenado de mayor a menor
        const sucursales = sucursalesData.map(s => ({
            id_sucursal: s.id_sucursal,
            nombre: s.nombre_sucursal,
            total: conteo[s.id_sucursal] || 0
        })).sort((a, b) => b.total - a.total).slice(0, 10);

        const total = (ordenes || []).length;

        return { sucursales, total, estados, edoFiltro, diasVol, desdeVol, hastaVol, diasVolPeriodo };
    }

    static async getDetalleSucursalPagina(id_sucursal, periodo = 'semana', opciones = {}) {
        if (!supabase) return null;

        const hoy = new Date();

        let inicioActual, finActual, inicioAnterior, finAnterior, labels;

        if (periodo === 'semana') {
            // Lunes de la semana actual
            const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun ... 6=Sáb
            const diasDesdelLunes = diaSemana === 0 ? 6 : diaSemana - 1;

            inicioActual = new Date(hoy);
            inicioActual.setDate(hoy.getDate() - diasDesdelLunes);
            inicioActual.setHours(0, 0, 0, 0);

            // Semana anterior: lunes anterior → domingo anterior
            inicioAnterior = new Date(inicioActual);
            inicioAnterior.setDate(inicioActual.getDate() - 7);

            finAnterior = new Date(inicioActual);
            finAnterior.setSeconds(finAnterior.getSeconds() - 1); // domingo 23:59:59

            labels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
        } else if (periodo === 'quincena') {
            const hoyDia  = hoy.getDate();
            const mes     = hoy.getMonth();
            const anio    = hoy.getFullYear();

            if (hoyDia <= 15) {
                // Actual: primera quincena del mes actual (días 1-15)
                inicioActual   = new Date(anio, mes, 1, 0, 0, 0);
                // Anterior: segunda quincena del mes pasado (días 16-fin)
                inicioAnterior = new Date(anio, mes - 1, 16, 0, 0, 0);
            } else {
                // Actual: segunda quincena del mes actual (días 16-fin)
                inicioActual   = new Date(anio, mes, 16, 0, 0, 0);
                // Anterior: primera quincena del mes actual (días 1-15)
                inicioAnterior = new Date(anio, mes, 1, 0, 0, 0);
            }
            finAnterior = new Date(inicioActual.getTime() - 1);
            const primerDiaQuincena = hoyDia <= 15 ? 1 : 16;
            labels = Array.from({length: 15}, (_, i) => String(primerDiaQuincena + i));
        } else if (periodo === 'personalizado') {
            const MESES_CORTOS_P = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            inicioActual = new Date(opciones.desde + 'T00:00:00');
            finActual    = new Date(opciones.hasta + 'T23:59:59');

            const diffMs  = finActual.getTime() - inicioActual.getTime();
            const numDias = Math.min(Math.ceil(diffMs / 86400000) + 1, 90);

            if (opciones.comp_desde && opciones.comp_hasta) {
                inicioAnterior = new Date(opciones.comp_desde + 'T00:00:00');
                finAnterior    = new Date(opciones.comp_hasta + 'T23:59:59');
            } else {
                // Auto: mismo número de días inmediatamente antes del período actual
                finAnterior    = new Date(inicioActual.getTime() - 1);
                inicioAnterior = new Date(inicioActual);
                inicioAnterior.setDate(inicioActual.getDate() - numDias);
                inicioAnterior.setHours(0, 0, 0, 0);
            }

            labels = [];
            for (let i = 0; i < numDias; i++) {
                const d = new Date(inicioActual);
                d.setDate(inicioActual.getDate() + i);
                labels.push(numDias <= 20
                    ? `${d.getDate()} ${MESES_CORTOS_P[d.getMonth()]}`
                    : String(d.getDate()));
            }
        } else {
            // Mes: últimos 6 meses vs 6 meses anteriores, agrupados por mes
            inicioActual   = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1, 0, 0, 0);
            inicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1, 0, 0, 0);
            finAnterior    = new Date(inicioActual.getTime() - 1);

            const MESES_CORTOS_L = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            labels = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                labels.push(MESES_CORTOS_L[d.getMonth()]);
            }
        }

        // 1. Info de la sucursal
        const { data: sucursal } = await supabase
            .from('sucursal')
            .select('nombre_sucursal, edo, deleg_municipio')
            .eq('id_sucursal', id_sucursal)
            .single();

        // 2. Órdenes de ambos períodos en paralelo
        const filtroActual   = toDbStr(inicioActual);
        const filtroAnterior = toDbStr(inicioAnterior);
        console.log(`[detalle] sucursal=${id_sucursal} periodo=${periodo} inicioActual="${filtroActual}" inicioAnterior="${filtroAnterior}"`);

        let qActual = supabase.from('orden')
            .select('fecha_realizada, subtotal, estado')
            .eq('id_sucursal', id_sucursal)
            .gte('fecha_realizada', filtroActual)
            .neq('estado', 'cancelada');

        let qAnterior = supabase.from('orden')
            .select('fecha_realizada, subtotal')
            .eq('id_sucursal', id_sucursal)
            .gte('fecha_realizada', filtroAnterior)
            .neq('estado', 'cancelada');

        if (periodo === 'personalizado' && finActual && finAnterior) {
            qActual   = qActual.lte('fecha_realizada', toDbStr(finActual));
            qAnterior = qAnterior.lte('fecha_realizada', toDbStr(finAnterior));
        } else {
            qAnterior = qAnterior.lt('fecha_realizada', filtroActual);
        }

        const [{ data: ordenesActual, error: e1 }, { data: ordenesAnterior, error: e2 }] = await Promise.all([qActual, qAnterior]);
        console.log(`[detalle] resultados actual=${ordenesActual?.length ?? 'null'} error=${e1?.message ?? 'ok'} | anterior=${ordenesAnterior?.length ?? 'null'} error=${e2?.message ?? 'ok'}`);

        // 3. KPIs
        const cantActual   = (ordenesActual  || []).length;
        const cantAnterior = (ordenesAnterior || []).length;
        const subActual    = (ordenesActual  || []).reduce((s, o) => s + (parseFloat(o.subtotal) || 0), 0);
        const subAnterior  = (ordenesAnterior || []).reduce((s, o) => s + (parseFloat(o.subtotal) || 0), 0);

        const cambioCantidad = cantAnterior > 0 ? Math.round(((cantActual - cantAnterior) / cantAnterior) * 100) : (cantActual > 0 ? 100 : 0);
        const cambioSubtotal = subAnterior  > 0 ? Math.round(((subActual  - subAnterior)  / subAnterior)  * 100) : (subActual  > 0 ? 100 : 0);

        // 4. Datos para la gráfica día a día
        const datosActual = [], datosAnterior = [];

        if (periodo === 'semana') {
            // Iterar lunes→domingo de la semana actual y de la anterior
            for (let i = 0; i < 7; i++) {
                const dActual = new Date(inicioActual);
                dActual.setDate(inicioActual.getDate() + i);
                const dActualStr = toDateStr(dActual);
                datosActual.push((ordenesActual || []).filter(o => o.fecha_realizada.startsWith(dActualStr)).length);

                const dAnt = new Date(inicioAnterior);
                dAnt.setDate(inicioAnterior.getDate() + i);
                const dAntStr = toDateStr(dAnt);
                datosAnterior.push((ordenesAnterior || []).filter(o => o.fecha_realizada.startsWith(dAntStr)).length);
            }
        } else if (periodo === 'quincena') {
            // Iterar 15 días desde el inicio de cada quincena
            for (let i = 0; i < 15; i++) {
                const dActual = new Date(inicioActual);
                dActual.setDate(inicioActual.getDate() + i);
                const dActualStr = toDateStr(dActual);
                datosActual.push((ordenesActual || []).filter(o => o.fecha_realizada.startsWith(dActualStr)).length);

                const dAnt = new Date(inicioAnterior);
                dAnt.setDate(inicioAnterior.getDate() + i);
                const dAntStr = toDateStr(dAnt);
                datosAnterior.push((ordenesAnterior || []).filter(o => o.fecha_realizada.startsWith(dAntStr)).length);
            }
        } else if (periodo === 'personalizado') {
            // Iterar día a día según la longitud del rango actual (labels ya calculados)
            for (let i = 0; i < labels.length; i++) {
                const dActual = new Date(inicioActual);
                dActual.setDate(inicioActual.getDate() + i);
                const dActualStr = toDateStr(dActual);
                datosActual.push((ordenesActual || []).filter(o => o.fecha_realizada.startsWith(dActualStr)).length);

                const dAnt = new Date(inicioAnterior);
                dAnt.setDate(inicioAnterior.getDate() + i);
                const dAntStr = toDateStr(dAnt);
                datosAnterior.push((ordenesAnterior || []).filter(o => o.fecha_realizada.startsWith(dAntStr)).length);
            }
        } else {
            // Agrupar por mes: últimos 6 meses vs los 6 meses anteriores a esos
            for (let i = 5; i >= 0; i--) {
                const mesActual  = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                const mes  = mesActual.getMonth();
                const anio = mesActual.getFullYear();
                datosActual.push((ordenesActual || []).filter(o => {
                    const od = new Date(o.fecha_realizada);
                    return od.getMonth() === mes && od.getFullYear() === anio;
                }).length);

                const mesAnt  = new Date(hoy.getFullYear(), hoy.getMonth() - i - 6, 1);
                const mA  = mesAnt.getMonth();
                const anioA = mesAnt.getFullYear();
                datosAnterior.push((ordenesAnterior || []).filter(o => {
                    const od = new Date(o.fecha_realizada);
                    return od.getMonth() === mA && od.getFullYear() === anioA;
                }).length);
            }
        }

        // 5. Formatear fechas para la leyenda
        const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const fmt = d => `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;

        let finActualLabel, finAnteriorLabel;
        if (periodo === 'semana') {
            const domingoActual = new Date(inicioActual);
            domingoActual.setDate(inicioActual.getDate() + 6);
            finActualLabel   = `${fmt(inicioActual)} - ${fmt(domingoActual)}`;
            finAnteriorLabel = `${fmt(inicioAnterior)} - ${fmt(new Date(inicioActual.getTime() - 86400000))}`;
        } else if (periodo === 'personalizado') {
            finActualLabel   = `${fmt(inicioActual)} - ${fmt(new Date(opciones.hasta + 'T00:00:00'))}`;
            finAnteriorLabel = `${fmt(inicioAnterior)} - ${fmt(finAnterior)}`;
        } else if (periodo === 'quincena') {
            const mes = hoy.getMonth();
            const hoyDia = hoy.getDate();
            if (hoyDia <= 15) {
                finActualLabel = `1 ${MESES_CORTOS[mes]} - 15 ${MESES_CORTOS[mes]}`;
                const mesPasadoIdx = mes === 0 ? 11 : mes - 1;
                const ultimoDiaMesPasado = new Date(hoy.getFullYear(), mes, 0).getDate();
                finAnteriorLabel = `16 ${MESES_CORTOS[mesPasadoIdx]} - ${ultimoDiaMesPasado} ${MESES_CORTOS[mesPasadoIdx]}`;
            } else {
                const ultimoDiaMes = new Date(hoy.getFullYear(), mes + 1, 0).getDate();
                finActualLabel   = `16 ${MESES_CORTOS[mes]} - ${ultimoDiaMes} ${MESES_CORTOS[mes]}`;
                finAnteriorLabel = `1 ${MESES_CORTOS[mes]} - 15 ${MESES_CORTOS[mes]}`;
            }
        } else {
            const primerMesActual   = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
            const primerMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
            const ultimoMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
            finActualLabel   = `${MESES_CORTOS[primerMesActual.getMonth()]} - ${MESES_CORTOS[hoy.getMonth()]}`;
            finAnteriorLabel = `${MESES_CORTOS[primerMesAnterior.getMonth()]} - ${MESES_CORTOS[ultimoMesAnterior.getMonth()]}`;
        }

        return {
            nombre:              sucursal?.nombre_sucursal || 'Sucursal',
            edo:                 sucursal?.edo             || '',
            municipio:           sucursal?.deleg_municipio || '',
            cantActual,
            subtotalActual:      subActual.toFixed(2),
            cambioCantidad,
            cambioSubtotal,
            periodo,
            labels,
            datosActual,
            datosAnterior,
            labelActual:         `Período Actual (${finActualLabel})`,
            labelAnterior:       `Período Anterior (${finAnteriorLabel})`
        };
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

        const hace6Meses = new Date();
        hace6Meses.setMonth(hace6Meses.getMonth() - 6);

        const { data: ordenes } = await supabase
            .from('orden')
            .select('fecha_realizada')
            .eq('id_sucursal', id_sucursal)
            .gte('fecha_realizada', hace6Meses.toISOString());

        const conteo = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            conteo[key] = { label: MESES[d.getMonth()], total: 0 };
        }

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

static async getEstadisticasProductos(periodo = 'semana', busqueda = '', orden = 'nombre', dir = 'asc', fechaInicio = null, fechaFin = null) {
    if (!supabase) return { productos: [], periodo, busqueda };

    const ahora = new Date();
    let inicioActual, finActual, inicioAnterior;

    if (periodo === 'personalizado' && fechaInicio && fechaFin) {
        inicioActual = new Date(fechaInicio);
        finActual    = new Date(fechaFin);

        // Validar que las fechas sean válidas
        if (isNaN(inicioActual.getTime()) || isNaN(finActual.getTime())) {
            inicioActual   = new Date(ahora); inicioActual.setDate(ahora.getDate() - 7);
            finActual      = ahora;
            inicioAnterior = new Date(inicioActual); inicioAnterior.setDate(inicioActual.getDate() - 7);
        } else {
            finActual.setHours(23, 59, 59, 999);
            const diff = finActual - inicioActual;
            inicioAnterior = new Date(inicioActual.getTime() - diff);
        }
    } else if (periodo === 'semana') {
        inicioActual   = new Date(ahora); inicioActual.setDate(ahora.getDate() - 7);
        finActual      = ahora;
        inicioAnterior = new Date(inicioActual); inicioAnterior.setDate(inicioActual.getDate() - 7);
    } else {
        inicioActual   = new Date(ahora); inicioActual.setMonth(ahora.getMonth() - 1);
        finActual      = ahora;
        inicioAnterior = new Date(inicioActual); inicioAnterior.setMonth(inicioActual.getMonth() - 1);
    }

    let prodQuery = supabase.from('producto').select('id_producto, nombre, url_imagen, precio_unitario, unidad_venta, unidad_medida, peso').eq('activo', true);
    if (busqueda) prodQuery = prodQuery.ilike('nombre', `%${busqueda}%`);
    const { data: productosData } = await prodQuery;
    if (!productosData || productosData.length === 0) return { productos: [], periodo, busqueda, fechaInicio, fechaFin };

    const ids = productosData.map(p => p.id_producto);

    const [{ data: ordenesActual }, { data: ordenesAnterior }] = await Promise.all([
        supabase.from('orden').select('id_orden')
            .gte('fecha_realizada', inicioActual.toISOString())
            .lte('fecha_realizada', finActual.toISOString())
            .neq('estado', 'cancelada'),
        supabase.from('orden').select('id_orden')
            .gte('fecha_realizada', inicioAnterior.toISOString())
            .lt('fecha_realizada', inicioActual.toISOString())
            .neq('estado', 'cancelada')
    ]);

        const idsActual   = (ordenesActual   || []).map(o => o.id_orden);
        const idsAnterior = (ordenesAnterior || []).map(o => o.id_orden);

        const [{ data: detActual }, { data: detAnterior }] = await Promise.all([
            idsActual.length   > 0 ? supabase.from('detalle_orden').select('id_producto, cantidad').in('id_orden', idsActual).in('id_producto', ids)   : Promise.resolve({ data: [] }),
            idsAnterior.length > 0 ? supabase.from('detalle_orden').select('id_producto, cantidad').in('id_orden', idsAnterior).in('id_producto', ids) : Promise.resolve({ data: [] })
        ]);

        const productos = productosData.map(p => {
            const cantA = (detActual   || []).filter(d => d.id_producto === p.id_producto).reduce((s, d) => s + (d.cantidad || 0), 0);
            const cantP = (detAnterior || []).filter(d => d.id_producto === p.id_producto).reduce((s, d) => s + (d.cantidad || 0), 0);
            const precio = parseFloat(p.precio_unitario) || 0;
            const ventA = cantA * precio, ventP = cantP * precio;
            return {
                id_producto: p.id_producto,
                nombre: dec(p.nombre),
                url_imagen: p.url_imagen || '',
                cantidad: cantA,
                ventas: ventA,
                unidad_venta:  p.unidad_venta  || '—',   
                unidad_medida: p.unidad_medida || '—',  
                peso:          p.peso          ?? '—',   
                porcentajeCantidad: cantP > 0 ? ((cantA - cantP) / cantP) * 100 : (cantA > 0 ? 100 : 0),
                porcentajeVentas:   ventP > 0 ? ((ventA - ventP) / ventP) * 100 : (ventA > 0 ? 100 : 0)
            };
        }).sort((a, b) => {
        if (orden === 'cantidad') return dir === 'asc' ? a.cantidad - b.cantidad : b.cantidad - a.cantidad;
        if (orden === 'ventas')   return dir === 'asc' ? a.ventas   - b.ventas   : b.ventas   - a.ventas;
        return dir === 'asc' ? a.nombre.localeCompare(b.nombre, 'es') : b.nombre.localeCompare(a.nombre, 'es');
    });

        return { productos, periodo, busqueda, fechaInicio, fechaFin };
    }

   static async getEstadisticasDetalleProducto(id_producto, periodo = 'semana', fechaInicio = null, fechaFin = null) {
    if (!supabase) return null;

    const ahora = new Date();
    let inicioActual, finActual, inicioAnterior;

    if (periodo === 'personalizado' && fechaInicio && fechaFin) {
        inicioActual = new Date(fechaInicio + 'T00:00:00');
        finActual    = new Date(fechaFin    + 'T23:59:59');
        const diff   = finActual - inicioActual;
        inicioAnterior = new Date(inicioActual.getTime() - diff - 1000);
    } else if (periodo === 'semana') {
        inicioActual   = new Date(ahora); inicioActual.setDate(ahora.getDate() - 7);
        finActual      = ahora;
        inicioAnterior = new Date(inicioActual); inicioAnterior.setDate(inicioActual.getDate() - 7);
    } else {
        inicioActual   = new Date(ahora); inicioActual.setMonth(ahora.getMonth() - 1);
        finActual      = ahora;
        inicioAnterior = new Date(inicioActual); inicioAnterior.setMonth(inicioActual.getMonth() - 1);
    }

    const { data: prodData } = await supabase
        .from('producto').select('id_producto, nombre, url_imagen, precio_unitario')
        .eq('id_producto', id_producto).single();
    if (!prodData) return null;

    const [{ data: ordenesActual }, { data: ordenesAnterior }] = await Promise.all([
        supabase.from('orden').select('id_orden, fecha_realizada, id_sucursal')
            .gte('fecha_realizada', inicioActual.toISOString())
            .lte('fecha_realizada', finActual.toISOString())
            .neq('estado', 'cancelada'),
        supabase.from('orden').select('id_orden, fecha_realizada')
            .gte('fecha_realizada', inicioAnterior.toISOString())
            .lt('fecha_realizada', inicioActual.toISOString())
            .neq('estado', 'cancelada')
    ]);

    const idsActual   = (ordenesActual   || []).map(o => o.id_orden);
    const idsAnterior = (ordenesAnterior || []).map(o => o.id_orden);

    const [{ data: detActual }, { data: detAnterior }] = await Promise.all([
        idsActual.length   > 0 ? supabase.from('detalle_orden').select('id_orden, cantidad').in('id_orden', idsActual).eq('id_producto', id_producto)   : Promise.resolve({ data: [] }),
        idsAnterior.length > 0 ? supabase.from('detalle_orden').select('id_orden, cantidad').in('id_orden', idsAnterior).eq('id_producto', id_producto) : Promise.resolve({ data: [] })
    ]);

    const cantA  = (detActual   || []).reduce((s, d) => s + (d.cantidad || 0), 0);
    const cantP  = (detAnterior || []).reduce((s, d) => s + (d.cantidad || 0), 0);
    const precio = parseFloat(prodData.precio_unitario) || 0;
    const ventA  = cantA * precio, ventP = cantP * precio;

    // ── Gráfica por día ──────────────────────────────────────────────
    const ordenMapActual   = Object.fromEntries((ordenesActual   || []).map(o => [o.id_orden, o]));
    const ordenMapAnterior = Object.fromEntries((ordenesAnterior || []).map(o => [o.id_orden, o]));

    // Generar array de días del rango actual
    const diasRango = [];
    const cursor = new Date(inicioActual);
    while (cursor <= finActual) {
        diasRango.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    // Limitar a 31 días para no saturar la gráfica
    const diasMostrar = diasRango.slice(-31);

    const ordenesPorDia = diasMostrar.map(dia => {
        const strA = toDateStr(dia);
        return {
            dia: dia.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
            cantidad: (detActual || []).filter(d => ordenMapActual[d.id_orden]?.fecha_realizada?.startsWith(strA)).reduce((s, d) => s + (d.cantidad || 0), 0)
        };
    });

    const ordenesPorDiaAnterior = diasMostrar.map((dia, i) => {
        const diaAnt = new Date(inicioAnterior);
        diaAnt.setDate(diaAnt.getDate() + i);
        const strP = toDateStr(diaAnt);
        return {
            dia: dia.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
            cantidad: (detAnterior || []).filter(d => ordenMapAnterior[d.id_orden]?.fecha_realizada?.startsWith(strP)).reduce((s, d) => s + (d.cantidad || 0), 0)
        };
    });

    // ── Sucursales ───────────────────────────────────────────────────
    const sucursalCounts = {};
    for (const det of (detActual || [])) {
        const id = ordenMapActual[det.id_orden]?.id_sucursal;
        if (id) sucursalCounts[id] = (sucursalCounts[id] || 0) + (det.cantidad || 0);
    }
    let sucursales = [];
    const sucIds = Object.keys(sucursalCounts);
    if (sucIds.length > 0) {
        const { data: sucData } = await supabase.from('sucursal').select('id_sucursal, nombre_sucursal').in('id_sucursal', sucIds);
        sucursales = (sucData || []).map(s => ({ sucursal: s.nombre_sucursal, cantidad: sucursalCounts[s.id_sucursal] || 0, id_sucursal: s.id_sucursal })).sort((a, b) => b.cantidad - a.cantidad);
        console.log(sucursales)
    }

    return {
        producto: {
            id_producto: prodData.id_producto,
            nombre:      dec(prodData.nombre),
            url_imagen:  prodData.url_imagen || '',
            cantidad:    cantA,
            ventas:      ventA,
            porcentajeCantidad: cantP > 0 ? ((cantA - cantP) / cantP) * 100 : (cantA > 0 ? 100 : 0),
            porcentajeVentas:   ventP > 0 ? ((ventA - ventP) / ventP) * 100 : (ventA > 0 ? 100 : 0)
        },
        sucursales,
        ordenesPorDia,
        ordenesPorDiaAnterior,
        periodo,
        fechaInicio: fechaInicio || '',
        fechaFin:    fechaFin    || ''
    };
}

    static async getFrequenciaSucursales(edoFiltro = null, dias = 30, desdeFre = null, hastaFre = null) {
        if (!supabase) return null;

        // 1. Traer todos los estados disponibles para el dropdown
        const { data: edosData } = await supabase
            .from('sucursal')
            .select('edo');
        const estadosFre = [...new Set((edosData || []).map(s => s.edo).filter(Boolean))].sort();

        // 2. Traer sucursales (filtradas por estado si aplica)
        let sucursalQuery = supabase
            .from('sucursal')
            .select('id_sucursal, nombre_sucursal, edo');
        if (edoFiltro) sucursalQuery = sucursalQuery.eq('edo', edoFiltro);
        const { data: sucursalesData } = await sucursalQuery;

        if (!sucursalesData || sucursalesData.length === 0) {
            return { frecuencias: [], estadosFre, edoFiltroFre: edoFiltro };
        }

        // 3. Calcular rango de fechas
        let fechaDesde, fechaHasta, diasPeriodo;
        if (desdeFre && hastaFre) {
            fechaDesde  = new Date(desdeFre + 'T00:00:00');
            fechaHasta  = new Date(hastaFre + 'T23:59:59');
            diasPeriodo = Math.round((fechaHasta - fechaDesde) / 86400000) + 1;
        } else {
            fechaDesde  = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - dias);
            fechaHasta  = null;
            diasPeriodo = dias;
        }

        // 4. Traer órdenes del período de esas sucursales
        const ids = sucursalesData.map(s => s.id_sucursal);
        let ordenQuery = supabase
            .from('orden')
            .select('id_sucursal, fecha_realizada')
            .in('id_sucursal', ids)
            .gte('fecha_realizada', fechaDesde.toISOString());
        if (fechaHasta) ordenQuery = ordenQuery.lte('fecha_realizada', fechaHasta.toISOString());
        const { data: ordenes } = await ordenQuery;

        // 5. Agrupar conteo por sucursal
        const conteo = {};
        for (const ord of (ordenes || [])) {
            const id = ord.id_sucursal;
            if (!id) continue;
            conteo[id] = (conteo[id] || 0) + 1;
        }

        // 6. Calcular frecuencia y top 10
        const semanas = diasPeriodo / 7;
        const frecuencias = sucursalesData.map(s => {
            const totalMes = conteo[s.id_sucursal] || 0;
            const pedidosPorSemana = Math.round((totalMes / semanas) * 10) / 10;
            return {
                id_sucursal: s.id_sucursal,
                nombre: s.nombre_sucursal,
                totalMes,
                pedidosPorSemana
            };
        }).sort((a, b) => b.pedidosPorSemana - a.pedidosPorSemana).slice(0, 10);

        return { frecuencias, estadosFre, edoFiltroFre: edoFiltro, diasPeriodo };
    }

    static async getTop5ProductosDestacados() {
        if (!supabase) return [];

        const ahora = new Date();
        const hace30Dias = new Date(ahora);
        hace30Dias.setDate(ahora.getDate() - 30);

        const { data: ordenes } = await supabase
            .from('orden')
            .select('id_orden')
            .gte('fecha_realizada', hace30Dias.toISOString())
            .neq('estado', 'cancelada');

        if (!ordenes || ordenes.length === 0) return [];

        const idsOrdenes = ordenes.map(o => o.id_orden);

        const { data: detalles } = await supabase
            .from('detalle_orden')
            .select('id_producto, cantidad')
            .in('id_orden', idsOrdenes);

        if (!detalles || detalles.length === 0) return [];

        const conteo = {};
        for (const d of detalles) {
            conteo[d.id_producto] = (conteo[d.id_producto] || 0) + (d.cantidad || 0);
        }

        const top5Ids = Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => parseInt(id));

        if (top5Ids.length === 0) return [];

        const { data: productos } = await supabase
            .from('producto')
            .select('id_producto, nombre, url_imagen, precio_unitario')
            .in('id_producto', top5Ids)
            .eq('activo', true);

        if (!productos) return [];

        return top5Ids
            .map(id => productos.find(p => p.id_producto === id))
            .filter(Boolean);
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

    static getWeekRange(weeksAgo = 0) {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=Dom..6=Sab
        const diasDesdelLunes = diaSemana === 0 ? 6 : diaSemana - 1;

        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - diasDesdelLunes - weeksAgo * 7);
        lunes.setHours(0, 0, 0, 0);

        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        domingo.setHours(23, 59, 59, 999);

        return { start: lunes, end: domingo };
    }

    static async getTopSucursalesPorOrdenes(weeksAgo = 0) {
        const { start, end } = this.getWeekRange(weeksAgo);

        const { data: ordenes, error: e1 } = await supabase
            .from('orden')
            .select('id_sucursal, subtotal')
            .eq('estado', 'confirmada')
            .not('id_sucursal', 'is', null)
            .gte('fecha_realizada', start.toISOString())
            .lte('fecha_realizada', end.toISOString());
        if (e1) throw e1;

        const map = {};
        let totalVentasGlobal = 0;
        for (const o of (ordenes || [])) {
            const id = o.id_sucursal;
            if (!map[id]) map[id] = { total_ordenes: 0, total_ventas: 0 };
            map[id].total_ordenes++;
            const v = parseFloat(o.subtotal) || 0;
            map[id].total_ventas += v;
            totalVentasGlobal += v;
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
                total_ventas: parseFloat(stats.total_ventas.toFixed(2)),
                porcentaje: totalVentasGlobal > 0
                    ? Math.round((stats.total_ventas / totalVentasGlobal) * 100)
                    : 0
            }))
            .sort((a, b) => b.total_ventas - a.total_ventas)
            .slice(0, 10);
    }
};
