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
}
