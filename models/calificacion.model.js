const supabase = require('../utils/supabase');

module.exports = class Calificacion {
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
