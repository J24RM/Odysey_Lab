//Ruta a Historial de Ordenes
const express = require('express');
const router = express.Router();

const adminHistorialController = require('../controllers/admin_hist_ordenes.controller');

router.get('/admin_historial', adminHistorialController.getHistorialOrdenes);

module.exports = router;
