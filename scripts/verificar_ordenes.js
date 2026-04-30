require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificar() {
    console.log('🔍 Verificando integridad de las 300 órdenes...\n');

    // 1. Contar órdenes y detalles
    const { count: totalOrdenes } = await supabase.from('orden').select('*', { count: 'exact', head: true });
    const { count: totalDetalles } = await supabase.from('detalle_orden').select('*', { count: 'exact', head: true });
    console.log(`📊 Total órdenes: ${totalOrdenes}`);
    console.log(`📊 Total detalles: ${totalDetalles}\n`);

    // 2. Traer todas las órdenes
    const { data: ordenes } = await supabase.from('orden').select('*');

    // 3. Traer datos de referencia
    const { data: usuarioCuenta } = await supabase.from('usuario_cuenta').select('*');
    const { data: sucursalCuenta } = await supabase.from('sucursal_cuenta').select('*');
    const { data: productosDB } = await supabase.from('producto').select('id_producto').eq('activo', true);
    const prodIds = new Set(productosDB.map(p => p.id_producto));
    const { data: campanias } = await supabase.from('campania').select('id_campania, fecha_de_inicio, fecha_de_fin').eq('activo', true);

    // Construir mapas de relaciones
    const ucMap = {}; // id_usuario → [id_cuenta]
    for (const uc of usuarioCuenta) {
        if (!ucMap[uc.id_usuario]) ucMap[uc.id_usuario] = [];
        ucMap[uc.id_usuario].push(uc.id_cuenta);
    }
    const scMap = {}; // id_cuenta → [id_sucursal]
    for (const sc of sucursalCuenta) {
        if (!scMap[sc.id_cuenta]) scMap[sc.id_cuenta] = [];
        scMap[sc.id_cuenta].push(sc.id_sucursal);
    }

    let errores = 0;
    const estadoCounts = {};
    const usuarioCounts = {};
    const sucursalCounts = {};

    for (const o of ordenes) {
        // Contar estados
        estadoCounts[o.estado] = (estadoCounts[o.estado] || 0) + 1;
        usuarioCounts[o.id_usuario] = (usuarioCounts[o.id_usuario] || 0) + 1;
        if (o.id_sucursal) sucursalCounts[o.id_sucursal] = (sucursalCounts[o.id_sucursal] || 0) + 1;

        if (o.estado === 'carrito') continue; // Carritos no tienen sucursal/cuenta

        // ✅ Verificar: usuario tiene esa cuenta
        const cuentasUsuario = ucMap[o.id_usuario] || [];
        if (!cuentasUsuario.includes(o.id_cuenta)) {
            console.log(`❌ Orden ${o.id_orden}: usuario ${o.id_usuario} NO tiene cuenta ${o.id_cuenta}`);
            errores++;
        }

        // ✅ Verificar: cuenta tiene esa sucursal
        const sucsCuenta = scMap[o.id_cuenta] || [];
        if (!sucsCuenta.includes(o.id_sucursal)) {
            console.log(`❌ Orden ${o.id_orden}: cuenta ${o.id_cuenta} NO tiene sucursal ${o.id_sucursal}`);
            errores++;
        }

        // ✅ Verificar: campaña es la activa
        if (o.id_campania !== 11) {
            console.log(`❌ Orden ${o.id_orden}: campaña ${o.id_campania} NO es la activa (11)`);
            errores++;
        }

        // ✅ Verificar: fecha dentro del rango
        if (campanias && campanias.length > 0) {
            const camp = campanias[0];
            const fechaOrden = new Date(o.fecha_realizada);
            const inicio = new Date(camp.fecha_de_inicio);
            const fin = new Date(camp.fecha_de_fin);
            if (fechaOrden < inicio || fechaOrden > fin) {
                console.log(`❌ Orden ${o.id_orden}: fecha ${o.fecha_realizada} FUERA del rango de campaña`);
                errores++;
            }
        }
    }

    // 4. Verificar detalles: productos son válidos
    const { data: detalles } = await supabase.from('detalle_orden').select('*');
    let detallesInvalidos = 0;
    for (const d of detalles) {
        if (!prodIds.has(d.id_producto)) {
            console.log(`❌ Detalle: producto ${d.id_producto} NO es un producto activo`);
            detallesInvalidos++;
        }
    }

    // Resultados
    console.log('\n══════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE INTEGRIDAD');
    console.log('══════════════════════════════════════════════');
    
    if (errores === 0 && detallesInvalidos === 0) {
        console.log('✅ TODAS las relaciones son correctas');
    } else {
        console.log(`❌ ${errores} errores en órdenes`);
        console.log(`❌ ${detallesInvalidos} detalles con productos inválidos`);
    }

    console.log('\n📈 Distribución por estado:');
    Object.entries(estadoCounts).sort().forEach(([e, c]) => console.log(`   ${e}: ${c}`));

    console.log('\n👤 Órdenes por usuario:');
    Object.entries(usuarioCounts).sort(([,a],[,b]) => b-a).forEach(([u, c]) => console.log(`   usuario ${u}: ${c} órdenes`));

    console.log(`\n🏪 Sucursales con órdenes: ${Object.keys(sucursalCounts).length} de 48`);
    console.log('\n📅 Rango de fechas de las órdenes:');
    const fechas = ordenes.filter(o => o.fecha_realizada).map(o => new Date(o.fecha_realizada)).sort((a,b) => a-b);
    if (fechas.length > 0) {
        console.log(`   Primera: ${fechas[0].toISOString()}`);
        console.log(`   Última:  ${fechas[fechas.length-1].toISOString()}`);
        console.log(`   Rango campaña: 2026-03-01 → 2026-05-24`);
    }

    console.log('\n IDs de órdenes:');
    const ids = ordenes.map(o => o.id_orden).sort((a,b) => a-b);
    console.log(`   Min: ${ids[0]}, Max: ${ids[ids.length-1]}`);
}

verificar().catch(console.error);
