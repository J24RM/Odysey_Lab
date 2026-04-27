const supabase = require('../utils/supabase');

module.exports = class Orden {

    static async agregarProductoAlCarrito(id_usuario, id_producto, cantidad_ingresada){
        const { data, error } = await supabase.rpc('agregar_item_carrito', {
            p_id_usuario: id_usuario,
            p_id_producto: id_producto,
            p_cantidad: parseInt(cantidad_ingresada) // Pasar a int porque el front da un str
        });
        if (error) throw error;
        return data;
    }


    static async eliminarProducto(id_orden, id_producto,){
        const {error} = await supabase
            .from('detalle_orden')
            .delete()
            .eq('id_producto', id_producto)
            .eq('id_orden', id_orden);

        if (error) throw error;
        return id_producto;
    }

    static async modificarCantidad(id_orden, id_producto, cantidad_ingresada){
        const {error} = await supabase
            .from('detalle_orden')
            .update({cantidad: cantidad_ingresada})
            .eq('id_producto', id_producto)
            .eq('id_orden', id_orden);

        if (error) throw error;
        return;
    }


    static async detalleOrden(id_orden){
        const{data: productos, error} = await supabase
            .from('detalle_orden')
            .select('id_producto, cantidad')
            .eq('id_orden', id_orden)

        if (error) throw error;

        return productos;
    }
}