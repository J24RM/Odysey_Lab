const supabase = require('../utils/supabase');

module.exports = class Producto {
    static async fetchAll() {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .eq('activo', true)
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        return productos;
    }

    static async findById(id_producto) {
        const { data: producto, error } = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', id_producto)
            .single();
        
        if (error) throw error;
        return producto;
    }

    // Alias for compatibility with other controllers
    static async encontrarProductoPorId(id_producto) {
        return this.findById(id_producto);
    }

    static async search(query) {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .eq('activo', true)
            .ilike('nombre', `%${query}%`)
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        return productos;
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

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }
        return data;
    }

    static async fetchLimit(limit = 10) {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .order('id_producto', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return productos;
    }

    static async searchByNameClaveId(query) {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .or(`nombre.ilike.%${query}%,clave.ilike.%${query}%,id_producto.eq.${isNaN(query) ? -1 : parseInt(query)}`);

        if (error) throw error;
        return productos;
    }

    static async actualizarProducto(id_producto, { nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave }) {
        const { data, error } = await supabase
            .from('producto')
            .update({
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
            .eq('id_producto', id_producto)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}