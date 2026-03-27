const express = require('express');
const router = express.Router();

const adminClientesController = require('../../controllers/admin_clientes.controller');

// Ruta /admin/clients
router.get('/clients', adminClientesController.getAdminClientes);

// Ruta /admin/clients/:id
router.get('/clients/:id', adminClientesController.getDetalleCliente);

module.exports = router;