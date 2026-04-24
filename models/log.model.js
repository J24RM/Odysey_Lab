const supabase = require('../utils/supabase');

module.exports = class Log {
    static async registrar(id_usuario, accion) {
        const { data, error } = await supabase
            .from('logs')
            .insert([{ accion, id_usuario }]);

        if (error) throw error;
        return data;
    }

    static async obtenerTodos() {
        const { data, error } = await supabase
            .from('logs')
            .select('id_log, accion, time, id_usuario, usuario(Nombre_usuario, email)')
            .order('time', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async obtenerPorUsuario(id_usuario) {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);

        const { data, error } = await supabase
            .from('logs')
            .select('id_log, accion, time, id_usuario, usuario(Nombre_usuario, email)')
            .eq('id_usuario', id_usuario)
            .gte('time', hace7Dias.toISOString())
            .order('time', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
