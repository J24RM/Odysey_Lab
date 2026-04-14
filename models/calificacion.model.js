const supabase = require('../utils/supabase');

module.exports = class Calificacion {
    static async buscarPorUsuarioYProducto(id_usuario, id_producto) {
        const { data, error } = await supabase
            .from('calificacion')
            .select('*')
            .eq('id_usuario', id_usuario)
            .eq('id_producto', id_producto)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        return data || null;
    }

    static async insertar({ id_producto, id_usuario, rating, descripcion }) {
        const { data, error } = await supabase
            .from('calificacion')
            .insert([{
                id_producto,
                id_usuario,
                rating,
                descripcion: descripcion || null,
                fecha: new Date().toISOString()
            }]);

        if (error) throw error;
        return data;
    }
};
