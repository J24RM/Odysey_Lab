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

        // Si existe 
        if (producto){
            const nuevaCantidad = producto.cantidad + cantidad_ingresada;
            console.log("Se actualizo la cantidad")

            const { error: updateError } = await supabase
                .from('detalle_orden')
                .update({ cantidad: nuevaCantidad })
                .eq('id_orden', id_orden)
                .eq('id_producto', id_producto);

            if (updateError) throw updateError;

            return;
        }

        // Si no existe 
        console.log("Se agrego el producto")
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
}