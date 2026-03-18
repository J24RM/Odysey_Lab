const express = require('express');
const router = express.Router();

const cuentaController = require("../controllers/cuenta.controller")

// Ver cuentas
router.get('/', cuentaController.getCuentasDeMiUsuario);

module.exports = router;
