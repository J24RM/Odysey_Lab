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

    static async obtenerPromediosTodos() {
        const { data, error } = await supabase
            .from('calificacion')
            .select('id_producto, rating');

        if (error) throw error;

        const mapa = {};
        for (const { id_producto, rating } of data) {
            if (!mapa[id_producto]) mapa[id_producto] = { suma: 0, cantidad: 0 };
            mapa[id_producto].suma += rating;
            mapa[id_producto].cantidad += 1;
        }

        const resultado = {};
        for (const [id, { suma, cantidad }] of Object.entries(mapa)) {
            resultado[id] = Math.round((suma / cantidad) * 10) / 10;
        }
        return resultado;
    }

    static async obtenerPorProducto(id_producto) {
        const { data, error } = await supabase
            .from('calificacion')
            .select('rating, descripcion, fecha, usuario(email)')
            .eq('id_producto', id_producto)
            .order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
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
