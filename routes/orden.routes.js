const express = require('express');
const router = express.Router();

const ordenesController = require("../controllers/orden.controller.js")

router.get("/", ordenesController.getOrdenes);
router.get("/detalle/:id_orden", ordenesController.getDetalleOrden);
router.get("/:id_orden", ordenesController.getOrdenes);

// Registrar Orden
router.post("/registrar/:id_orden", ordenesController.postRegistrarOrden);

// Cancelar Orden
router.post("/cancelar/:id_orden", ordenesController.postCancelarOrden);


module.exports = router;