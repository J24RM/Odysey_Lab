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
        let rfc = null;
        if (orden.id_sucursal) {
            const { data: suc } = await supabase
                .from('sucursal')
                .select('nombre_sucursal')
                .eq('id_sucursal', orden.id_sucursal)
                .single();
            if (suc) sucursalNombre = suc.nombre_sucursal;

            const { data: sc } = await supabase
                .from('sucursal_cuenta')
                .select('cuenta(rfc)')
                .eq('id_sucursal', orden.id_sucursal)
                .limit(1)
                .single();
            if (sc?.cuenta) rfc = sc.cuenta.rfc;
        }

        response.json({ orden, detalles, sucursalNombre, rfc });
    } catch (error) {
        console.error('Error al obtener detalle de orden:', error);
        response.status(500).json({ error: error.message });
    }
};

exports.getDetalleOrden = async (request, response) => {
    try {
        const { id } = request.params;
        const [ordenRaw, detalles] = await Promise.all([
            ordenModel.ObtenerOrdenPorId(id),
            ordenModel.obtenerDetalleOrden(id),
        ]);

        let sucursalNombre = 'N/A';
        if (ordenRaw.id_sucursal) {
            const { data: suc } = await supabase
                .from('sucursal')
                .select('nombre_sucursal')
                .eq('id_sucursal', ordenRaw.id_sucursal)
                .single();
            if (suc) sucursalNombre = suc.nombre_sucursal;
        }

        let usuarioNombre = String(ordenRaw.id_usuario);
        const { data: usr } = await supabase
            .from('usuario')
            .select('Nombre_usuario, email')
            .eq('id_usuario', ordenRaw.id_usuario)
            .single();
        if (usr) usuarioNombre = usr.Nombre_usuario || usr.email;

        const productos = detalles.map(d => ({
            nombre:         d.producto?.nombre        || 'Producto',
            cantidad:       d.cantidad,
            precioUnitario: Number(d.producto?.precio_unitario ?? 0).toFixed(2),
            total:          (d.cantidad * (d.producto?.precio_unitario ?? 0)).toFixed(2),
            imagen:         d.producto?.url_imagen
                                ? `/uploads/${d.producto.url_imagen}`
                                : '/img/botePintura.png',
        }));

        const orden = {
            folio:          ordenRaw.folio,
            fecha:          ordenRaw.fecha_realizada
                                ? new Date(ordenRaw.fecha_realizada).toLocaleDateString('es-MX')
                                : 'N/A',
            usuario:        usuarioNombre,
            sucursal:       sucursalNombre,
            totalProductos: detalles.reduce((sum, d) => sum + d.cantidad, 0),
            estado:         ordenRaw.estado,
            subtotal:       `$${Number(ordenRaw.subtotal).toFixed(2)}`,
            productos,
        };

        response.render('admin/order_detail', { usuario: request.session.usuario, orden });
    } catch (error) {
        console.error('Error al obtener detalle de orden:', error);
        response.status(500).send('Error al cargar el detalle de la orden');
    }
};
