const express = require('express');
const router = express.Router();

const carritoController = require("../controllers/carrito.controller")

// carrito.routes.js
router.get('/', carritoController.getCarrito);

// Agregar producto al carrito
router.post('/items', carritoController.agregarItem);

// Modificar cantidad
router.put('/items/:producto_id', carritoController.actulizarItem);

// Eliminar producto
router.delete('/items/:producto_id', carritoController.eliminarItem);

module.exports = router;
