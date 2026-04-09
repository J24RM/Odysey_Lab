const supabase = require('../utils/supabase');

module.exports = class Usuario {

    static async encontrarPorEmail(email) {
        const { data, error } = await supabase
            .from('usuario')
            .select('id_usuario, email, password_hash, id_rol')
            .eq('email', email)
            .single();

        if (error) throw error;
        return data;
    }

    static async obtenerClientes() {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_rol', 1)
            .order('email', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async obtenerClientePorId(id_usuario) {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', id_usuario)
            .eq('id_rol', 1)
            .single();

        if (error) throw error;
        return data;
    }
}
