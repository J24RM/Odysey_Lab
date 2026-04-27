const ordenModel = require('../models/orden.model');
const detalle_ordenModel = require('../models/detalle_orden.model');

module.exports = async (req, res, next) => {
  if (req.session?.usuario) {
    try {
      const carrito = await ordenModel.obtenerOrdenEnEstadoCarrito(req.session.usuario);
      if (carrito) {
        const items = await detalle_ordenModel.detalleOrden(carrito.id_orden);
        res.locals.cartCount = items.reduce((sum, i) => sum + i.cantidad, 0);
      } else {
        res.locals.cartCount = 0;
      }
    } catch { 
      res.locals.cartCount = 0; 
    }
  } else {
    res.locals.cartCount = 0;
  }
  next();
};