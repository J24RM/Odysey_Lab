const supabase = require('../utils/supabase');

module.exports = class Producto {

    static async encontrarProductoPorId(id_producto){
        const {data:detalleProducto ,error} = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', id_producto)
        if (error) throw error;

        return detalleProducto;
    }

    static async crearProducto({ nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave }) {
        const { data, error } = await supabase
            .from('producto')
            .insert({
                nombre,
                descripcion,
                url_imagen,
                unidad_venta,
                unidad_medida,
                peso,
                precio_unitario,
                activo,
                clave
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}