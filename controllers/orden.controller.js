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
const resend = new Resend(process.env.RESEND_API_KEY);


exports.getOrdenes = async (req, res) => {

};


exports.registrarOrden = async (req, res) => {
    try {
        const id_usuario = req.session.usuario;
        const correo = req.session.correo || "rodriguezmendozajesus8@gmail.com";
        const id_sucursal = req.session.sucursal_activa?.id_sucursal ?? null;

        const orden = await ordenModel.registrarOrden(id_usuario);

        if (id_sucursal && orden?.folio) {
            await ordenModel.actualizarSucursalYCuentaPorFolio(orden.folio, id_sucursal, req.session.cuenta_activa.id_cuenta);
        }
        const { folio, subtotal, productos, peso_total } = orden;

        let detalleHTML = "";
        let rowIndex = 1;
        productos.forEach(p => {
            const subtotalFila = parseFloat(p.total);
            const totalFila = subtotalFila * 1.16;
            const bgRow = rowIndex % 2 === 0 ? 'background:#f9f9f9;' : '';
            detalleHTML += `
                <tr style="${bgRow}">
                <td style="padding:7px 8px; border:1px solid #ddd;">${rowIndex}</td>
                <td style="padding:7px 8px; border:1px solid #ddd;">${p.nombre}</td>
                <td style="padding:7px 8px; border:1px solid #ddd; text-align:right;">$${parseFloat(p.precio).toFixed(2)}</td>
                <td style="padding:7px 8px; border:1px solid #ddd; text-align:right;">${p.cantidad}</td>
                <td style="padding:7px 8px; border:1px solid #ddd; text-align:right;">${p.peso}</td>
                <td style="padding:7px 8px; border:1px solid #ddd; text-align:right;">$${subtotalFila.toFixed(2)}</td>
                <td style="padding:7px 8px; border:1px solid #ddd; text-align:right;">$${totalFila.toFixed(2)}</td>
                </tr>
            `;
            rowIndex++;
        });

        const total = subtotal * 1.16;

        let sucursalNombre = req.session.sucursal_activa.nombre_sucursal || "";
        let cuentaNombre = req.session.cuenta_activa.nombre_dueno || "";
        let cuentaRFC = req.session.cuenta_activa.rfc || "";

        const sucursal = req.session.sucursal_activa;

        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: correo,
            subject: `Confirmación de Orden ${folio}`,
            html: 
            `
            <div style="font-family: Arial, sans-serif; background:#f0f2f5; padding:24px 0;">
                <div style="max-width:640px; margin:auto; background:white; border-radius:4px; overflow:hidden; border:1px solid #ddd;">

                    <!-- HEADER -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:18px 24px 14px; border-bottom:3px solid #1a7abf;">
                        <div>
                            <span style="font-size:20px; font-weight:400; color:#444;"> Sistema de Pedidos</span>
                        </div>
                    </div>

                    <!-- INTRO -->
                    <div style="padding:14px 24px 0;">
                    <p style="margin:0 0 14px; font-size:13px; color:#333;">
                        Hola, el usuario <strong>${cuentaNombre}</strong> realizó la confirmación de la siguiente solicitud.
                    </p>
                    </div>

                    <!-- INFO GRID -->
                    <div style="padding:0 24px 14px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <tr>
                        <td style="padding:4px 0; width:130px;"><strong>Cuenta</strong></td>
                        <td style="padding:4px 12px;">${cuentaNombre} — ${cuentaRFC}</td>
                        <td style="padding:4px 0; width:80px;"><strong>Fecha</strong></td>
                        <td style="padding:4px 12px;">${new Date().toLocaleString()}</td>
                        </tr>
                        <tr>
                        <td style="padding:4px 0;"><strong>Folio</strong></td>
                        <td style="padding:4px 12px;">${folio}</td>
                        <td style="padding:4px 0;"><strong>Piezas</strong></td>
                        <td style="padding:4px 12px;">${productos.length} artículo(s)</td>
                        </tr>
                        <tr>
                        <td style="padding:4px 0;"><strong>Tipo de pedido</strong></td>
                        <td style="padding:4px 12px;">Normal</td>
                        <td></td><td></td>
                        </tr>
                        <tr>
                        <td style="padding:4px 0;"><strong>Estado de pedido</strong></td>
                        <td style="padding:4px 12px;">
                            <span style="background:#28a745; color:white; font-size:11px; padding:2px 10px; border-radius:3px;">Confirmado</span>
                        </td>
                        <td></td><td></td>
                        </tr>
                    </table>
                    </div>

                    <!-- DIRECCIÓN -->
                    <div style="padding:0 24px 14px;">
                    <div style="border-top:1px solid #ddd; padding-top:10px;">
                        <p style="margin:0 0 4px; font-size:13px;"><strong>Dirección de entrega</strong></p>
                        <table style="font-size:13px; border-collapse:collapse; width:100%;">
                        <tr>
                            <td style="width:130px; color:#555; padding:2px 0;">Estado</td>
                            <td>${sucursalNombre} — ${sucursal.edo}</td>
                        </tr>
                        <tr>
                            <td style="color:#555; padding:2px 0;">Dirección</td>
                            <td>${sucursal.calle_1} ${sucursal.calle_2}, ${sucursal.deleg_municipio}</td>
                        </tr>
                        </table>
                    </div>
                    </div>

                    <!-- TABLA DE PRODUCTOS -->
                    <div style="padding:0 24px 0;">
                    <div style="border-top:1px solid #ddd; padding-top:10px;">
                        <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        <thead>
                            <tr style="background:#1a7abf; color:white;">
                            <th style="padding:8px; text-align:left; border:1px solid #1a6aab;">#</th>
                            <th style="padding:8px; text-align:left; border:1px solid #1a6aab;">Producto</th>
                            <th style="padding:8px; text-align:right; border:1px solid #1a6aab;">Precio</th>
                            <th style="padding:8px; text-align:right; border:1px solid #1a6aab;">Cantidad</th>
                            <th style="padding:8px; text-align:right; border:1px solid #1a6aab;">Peso (Kg)</th>
                            <th style="padding:8px; text-align:right; border:1px solid #1a6aab;">Subtotal</th>
                            <th style="padding:8px; text-align:right; border:1px solid #1a6aab;">Total (IVA inc.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalleHTML}
                        </tbody>
                        </table>
                    </div>
                    </div>

                    <!-- TOTALES -->
                    <div style="padding:10px 24px 20px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <tr>
                        <td style="text-align:right; padding:4px 0;"><strong>Peso Total:</strong></td>
                        <td style="text-align:right; padding:4px 0; width:140px;">${peso_total.toFixed(2)} Kg</td>
                        </tr>
                        <tr>
                        <td style="text-align:right; padding:4px 0;"><strong>Subtotal:</strong></td>
                        <td style="text-align:right; padding:4px 0;">$${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                        <td style="text-align:right; padding:4px 0;"><strong>IVA (16%):</strong></td>
                        <td style="text-align:right; padding:4px 0;">$${(subtotal * 0.16).toFixed(2)}</td>
                        </tr>
                        <tr style="background:#1a7abf; color:white;">
                        <td style="text-align:right; padding:8px 12px; font-weight:700;">Total (IVA incluido):</td>
                        <td style="text-align:right; padding:8px 12px; font-weight:700; white-space:nowrap;">$${total.toFixed(2)}</td>
                        </tr>
                    </table>
                    </div>

                    <!-- NOTA Y CTA -->
                    <div style="padding:0 24px 20px; font-size:12px; color:#555;">
                    <p style="margin:0 0 14px;">
                        *Para visualizar el pedido completo ingresa al sistema de pedidos.
                    </p>
                    <div style="text-align:center;">
                        <a href="https://odyseysistemadepreventas-production.up.railway.app/login"
                        style="background:#1a7abf; color:white; padding:10px 28px; text-decoration:none; border-radius:4px; font-size:13px; display:inline-block;">
                        Ver mis pedidos
                        </a>
                    </div>
                    </div>

                </div>
                </div>
            `
        }).catch(err => {
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

        const data = await ordenModel.CancelarOrden(req.params.id_orden);

        if (data === 'OK') {
            return res.redirect('/cliente/mis-pedidos?success=' + encodeURIComponent(" ") + '&order=' + encodeURIComponent("Orden cancelada"));
        }

        if (data === 'TIEMPO_EXPIRADO') {
            return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("El tiempo de cancelacion expiro"));
        }

        return res.redirect('/cliente/mis-pedidos?error=' + encodeURIComponent("Orden no encontrada"));

    } catch (error) {
        console.log(error)
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
        console.log(detalles)

        
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

