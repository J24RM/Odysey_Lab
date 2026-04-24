const supabase = require('../utils/supabase');

module.exports = class Configuracion {

    // Obtiene la campaña activa (para vistas públicas/cliente)
    static async ObtenerConfiguracionActiva() {
        const { data, error } = await supabase
            .from('campania')
            .select('*')
            .eq('activo', true)
            .order('id_campania', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    // Obtiene la campaña más reciente (para el panel admin)
    static async ObtenerConfig() {
        const { data, error } = await supabase
            .from('campania')
            .select('*')
            .order('id_campania', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    // Obtiene todas las campañas para selectores
    static async fetchAllCampanias() {
        const { data, error } = await supabase
            .from('campania')
            .select('id_campania, nombre, activo')
            .order('id_campania', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // Agrega un producto a una campaña
    static async asociarProductoCampania(id_campania, id_producto) {
        const { error } = await supabase
            .from('producto_campania')
            .insert({ id_campania, id_producto });
        if (error) throw error;
    }

    // Actualiza la campaña más reciente (o inserta una si no existe)
    static async GuardarConfig(campos) {
        const { data: existing } = await supabase
            .from('campania')
            .select('id_campania')
            .order('id_campania', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existing) {
            const { data, error } = await supabase
                .from('campania')
                .update(campos)
                .eq('id_campania', existing.id_campania)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('campania')
                .insert({ ...campos, activo: false })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }
};
