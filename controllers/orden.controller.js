const Orden = require('../models/orden.model');
const supabase = require('../utils/supabase');

exports.getOrdenes = async (req, res) => {

};

exports.postRegistrarOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        await Orden.registrarOrden(id_orden);
        res.redirect('/cliente/mis-pedidos');
    } catch (error) {
        console.error('Error al registrar orden:', error);
        res.redirect('/cart?error=' + encodeURIComponent(error.message));
    }
};

exports.postCancelarOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        await Orden.cancelarOrden(id_orden);
        res.redirect('/cliente/mis-pedidos');
    } catch (error) {
        console.error('Error al cancelar orden:', error);
        res.redirect('/cliente/mis-pedidos');
    }
};

exports.getDetalleOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        const { data: orden, error } = await supabase
            .from('orden').select('*').eq('id_orden', id_orden).single();
        if (error) throw error;

        const detalles = await Orden.obtenerDetalleOrden(id_orden);
        res.json({ orden, detalles });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ error: error.message });
    }
};
