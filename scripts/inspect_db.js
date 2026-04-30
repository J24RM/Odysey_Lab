require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    const output = [];
    
    // 1. Usuarios clientes (id_rol = 1)
    const { data: usuarios } = await supabase.from('usuario').select('id_usuario, email, id_rol').eq('id_rol', 1);
    output.push('=== USUARIOS CLIENTES ===');
    output.push(JSON.stringify(usuarios, null, 2));

    // 2. Campaña activa
    const { data: campanias } = await supabase.from('campania').select('*').eq('activo', true);
    output.push('\n=== CAMPAÑAS ACTIVAS ===');
    output.push(JSON.stringify(campanias, null, 2));

    // 3. usuario_cuenta
    const { data: usuarioCuenta } = await supabase.from('usuario_cuenta').select('*');
    output.push('\n=== USUARIO_CUENTA ===');
    output.push(JSON.stringify(usuarioCuenta, null, 2));

    // 4. sucursal_cuenta
    const { data: sucursalCuenta } = await supabase.from('sucursal_cuenta').select('*');
    output.push('\n=== SUCURSAL_CUENTA ===');
    output.push(JSON.stringify(sucursalCuenta, null, 2));

    // 5. Sucursales (ids only)
    const { data: sucursales } = await supabase.from('sucursal').select('id_sucursal, nombre_sucursal, edo');
    output.push('\n=== SUCURSALES (total: ' + (sucursales?.length || 0) + ') ===');
    output.push(JSON.stringify(sucursales, null, 2));

    // 6. Cuentas
    const { data: cuentas } = await supabase.from('cuenta').select('id_cuenta, nombre_dueno, region');
    output.push('\n=== CUENTAS ===');
    output.push(JSON.stringify(cuentas, null, 2));

    // 7. Productos activos (just ids and prices)
    const { data: productos } = await supabase.from('producto').select('id_producto, precio_unitario, peso').eq('activo', true);
    output.push('\n=== PRODUCTOS ACTIVOS (total: ' + (productos?.length || 0) + ') ===');
    output.push(JSON.stringify(productos, null, 2));

    // 8. Productos de la campaña activa
    if (campanias && campanias.length > 0) {
        const { data: prodCamp } = await supabase.from('producto_campania').select('id_producto').eq('id_campania', campanias[0].id_campania);
        output.push('\n=== PRODUCTOS_CAMPANIA (ids) ===');
        output.push(JSON.stringify(prodCamp?.map(p => p.id_producto), null, 2));
    }

    // 9. Existing orders count
    const { count } = await supabase.from('orden').select('*', { count: 'exact', head: true });
    output.push('\n=== ORDENES EXISTENTES: ' + count + ' ===');

    // 10. Check if orden has peso_total and id_cuenta columns
    const { data: sampleOrden } = await supabase.from('orden').select('*').limit(1);
    output.push('\n=== COLUMNS IN ORDEN ===');
    if (sampleOrden && sampleOrden.length > 0) {
        output.push(JSON.stringify(Object.keys(sampleOrden[0])));
    }

    fs.writeFileSync(__dirname + '/db_data.txt', output.join('\n'));
    console.log('Done! Output saved to scripts/db_data.txt');
}

inspect().catch(console.error);
