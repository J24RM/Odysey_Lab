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

    static async registrarOrden(id_orden) {
        // Obtener los detalles para calcular el subtotal
        const { data: detalles, error: detError } = await supabase
            .from('detalle_orden')
            .select('cantidad, id_producto, producto(precio_unitario)')
            .eq('id_orden', id_orden);

        if (detError) throw detError;

        // Calcular subtotal
        let subtotal = 0;
        detalles.forEach(d => {
            subtotal += d.cantidad * d.producto.precio_unitario;
        });

        // Cambiar estado de 'carrito' a 'confirmada'
        const { data: orden, error } = await supabase
            .from('orden')
            .update({ estado: 'confirmada', subtotal })
            .eq('id_orden', id_orden)
            .eq('estado', 'carrito')
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!orden) throw new Error('La orden ya fue registrada o no se encontró');
        return orden;
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