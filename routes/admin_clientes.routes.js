//Ruta a Clientes

const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/admin_clientes.controller');

router.get('/admin_clientes', clientesController.getClientes);

module.exports = router;
