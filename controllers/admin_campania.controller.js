const Configuracion = require('../models/configuracion.model');
const { log } = require('../utils/logger');

function hexToRgb(hex) {
    if (!hex) return '0,39,54';
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,39,54';
}

exports.getCampania = async (req, res) => {
    try {
        const config = await Configuracion.ObtenerConfig();
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: null,
            error: null
        });
    } catch (err) {
        console.error('Error cargando campaña:', err);
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: {},
            mensaje: null,
            error: 'Error al cargar la configuración'
        });
    }
};

exports.postCampania = async (req, res) => {
    try {
        const {
            nombre_campania,
            fecha_fin_campania,
            campania_activa,
            color_tema
        } = req.body;

        const campos = {
            nombre_campania:  nombre_campania  || null,
            fecha_fin_campania: fecha_fin_campania || null,
            campania_activa:  campania_activa === 'true',
            color_tema:       color_tema || '#002736',
        };

        // Imágenes subidas (multer las pone en req.files)
        if (req.files && req.files['banner_login'] && req.files['banner_login'][0]) {
            campos.banner_login_url = req.files['banner_login'][0].filename;
        }
        if (req.files && req.files['banner_timer'] && req.files['banner_timer'][0]) {
            campos.banner_timer_url = req.files['banner_timer'][0].filename;
        }

        await Configuracion.GuardarConfig(campos);
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — configuración actualizada`);

        // Actualizar res.locals.config para la respuesta inmediata
        const config = await Configuracion.ObtenerConfig();
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: 'Configuración guardada correctamente',
            error: null
        });
    } catch (err) {
        console.error('Error guardando campaña:', err);
        const config = await Configuracion.ObtenerConfig().catch(() => {});
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: null,
            error: 'Error al guardar la configuración'
        });
    }
};
