const express = require('express');
const router = express.Router();

const clienteController = require("../controllers/cliente.controllers")

// Ver Informacion del perfil
router.get('/perfil', clienteController.getPerfil);

// Cambiar de Cuenta
router.post('/cuenta-activa', clienteController.setCuentaActiva);

// Cambiar de Sucursal
router.post('sucursal-activa', clienteController.setSucursalActiva)




module.exports = router;
