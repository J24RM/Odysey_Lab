const express = require('express');
const router = express.Router();

const adminEstadisticasController = require('../../controllers/admin_estadisticas.controller');

// Ruta /admin/stats
router.get('/stats', adminEstadisticasController.getEstadisticas);

module.exports = router;