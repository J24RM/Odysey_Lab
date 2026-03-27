const express = require('express');
const router = express.Router();

const sucursalController = require("../controllers/sucursal.controller")

// sucursal.routes.js
router.get('/', sucursalController.getSucursalesDeMiCuenta);

module.exports = router;
