const ordenModel = require('../models/orden.model');
const detalleModel = require("../models/detalle_orden.model");
const productoModel = require("../models/producto.model");
const configuracionModel = require("../models/configuracion.model")
const supabase = require('../utils/supabase');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const path = require('path');
const fs = require('fs');
const { log } = require('../utils/logger');
const { Resend } = require('resend');

exports.getOrdenes = async (req, res) => {

};


exports.registrarOrden = async (req, res) => {
    try {
        const id_usuario = req.session.usuario;
        const correo = req.session.correo || "rodriguezmendozajesus8@gmail.com";

        const orden = await ordenModel.registrarOrden(id_usuario);
        const { folio, subtotal, productos } = orden;

        let detalleHTML = "";
        productos.forEach(p => {
            detalleHTML += `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.cantidad}</td>
                    <td>$${parseFloat(p.precio).toFixed(2)}</td>
                    <td>$${parseFloat(p.total).toFixed(2)}</td>
                </tr>
            `;
        });

        const resend = new Resend(process.env.RESEND_API_KEY);

        resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: correo,
            subject: `Confirmación de Orden ${folio}`,
            html: `
                <h2>Orden Confirmada</h2>
                <p><strong>Folio:</strong> ${folio}</p>
                <table border="1">
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                    </tr>
                    ${detalleHTML}
                </table>
                <h3>Subtotal: $${parseFloat(subtotal).toFixed(2)}</h3>
            `
        })
        .catch(err => {
            console.error("Error correo:", err);
        });

        return res.redirect('/cliente/mis-pedidos?success=' + encodeURIComponent("Se envió un correo con el detalle de tu orden confirmada") + '&order=' + encodeURIComponent("Orden confirmada"));

    } catch (error) {

        if (error.message.includes('No hay carrito') || error.message.includes('Carrito vacío')) {
            return res.redirect('/cart?error=' + encodeURIComponent("No hay productos en el carrito"));
        }

        console.error(error);
        return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("No se pudo realizar la orden"));
    }
};


exports.postCancelarOrden = async (req, res) => {
    try {
        const orden = await ordenModel.ObtenerOrdenPorId(req.params.id_orden);

        const configuracion = await configuracionModel.ObtenerConfiguracionActiva();

        // Tiempo actual en México
        const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));


        let esCancelable = false;
        if (orden && orden.fecha_realizada) {
            // Convertir fecha_realizada a Date 
            const fechaOrden = new Date(orden.fecha_realizada.replace(" ", "T"));

            // Diferencia en minutos, le agregamos 20 segundos mas
            const diferenciaMinutos = (ahora.getTime() + 20000 - fechaOrden.getTime()) / (1000 * 60);

            esCancelable = diferenciaMinutos <= configuracion.tiempo_de_cancelacion;
        }

        if(esCancelable){
            await ordenModel.CancelarOrden(req.params.id_orden);
            log('CLIENTE', 'PEDIDO CANCELADO', `id_cliente: ${req.session.usuario}, id_orden: ${req.params.id_orden}`);
        }
        else{
            return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("El tiempo de cancelacion expiro"));
        }
        return res.redirect('/cliente/mis-pedidos?success=' + encodeURIComponent(" ") + '&order=' + encodeURIComponent("Orden cancelada"));

    } catch (error) {
        return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("No se pudo cancelar la orden"));
    }
};

exports.getDetalleOrden = async (req, res) => {
    try {
        const orden = await ordenModel.ObtenerOrdenPorId(req.params.id_orden);

        if(orden.estado == "cancelada"){
            orden.cancelar = false;
        }

        else{
            const configuracion = await configuracionModel.ObtenerConfiguracionActiva();

            // Tiempo actual en México
            const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));


            let esCancelable = false;
            let transcurridoMs = 0;
            let limiteMs = configuracion.tiempo_de_cancelacion * 60 * 1000;
            let fechaOrden = null;

            if (orden && orden.fecha_realizada) {
                // Convertir fecha_realizada a Date 
                fechaOrden = new Date(orden.fecha_realizada.replace(" ", "T"));

                // Diferencia en minutos
                const diferenciaMinutos = (ahora - fechaOrden) / (1000 * 60);

                esCancelable = diferenciaMinutos <= configuracion.tiempo_de_cancelacion;
                transcurridoMs = ahora - fechaOrden;
            }

            if(esCancelable && fechaOrden){
                orden.cancelar = true;
                orden.segundosRestantes = Math.max(0, Math.floor((limiteMs - transcurridoMs) / 1000));
            }
            else{
                orden.cancelar = false;
                orden.segundosRestantes = 0;
            }
        }

        const detalles = await ordenModel.obtenerDetalleOrden(req.params.id_orden);
        res.json({ orden, detalles });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.getPdfOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;

        // Obtener orden
        const { data: orden, error: ordenError } = await supabase
            .from('orden').select('*').eq('id_orden', id_orden).single();
        if (ordenError) throw ordenError;

        // Obtener detalles (con SKU)
        const detalles = await ordenModel.obtenerDetalleOrden(id_orden);

        // Obtener sucursal si existe
        let sucursal = null;
        if (orden.id_sucursal) {
            const { data: suc } = await supabase
                .from('sucursal').select('*').eq('id_sucursal', orden.id_sucursal).single();
            sucursal = suc;
        }

        const folio = orden.folio || ('A' + String(orden.id_orden).padStart(4, '0'));
        const subtotal = parseFloat(orden.subtotal) || 0;
        const iva = parseFloat((subtotal * 0.16).toFixed(2));
        const total = parseFloat((subtotal + iva).toFixed(2));

        const fechaOrden = orden.fecha_realizada
            ? new Date(orden.fecha_realizada).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })
            : 'Sin fecha';

        const estadoTexto = orden.estado
            ? orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)
            : 'N/A';

        // ── Crear documento PDF ──────────────────────────────────────────
        const doc = new PDFDocument({ size: 'LETTER', margin: 45, bufferPages: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comprobante_${folio}.pdf"`);
        doc.pipe(res);

        const PW = doc.page.width;
        const MARGIN = 45;
        const BLUE = '#0050A0';
        const LIGHT_BLUE = '#E8F0FB';
        const GRAY = '#6B7280';
        const DARK = '#1F2937';

        // ── ENCABEZADO ───────────────────────────────────────────────────
        // Logo PPG (SVG original)
        const logoPath = path.join(__dirname, '..', 'public', 'img', 'ppg-logo.svg');
        const logoSVG = fs.readFileSync(logoPath, 'utf8');
        SVGtoPDF(doc, logoSVG, MARGIN, 26, { width: 58, height: 46, assumePt: true });

        // Título
        doc.fontSize(22).font('Helvetica-Bold').fillColor(DARK)
           .text('Comprobante de reserva', MARGIN + 62, 33);
        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
           .text('Sistema de preventa Fourware Systems', MARGIN + 62, 59);

        // Línea separadora bajo encabezado
        const headerBottom = 95;
        doc.moveTo(MARGIN, headerBottom).lineTo(PW - MARGIN, headerBottom)
           .lineWidth(1).strokeColor('#D1D5DB').stroke();

        // ── BLOQUE DE INFO (izquierda) y TOTALES (derecha) ──────────────
        const infoTop = headerBottom + 14;
        const colRight = PW - MARGIN - 155;

        const labelColor = DARK;
        const valueColor = GRAY;
        const lineH = 17;

        const infoRows = [
            ['Folio',               folio],
            ['Fecha',               fechaOrden],
            ['Estatus',             estadoTexto],
            ['Sucursal',            sucursal?.nombre_sucursal || 'Sucursal Christian Puebla'],
            ['Dirección',           sucursal?.direccion       || 'Av. Juárez 100, Puebla, Puebla'],
            ['Límite de cancelación', fechaOrden],
        ];

        let cy = infoTop;
        infoRows.forEach(([label, value]) => {
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor(labelColor)
               .text(label + ':', MARGIN, cy, { continued: false });
            doc.fontSize(8.5).font('Helvetica').fillColor(valueColor)
               .text(value, MARGIN + 120, cy);
            cy += lineH;
        });

        // Caja de totales (derecha)
        const boxX = colRight + 10;
        const boxW = 155;
        const boxH = 68;
        doc.roundedRect(boxX, infoTop, boxW, boxH, 5)
           .lineWidth(1).strokeColor('#BFDBFE').fillAndStroke('#EFF6FF', '#BFDBFE');

        doc.fontSize(9).font('Helvetica-Bold').fillColor(BLUE)
           .text('Totales', boxX, infoTop + 8, { width: boxW, align: 'center' });

        const totRows = [
            ['Subtotal:', `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
            ['IVA (16%):', `$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
            ['Total:', `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ];
        let ty = infoTop + 24;
        totRows.forEach(([lbl, val], i) => {
            const isBold = i === 2;
            doc.fontSize(isBold ? 9.5 : 8.5)
               .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(isBold ? BLUE : DARK)
               .text(lbl, boxX + 10, ty)
               .text(val, boxX + 10, ty, { width: boxW - 20, align: 'right' });
            ty += 14;
        });

        // ── SECCIÓN PRODUCTOS ────────────────────────────────────────────
        const prodTop = infoTop + Math.max(cy - infoTop, boxH) + 20;

        // Título sección
        doc.roundedRect(MARGIN, prodTop, PW - MARGIN * 2, 22, 4).fill(BLUE);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text('Productos reservados', MARGIN, prodTop + 6, {
               width: PW - MARGIN * 2, align: 'center'
           });

        let py = prodTop + 30;
        const imgSize = 44;
        const rowPad = 10;

        for (let i = 0; i < detalles.length; i++) {
            const d = detalles[i];
            const prod = d.producto || { nombre: 'Producto Desconocido', clave: 'N/A', precio_unitario: 0 };
            const precioUnitario = parseFloat(prod.precio_unitario) || 0;
            const subtotalProd = parseFloat((precioUnitario * d.cantidad).toFixed(2));

            // Fondo alternado por fila
            const rowH = imgSize + rowPad * 2;
            if (i % 2 === 0) {
                doc.rect(MARGIN, py - rowPad, PW - MARGIN * 2, rowH)
                   .fill(LIGHT_BLUE);
            }

            // Imagen del producto (solo archivos locales de /uploads/)
            let imgDrawn = false;
            if (prod.url_imagen) {
                try {
                    let imgPath = null;
                    if (prod.url_imagen.startsWith('/uploads/')) {
                        imgPath = path.join(__dirname, '..', prod.url_imagen);
                    }
                    if (imgPath && fs.existsSync(imgPath)) {
                        doc.image(imgPath, MARGIN + 4, py - rowPad + (rowH - imgSize) / 2, {
                            width: imgSize, height: imgSize, fit: [imgSize, imgSize]
                        });
                        imgDrawn = true;
                    }
                } catch (_) { /* imagen no disponible, continuar */ }
            }

            // Placeholder si no hay imagen
            if (!imgDrawn) {
                doc.roundedRect(MARGIN + 4, py - rowPad + (rowH - imgSize) / 2, imgSize, imgSize, 4)
                   .lineWidth(0.5).strokeColor('#CBD5E1').fillAndStroke('#F1F5F9', '#CBD5E1');
                doc.fontSize(7).font('Helvetica').fillColor(GRAY)
                   .text('Sin img', MARGIN + 4, py - rowPad + (rowH - imgSize) / 2 + imgSize / 2 - 4, {
                       width: imgSize, align: 'center'
                   });
            }

            const textX = MARGIN + imgSize + 14;
            const textW = PW - MARGIN * 2 - imgSize - 120;

            // Nombre del producto
            doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
               .text(prod.nombre || '—', textX, py, { width: textW, lineBreak: false });

            // SKU y cantidad
            doc.fontSize(7.5).font('Helvetica').fillColor(GRAY)
               .text(`SKU: ${prod.clave || '—'}`, textX, py + 13, { width: textW })
               .text(`Cantidad: ${d.cantidad}`, textX, py + 24, { width: textW });

            // Precio y subtotal (alineados a la derecha)
            const priceX = PW - MARGIN - 100;
            doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
               .text(`Precio: $${precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                     priceX, py, { width: 100, align: 'right' });
            doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
               .text(`Subtotal: $${subtotalProd.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                     priceX, py + 13, { width: 100, align: 'right' });

            py += rowH + 4;
        }

        // ── PIE DE PÁGINA ────────────────────────────────────────────────
        py += 14;
        doc.moveTo(MARGIN, py).lineTo(PW - MARGIN, py)
           .lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        py += 8;
        doc.fontSize(7).font('Helvetica').fillColor(GRAY)
           .text(
               'Este documento funciona como comprobante informativo de la reserva generada en el sistema.',
               MARGIN, py, { width: PW - MARGIN * 2, align: 'center' }
           );

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).send('Error al generar el comprobante PDF.');
    }
};

