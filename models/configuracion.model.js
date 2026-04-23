const supabase = require('../utils/supabase');

module.exports = class Configuracion {

    static async ObtenerConfiguracionActiva() {
        const { data, error } = await supabase
            .from('configuraciones')
            .select('*')
            .eq('activo', true)
            .single();
        if (error) throw error;
        return data;
    }

    // Obtiene la primera fila de configuración (para el panel admin)
    static async ObtenerConfig() {
        const { data, error } = await supabase
            .from('configuraciones')
            .select('*')
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    // Actualiza (o inserta) la configuración
    static async GuardarConfig(campos) {
        const { data: existing } = await supabase
            .from('configuraciones')
            .select('id_configuraciones')
            .limit(1)
            .maybeSingle();

        if (existing) {
            const { data, error } = await supabase
                .from('configuraciones')
                .update(campos)
                .eq('id_configuraciones', existing.id_configuraciones)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('configuraciones')
                .insert({ ...campos, activo: true })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }
};
