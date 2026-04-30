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

    // Obtiene la campaña más reciente con URLs de banner resueltas (para res.locals.config)
    static async ObtenerConfig() {
        const { data, error } = await supabase
            .from('campania')
            .select('*')
            .eq('activo', true)
            .order('id_campania', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        if (!data) return null;

        const bannerIds = [data.banner_login, data.banner_general].filter(Boolean);
        if (bannerIds.length > 0) {
            const { data: banners } = await supabase
                .from('configuraciones')
                .select('id_configuraciones, banner')
                .in('id_configuraciones', bannerIds);
            const map = {};
            (banners || []).forEach(b => { map[b.id_configuraciones] = b.banner; });
            data.banner_login_url  = map[data.banner_login]  || null;
            data.banner_general_url = map[data.banner_general] || null;
        }

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

    // Verifica si ya hay alguna campaña activa (opcionalmente excluye un ID)
    static async hayOtraActiva(exceptoId = null) {
        let query = supabase.from('campania').select('id_campania').eq('activo', true);
        if (exceptoId) query = query.neq('id_campania', exceptoId);
        const { data, error } = await query;
        if (error) throw error;
        return data && data.length > 0;
    }

    // Crea una nueva campaña
    static async crearCampania(campos) {
        const { data, error } = await supabase
            .from('campania')
            .insert(campos)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Actualiza una campaña por ID
    static async actualizarCampania(id, campos) {
        const { data, error } = await supabase
            .from('campania')
            .update(campos)
            .eq('id_campania', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Obtiene todos los banners de una campaña desde configuraciones
    static async obtenerBannersDeCampania(id_camp) {
        const { data, error } = await supabase
            .from('configuraciones')
            .select('*')
            .eq('id_camp', id_camp)
            .order('id_configuraciones', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    // Agrega un banner a una campaña en configuraciones
    static async agregarBanner(id_camp, banner_filename) {
        const { data, error } = await supabase
            .from('configuraciones')
            .insert({ id_camp, banner: banner_filename })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Agrega un producto a una campaña
    static async asociarProductoCampania(id_campania, id_producto) {
        const { error } = await supabase
            .from('producto_campania')
            .insert({ id_campania, id_producto });
        if (error) throw error;
    }

    // Obtiene el tiempo de cancelación desde campania activa (schema post-migración)
    static async ObtenerTiempoCancelacion() {
        const { data, error } = await supabase
            .from('campania')
            .select('tiempo_de_cancelacion')
            .eq('activo', true)
            .order('id_campania', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data?.tiempo_de_cancelacion ?? null;
    }

    // Mantiene compatibilidad con código de productos que llama a GuardarConfig
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

    // Activa los productos de una campaña
    static async activarProductosDeCampania(id_campania) {
        const { data: relaciones, error: errRel } = await supabase
            .from('producto_campania')
            .select('id_producto')
            .eq('id_campania', id_campania);
        
        if (errRel) throw errRel;
        if (!relaciones || relaciones.length === 0) return;

        const ids = relaciones.map(r => r.id_producto);
        const { error } = await supabase
            .from('producto')
            .update({ activo: true })
            .in('id_producto', ids);
            
        if (error) throw error;
    }

    // Desactiva los productos de una campaña
    static async desactivarProductosDeCampania(id_campania) {
        const { data: relaciones, error: errRel } = await supabase
            .from('producto_campania')
            .select('id_producto')
            .eq('id_campania', id_campania);
        
        if (errRel) throw errRel;
        if (!relaciones || relaciones.length === 0) return;

        const ids = relaciones.map(r => r.id_producto);
        const { error } = await supabase
            .from('producto')
            .update({ activo: false })
            .in('id_producto', ids);
            
        if (error) throw error;
    }
};
