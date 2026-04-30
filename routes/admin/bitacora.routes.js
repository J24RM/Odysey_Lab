const express = require('express');
const router = express.Router();
const bitacoraController = require('../../controllers/admin_bitacora.controller');

router.get('/bitacora', bitacoraController.getBitacora);

module.exports = router;
