//Ruta a Estadisticas

const express = require('express');
const router = express.Router();

const estadisticasController = require('../controllers/admin_estadisticas.controller');

router.get('/admin_estadisticas', estadisticasController.getEstadisticas);

module.exports = router;
