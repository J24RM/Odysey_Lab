const supabase = require('../utils/supabase');

module.exports = class Log {
    static async registrar(id_usuario, accion) {
        const { data, error } = await supabase
            .from('logs')
            .insert([{ accion, id_usuario }]);

        if (error) throw error;
        return data;
    }

    static async _agregarNombresUsuario(logs) {
        if (logs.length === 0) return logs;

        const ids = [...new Set(logs.map(l => l.id_usuario).filter(Boolean))];
        const { data: usuarios, error } = await supabase
            .from('usuario')
            .select('id_usuario, Nombre_usuario, email')
            .in('id_usuario', ids);

        if (error) throw error;

        const mapa = {};
        for (const u of usuarios) mapa[u.id_usuario] = u;

        return logs.map(l => ({ ...l, usuario: mapa[l.id_usuario] || null }));
    }

    static async obtenerTodos() {
        const { data, error } = await supabase
            .from('logs')
            .select('id_log, accion, time, id_usuario')
            .order('time', { ascending: false });

        if (error) throw error;
        return Log._agregarNombresUsuario(data || []);
    }

    static async obtenerPorUsuario(id_usuario) {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);

        const { data, error } = await supabase
            .from('logs')
            .select('id_log, accion, time, id_usuario')
            .eq('id_usuario', id_usuario)
            .gte('time', hace7Dias.toISOString())
            .order('time', { ascending: false });

        if (error) throw error;
        return Log._agregarNombresUsuario(data || []);
    }
};
