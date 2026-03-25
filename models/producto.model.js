const supabase = require('../utils/supabase');

module.exports = class Orden {
    
    static async encontrarProductoPorId(id_producto){
        const {data:detalleProducto ,error} = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', id_producto)
        if (error) throw error;

        return detalleProducto;
    }
}