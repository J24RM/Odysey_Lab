const supabase = require('../utils/supabase');

module.exports = class Orden {

    static async agregarProductoAlCarrito(id_orden, id_producto, cantidad_ingresada){

        //Buscar si ya existe el producto en la orden
        const { data: producto, error } = await supabase
            .from('detalle_orden')
            .select('*')
            .eq('id_orden', id_orden)
            .eq('id_producto', id_producto)
            .maybeSingle();

        if (error) throw error;

        cantidad_ingresada = parseInt(cantidad_ingresada)

        console.log("Se va a agregar el producto " + id_producto)

        // Si existe 
        if (producto){
            const nuevaCantidad = producto.cantidad + cantidad_ingresada;

            const { error: updateError } = await supabase
                .from('detalle_orden')
                .update({ cantidad: nuevaCantidad })
                .eq('id_orden', id_orden)
                .eq('id_producto', id_producto);

            if (updateError) throw updateError;

            return;
        }

        // Si no existe 
        const { error: insertError } = await supabase
            .from('detalle_orden')
            .insert([
                {
                    id_orden: id_orden,
                    id_producto: id_producto,
                    cantidad: cantidad_ingresada
                }
            ]);

        if (insertError) throw insertError;

        return;
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