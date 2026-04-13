const ordenModel = require('../models/orden.model');
const detalleModel = require("../models/detalle_orden.model");
const productoModel = require("../models/producto.model");
const transporter = require("../utils/nodemailer");
const supabase = require('../utils/supabase');

exports.getOrdenes = async (req, res) => {

};

exports.registrarOrden = async (req, res) => {
    try {
        console.log("Se inicio el registro de la Orden")
        const id_usuario = req.session.usuario;
        const correo = req.session.correo || "a01713550@tec.mx"; 

        const orden = await ordenModel.obtenerOrdenEnEstadoCarrito(id_usuario);

        if(!orden){
            return res.redirect('/cart?error=' + encodeURIComponent("No hay productos en el carrito"));
        }

        const id_carrito = orden.id_orden;

        const productos = await detalleModel.detalleOrden(id_carrito);

        if(!productos || productos.length == 0){
            return res.redirect('/cart?error=' + encodeURIComponent("No hay productos en el carrito"));
        }

        let subtotal = 0;
        let detalleHTML = "";

        for (let item of productos) {
            const producto = await productoModel.encontrarProductoPorId(item.id_producto);
            
            const precio = parseFloat(producto[0].precio_unitario);           
            const totalProducto = parseFloat((precio * item.cantidad).toFixed(2)); 
            subtotal += totalProducto;

            detalleHTML += `
                <tr>
                    <td>${producto[0].nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>$${precio.toFixed(2)}</td>           
                    <td>$${totalProducto.toFixed(2)}</td>    
                </tr>
            `;
        }

        subtotal = parseFloat(subtotal.toFixed(2));

        const folio = generarFolio();
        let id_sucursal = req.session.id_sucursal || 2;

        await ordenModel.registrarOrden(id_carrito, subtotal, folio, id_sucursal);

        // Sacar el nombre de la sucursal
        let sucursalNombre = req.session.sucursalNombre || "Apaseo"

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: correo,
            subject: `Confirmación de Orden ${folio}`,
            html: `
            <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
                
                <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px;">
                
                <h2 style="color:#333;"> Orden Confirmada</h2>
                
                <p>Tu orden ha sido registrada con éxito.</p>

                <p><strong>Folio:</strong> ${folio}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Sucursal:</strong> ${sucursalNombre}</p>

                <h3>Detalle de la orden:</h3>

                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                    <tr style="background:#eee;">
                        <th style="padding:8px; border:1px solid #ddd;">Producto</th>
                        <th style="padding:8px; border:1px solid #ddd;">Cantidad</th>
                        <th style="padding:8px; border:1px solid #ddd;">Precio</th>
                        <th style="padding:8px; border:1px solid #ddd;">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    ${detalleHTML}
                    </tbody>
                </table>

                <h3 style="margin-top:20px;">Subtotal: $${subtotal.toFixed(2)}</h3>

                <div style="text-align:center; margin-top:20px;">
                    <a href="http://localhost:3000/"
                    style="background:#007bff; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
                    Ver mis pedidos
                    </a>
                </div>

                </div>

            </div>
            `
            };

        await transporter.sendMail(mailOptions);

        console.log("Se envio el correo a " + correo)

        return res.redirect('/cliente/mis-pedidos?success=' + encodeURIComponent("Se envió un correo con el detalle de tu orden confirmada"));

    } catch (error) {
        return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("No se pudo realizar la orden"));
    }

    function generarFolio() {
        const now = new Date();

        const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        const mes = letras[now.getMonth()];
        const dia = letras[now.getDay()];

        const hora = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        const seg = String(now.getSeconds()).padStart(2, "0");
        const year = now.getFullYear();

        const random = Math.floor(Math.random() * 90 + 10); // 2 dígitos extra

        return `F${mes}${dia}${hora}${min}${seg}${year}${random}`;
        }
};

exports.postCancelarOrden = async (req, res) => {
    try {
        const orden = await OrdenModel.ObtenerOrdenPorId(req.params.id_orden);

        const configuracion = await configuracionModel.ObtenerConfiguracionActiva();
        console.log(configuracion)

        // Tiempo actual en México
        const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));

        console.log(ahora)


        // Convertir fecha_realizada a Date 
        const fechaOrden = new Date(orden[0].fecha_realizada.replace(" ", "T"));

        console.log(fechaOrden)

        // Diferencia en minutos, le agregamos 20 segundos mas
        const diferenciaMinutos = (ahora.getTime() + 20000 - fechaOrden.getTime()) / (1000 * 60);

        console.log(diferenciaMinutos)

        const esCancelable = diferenciaMinutos <= configuracion.tiempo_de_cancelacion;

        console.log(esCancelable)

        if(esCancelable){
            await OrdenModel.CancelarOrden(req.params.id_orden)
        }
        else{
            req.session.error = "No se puede cancelar"
        }
        return res.redirect('/cliente/mis-pedidos')

    } catch (error) {
        console.error("❌ Error:", error.message, error.stack);
        return res.status(500).json({ ok: false, mensaje: error.message });
    }
};

exports.getDetalleOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        const { data: orden, error } = await supabase
            .from('orden').select('*').eq('id_orden', id_orden).single();
        if (error) throw error;

        const detalles = await ordenModel.obtenerDetalleOrden(id_orden);
        res.json({ orden, detalles });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ error: error.message });
    }
};

