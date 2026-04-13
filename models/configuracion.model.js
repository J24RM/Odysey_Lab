const supabase = require('../utils/supabase');

module.exports = class Configuracion {

    static async ObtenerConfiguracionActiva(){
        const {data: configuracion, error} = await supabase 
            .from('configuraciones')
            .select('*')
            .eq('activo', true)
            .single();

            if (error) throw error;
            return configuracion;
    }

}