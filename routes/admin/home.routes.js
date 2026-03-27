const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth.controller');

// Ruta /admin/home
router.get('/home', authController.getAdminHome);

// Ruta /admin/editar_producto
router.get('/editar_producto', authController.getAdminEditarProducto);

module.exports = router;