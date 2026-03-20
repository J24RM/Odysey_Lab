const express = require('express');
const router = express.Router();

const carritoController = require("../controllers/carrito.controller")

// carrito.routes.js
router.get('/', carritoController.getCarrito);

// Agregar producto al carrito
router.post('/items', carritoController.agregarItem);

// Modificar cantidad
router.post('/items/:id_producto', carritoController.actualizarItem);


module.exports = router;
