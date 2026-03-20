const supabase = require('../utils/supabase');

module.exports = class Orden {

    static async obtenerOrdenEnEstadoCarrito(id_usuario) {

        const { data: orden, error } = await supabase
            .from('orden')
            .select('*')
            .eq('estado', 'carrito')
            .eq('id_usuario', id_usuario)
            .maybeSingle(); 

        if (error) throw error;

        if (!orden) {
            console.log("Se Creo el carrito")
            const { data: nuevaOrden, error: insertError } = await supabase
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

            if (insertError) throw insertError;

            return nuevaOrden;
        }

        return orden;
    }
}