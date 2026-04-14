const supabase = require('../utils/supabase');

// Decodifica strings con encoding roto (bytes UTF-8 leídos como Latin-1)
function dec(s) {
    if (!s || (!s.includes('Ã') && !s.includes('Â'))) return s;
    try { return Buffer.from(s, 'latin1').toString('utf8'); } catch (_) { return s; }
}
function fixProducto(p) {
    if (!p) return p;
    return { ...p, nombre: dec(p.nombre), descripcion: dec(p.descripcion) };
}

module.exports = class Producto {
    static async fetchAll() {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .eq('activo', true)
            .order('nombre', { ascending: true });

        if (error) throw error;
        return productos.map(fixProducto);
    }

    static async findById(id_producto) {
        const { data: producto, error } = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', id_producto)
            .single();

        if (error) throw error;
        return fixProducto(producto);
    }

    static async encontrarProductoPorId(id_producto){
        const {data:detalleProducto ,error} = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', id_producto)
        if (error) throw error;

        return detalleProducto.map(fixProducto);
    }

    static async search(query) {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .eq('activo', true)
            .ilike('nombre', `%${query}%`)
            .order('nombre', { ascending: true });

        if (error) throw error;
        return productos.map(fixProducto);
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
        return productos.map(fixProducto);
    }

    static async searchByNameClaveId(query) {
        const { data: productos, error } = await supabase
            .from('producto')
            .select('*')
            .or(`nombre.ilike.%${query}%,clave.ilike.%${query}%,id_producto.eq.${isNaN(query) ? -1 : parseInt(query)}`);

        if (error) throw error;
        return productos.map(fixProducto);
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

    static async fetchPaginated(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
            .from('producto')
            .select('*', { count: 'exact' })
            .eq('activo', true)
            .order('nombre', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { productos: data.map(fixProducto), total: count };
    }

    static async fetchAllPaginated(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
            .from('producto')
            .select('*', { count: 'exact' })
            .order('nombre', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { productos: data.map(fixProducto), total: count };
    }
}