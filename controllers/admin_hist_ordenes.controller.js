const ordenModel = require('../models/orden.model');
const supabase = require('../utils/supabase');

exports.getHistorialOrdenes = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const perPage = 20;
        const { ordenes, total } = await ordenModel.obtenerTodasLasOrdenes(page, perPage);
        const totalPaginas = Math.ceil(total / perPage);

        response.render('admin/orders', {
            usuario: request.session.usuario,
            ordenes,
            paginaActual: page,
            totalPaginas,
            total
        });
    } catch (error) {
        console.error('Error al obtener historial de órdenes:', error);
        response.status(500).send('Error al cargar el historial de órdenes');
    }
};

exports.getDetalleOrdenJSON = async (request, response) => {
    try {
        const { id } = request.params;
        const orden = await ordenModel.ObtenerOrdenPorId(id);
        const detalles = await ordenModel.obtenerDetalleOrden(id);

        let sucursalNombre = 'N/A';
        if (orden.id_sucursal) {
            const { data: suc } = await supabase
                .from('sucursal')
                .select('nombre_sucursal')
                .eq('id_sucursal', orden.id_sucursal)
                .single();
            if (suc) sucursalNombre = suc.nombre_sucursal;
        }

        response.json({ orden, detalles, sucursalNombre });
    } catch (error) {
        console.error('Error al obtener detalle de orden:', error);
        response.status(500).json({ error: error.message });
    }
};

exports.getDetalleOrden = async (request, response) => {
    try {
        const { id } = request.params;
        const orden = await ordenModel.ObtenerOrdenPorId(id);
        const detalles = await ordenModel.obtenerDetalleOrden(id);
        response.render('admin/order_detail', { usuario: request.session.usuario, orden, detalles });
    } catch (error) {
        console.error('Error al obtener detalle de orden:', error);
        response.status(500).send('Error al cargar el detalle de la orden');
    }
};
