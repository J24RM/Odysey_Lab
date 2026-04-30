const express = require('express');
const router = express.Router();

const productoController = require("../controllers/producto.controller")
const cartCount = require("../utils/cartcount")

router.get('/',cartCount,productoController.getProductos); 

router.get('/:id', cartCount,productoController.getProductoCliente);


module.exports = router;