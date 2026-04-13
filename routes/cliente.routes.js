//Rutas cliente

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const productoController = require('../controllers/producto.controller');
const cuentaController = require('../controllers/cuenta.controller');
const clienteController = require('../controllers/cliente.controllers');

//Ruta get para pagina principal
router.get('/home', authController.getClienteHome);

//Ruta get para detalle de producto
router.get('/product/:id', productoController.getProductoCliente);

//Ruta get para ver mis pedidos
router.get('/mis-pedidos', clienteController.getMisPedidos);

//Ruta get para ver el perfil
router.get('/profile', cuentaController.getProfile);

//Ruta get para datos del perfil (AJAX)
router.get('/perfil-datos', cuentaController.getProfileData);

//Cambiar de cuenta
router.post('/profile/cuenta-activa', clienteController.setCuentaActiva);

//Cambiar de sucursal
router.post('/profile/sucursal-activa', clienteController.setSucursalActiva);

module.exports = router;
