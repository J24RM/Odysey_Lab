const Calificacion = require('../models/calificacion.model');

exports.postCalificacion = async (request, response) => {
    try {
        const id_producto = parseInt(request.params.id);
        const id_usuario = request.session.usuario;
        const rating = parseFloat(request.body.rating);
        const descripcion = request.body.descripcion?.trim() || null;

        if (!rating || rating < 1 || rating > 5) {
            return response.status(400).json({ error: 'La calificación debe ser entre 1 y 5.' });
        }

        await Calificacion.insertar({ id_producto, id_usuario, rating, descripcion });

        return response.json({ ok: true });
    } catch (error) {
        console.error('Error al guardar calificación:', error);
        return response.status(500).json({ error: 'Error al guardar la calificación.' });
    }
};
