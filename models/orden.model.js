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
                // los demás campos déjalos null o con default en DB
                    }
                ])
        .select()
        .single();

        if (error) throw error;

        return carrito;
    }

    static async registrarOrden(id_orden, subtotal, folio, sucursal) {
        const { data: orden, error} = await supabase 
            .from('orden')
            .update({
                estado: 'confirmada', 
                folio: folio,
                subtotal: subtotal, 
                fecha_realizada: new Date(),
                id_sucursal: sucursal
            })
            .eq('id_orden', id_orden);

        if (error) throw error;
        return orden || [];
    }

    static async obtenerOrdenesPorUsuario(id_usuario) {
        const { data: ordenes, error } = await supabase
            .from('orden')
            .select('*')
            .eq('id_usuario', id_usuario)
            .neq('estado', 'carrito')
            .order('fecha_realizada', { ascending: false });

        if (error) throw error;
        return ordenes || [];
    }

    static async cancelarOrden(id_orden) {
        const { data: orden, error } = await supabase
            .from('orden')
            .update({ estado: 'cancelada' })
            .eq('id_orden', id_orden)
            .select()
            .single();

        if (error) throw error;
        return orden;
    }

    static async obtenerDetalleOrden(id_orden) {
        const { data: detalles, error } = await supabase
            .from('detalle_orden')
            .select('cantidad, id_producto, producto(nombre, precio_unitario, url_imagen)')
            .eq('id_orden', id_orden);

        if (error) throw error;
        return detalles || [];
    }
    
}