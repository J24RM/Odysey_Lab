const supabase = require('../utils/supabase');

module.exports = class Orden {

    static async obtenerOrdenEnEstadoCarrito(id_usuario) {

        const { data: carrito, error } = await supabase
            .from('orden')
            .select('*')
            .eq('estado', 'carrito')
            .eq('id_usuario', id_usuario)
            .maybeSingle(); 

        if (error) throw error;

        return carrito;
    }

    static async crearCarrito(id_usuario){
        const { data: carrito, error } = await supabase
        .from('orden')
        .insert([
            {
                estado: 'carrito',
                subtotal: 0,
                id_usuario: id_usuario,
                id_campania: 1,
                fecha_realizada: null,
                    }
                ])
        .select()
        .single();

        if (error) throw error;

        return carrito;
    }

    static async registrarOrden(id_usuario, ) {

        const { data, error } = await supabase.rpc('confirmar_orden', {
            p_id_usuario: id_usuario
        });

        if (error) throw error;
        return data;
    }

    static async obtenerOrdenesPorUsuario(id_usuario) {
        const { data: ordenes, error } = await supabase
            .from('orden')
            .select('*, sucursal(nombre_sucursal)')
            .eq('id_usuario', id_usuario)
            .neq('estado', 'carrito')
            .order('fecha_realizada', { ascending: false });

        if (error) throw error;
        return ordenes || [];
    }

    static async obtenerOrdenesPorUsuarioPaginado(id_usuario, page = 1, perPage = 20) {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data: ordenes, error, count } = await supabase
            .from('orden')
            .select('*, sucursal(nombre_sucursal)', { count: 'exact' })
            .eq('id_usuario', id_usuario)
            .neq('estado', 'carrito')
            .order('fecha_realizada', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error) throw error;
        return { ordenes: ordenes || [], total: count || 0 };
    }

    static async CancelarOrden(id_orden) {
        const { data: orden, error } = await supabase
            .from('orden')
            .update({ estado: 'cancelada' })
            .eq('id_orden', id_orden)
            .single();

        if (error) throw error;
        return orden;
    }

    static async ObtenerOrdenPorId(id_orden){
        const {data: orden, error} = await supabase
            .from('orden')
            .select('*')
            .eq('id_orden', id_orden)
            .single();

        if (error) throw error;
        return orden;
    }

    static async obtenerDetalleOrden(id_orden) {
        const { data: detalles, error } = await supabase
            .from('detalle_orden')
            .select('cantidad, id_producto, producto(nombre, precio_unitario, url_imagen, clave)')
            .eq('id_orden', id_orden);

        if (error) throw error;
        return detalles || [];
    }

    static async actualizarSucursalPorFolio(folio, id_sucursal) {
        const { error } = await supabase
            .from('orden')
            .update({ id_sucursal })
            .eq('folio', folio);
        if (error) throw error;
    }

    static async obtenerTodasLasOrdenes(page = 1, perPage = 20) {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data: ordenes, error, count } = await supabase
            .from('orden')
            .select('id_orden, estado, folio, subtotal, fecha_realizada, usuario(email)', { count: 'exact' })
            .neq('estado', 'carrito')
            .order('fecha_realizada', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error) throw error;
        return { ordenes: ordenes || [], total: count || 0 };
    }

}