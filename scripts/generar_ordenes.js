/**
 * Script para generar 300 órdenes realistas con sus detalles.
 *
 * Paso 1: Elimina detalle_orden y orden existentes, reinicia la secuencia a 1.
 * Paso 2: Inserta 300 órdenes respetando las relaciones:
 *         usuario → usuario_cuenta → cuenta → sucursal_cuenta → sucursal
 * Paso 3: Para cada orden, inserta 1-5 detalles con productos de la campaña activa.
 *
 * Las fechas están dentro del rango de la campaña activa (2026-03-01 a hoy).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ── Datos reales de la BD ─────────────────────────────────────────────────

// usuario_cuenta: cada usuario puede tener varias cuentas
const USUARIO_CUENTAS = {
    11: [1, 2],
    12: [3, 4],
    13: [5, 6],
    14: [7, 8],
    15: [9, 10],
    16: [11, 12, 13],
    17: [14, 15, 16],
    18: [17, 18, 19],
    19: [1, 5, 10, 20],
    20: [2, 6, 11, 20],
    24: [8],
    25: [4],
    26: [20],
};

// sucursal_cuenta: cada cuenta puede tener varias sucursales
const CUENTA_SUCURSALES = {
    1:  [1, 21],
    2:  [2, 22],
    3:  [3, 23],
    4:  [4, 24],
    5:  [5, 25],
    6:  [6, 26],
    7:  [7, 27],
    8:  [8, 28],
    9:  [9, 29],
    10: [10, 30],
    11: [11, 31],
    12: [12, 32, 33],
    13: [13, 34, 35],
    14: [14, 36, 37],
    15: [15, 38, 39],
    16: [16, 40, 41, 42],
    17: [17, 43, 44, 45],
    18: [18, 46, 47, 48],
    19: [19],
    20: [20],
};

// Productos activos con precio y peso
const PRODUCTOS = [
    { id: 573, precio: 120,  peso: 0.15 },
    { id: 574, precio: 85,   peso: 0.10 },
    { id: 575, precio: 130,  peso: 0.30 },
    { id: 576, precio: 35,   peso: 0.02 },
    { id: 577, precio: 280,  peso: 0.40 },
    { id: 578, precio: 160,  peso: 0.25 },
    { id: 579, precio: 65,   peso: 0.05 },
    { id: 580, precio: 75,   peso: 0.12 },
    { id: 581, precio: 350,  peso: 0.55 },
    { id: 582, precio: 75,   peso: 0.03 },
    { id: 583, precio: 185,  peso: 0.30 },
    { id: 584, precio: 145,  peso: 0.18 },
    { id: 585, precio: 110,  peso: 0.22 },
    { id: 586, precio: 240,  peso: 0.35 },
    { id: 587, precio: 95,   peso: 0.20 },
    { id: 588, precio: 650,  peso: 2.50 },
    { id: 589, precio: 180,  peso: 0.30 },
    { id: 590, precio: 320,  peso: 0.45 },
    { id: 591, precio: 45,   peso: 0.02 },
    { id: 592, precio: 40,   peso: 0.02 },
    { id: 593, precio: 220,  peso: 0.35 },
    { id: 594, precio: 290,  peso: 0.50 },
    { id: 595, precio: 480,  peso: 0.35 },
    { id: 596, precio: 75,   peso: 0.06 },
    { id: 597, precio: 120,  peso: 0.18 },
    { id: 598, precio: 150,  peso: 0.08 },
    { id: 599, precio: 160,  peso: 0.30 },
    { id: 600, precio: 850,  peso: 2.00 },
    { id: 601, precio: 420,  peso: 0.55 },
    { id: 602, precio: 380,  peso: 0.60 },
    { id: 603, precio: 145,  peso: 0.28 },
    { id: 604, precio: 520,  peso: 0.60 },
    { id: 605, precio: 350,  peso: 0.55 },
    { id: 606, precio: 280,  peso: 0.45 },
    { id: 607, precio: 420,  peso: 0.60 },
    { id: 608, precio: 750,  peso: 0.25 },
    { id: 609, precio: 380,  peso: 0.45 },
    { id: 610, precio: 320,  peso: 0.45 },
    { id: 611, precio: 350,  peso: 0.45 },
    { id: 612, precio: 95,   peso: 0.12 },
    { id: 613, precio: 45,   peso: 0.02 },
    { id: 614, precio: 620,  peso: 0.80 },
    { id: 615, precio: 550,  peso: 1.20 },
];

const ID_CAMPANIA = 11;

// Campaña activa: 2026-03-01 a hoy (2026-04-29)
const FECHA_INICIO_CAMP = new Date('2026-03-01T08:00:00');
const FECHA_FIN_CAMP    = new Date(); // Hoy

// ── Utilidades ────────────────────────────────────────────────────────────

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(start, end) {
    const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(ts);
}

// Genera una fecha formateada como la guarda la app: "YYYY-MM-DD HH:MM:SS"
function formatDate(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Selecciona N productos únicos al azar
function randProductos(n) {
    const shuffled = [...PRODUCTOS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

// ── Generación de datos ──────────────────────────────────────────────────

function generarOrdenes(cantidad) {
    const ordenes = [];
    const detalles = [];
    const usuarioIds = Object.keys(USUARIO_CUENTAS).map(Number);

    // Dar más peso a algunos usuarios para simular actividad realista
    const usuariosPeso = [];
    for (const uid of usuarioIds) {
        // Usuarios con más cuentas hacen más pedidos
        const peso = USUARIO_CUENTAS[uid].length;
        for (let i = 0; i < peso; i++) usuariosPeso.push(uid);
    }

    for (let i = 1; i <= cantidad; i++) {
        const id_usuario = randPick(usuariosPeso);
        const cuentas = USUARIO_CUENTAS[id_usuario];
        const id_cuenta = randPick(cuentas);
        const sucursales = CUENTA_SUCURSALES[id_cuenta];
        const id_sucursal = randPick(sucursales);

        // Fecha aleatoria dentro del rango de campaña, con más peso hacia fechas recientes
        let fecha;
        if (Math.random() < 0.4) {
            // 40% de las órdenes en las últimas 2 semanas (más recientes)
            const dosSemanasAtras = new Date();
            dosSemanasAtras.setDate(dosSemanasAtras.getDate() - 14);
            fecha = randDate(dosSemanasAtras, FECHA_FIN_CAMP);
        } else if (Math.random() < 0.5) {
            // 30% en el último mes
            const unMesAtras = new Date();
            unMesAtras.setMonth(unMesAtras.getMonth() - 1);
            fecha = randDate(unMesAtras, FECHA_FIN_CAMP);
        } else {
            // 30% distribuidas en el resto del rango de campaña
            fecha = randDate(FECHA_INICIO_CAMP, FECHA_FIN_CAMP);
        }

        // Solo en horario laboral (8am - 6pm)
        fecha.setHours(randInt(8, 18), randInt(0, 59), randInt(0, 59));

        // Generar detalles: 1-5 productos por orden
        const numProductos = randInt(1, 5);
        const productosSeleccionados = randProductos(numProductos);

        let subtotal = 0;
        let pesoTotal = 0;

        for (const prod of productosSeleccionados) {
            const cantidad_item = randInt(1, 15);
            subtotal += prod.precio * cantidad_item;
            pesoTotal += prod.peso * cantidad_item;

            detalles.push({
                id_orden: i,
                id_producto: prod.id,
                cantidad: cantidad_item,
            });
        }

        // Estado: 85% confirmadas, 10% canceladas, 5% en carrito (solo las más recientes)
        let estado;
        const r = Math.random();
        if (r < 0.85) {
            estado = 'confirmada';
        } else if (r < 0.95) {
            estado = 'cancelada';
        } else {
            // Solo las últimas 3 pueden estar en "carrito" (para no tener muchas)
            if (i > cantidad - 3) {
                estado = 'carrito';
            } else {
                estado = 'confirmada';
            }
        }

        // Si es carrito, no tiene folio, fecha ni sucursal
        const esCarrito = estado === 'carrito';

        ordenes.push({
            id_orden: i,
            folio: esCarrito ? null : `A${i}`,
            subtotal: subtotal,
            fecha_realizada: esCarrito ? null : formatDate(fecha),
            estado: estado,
            id_sucursal: esCarrito ? null : id_sucursal,
            id_usuario: id_usuario,
            id_campania: ID_CAMPANIA,
            peso_total: Math.round(pesoTotal * 100) / 100,
            id_cuenta: esCarrito ? null : id_cuenta,
        });
    }

    return { ordenes, detalles };
}

// ── Ejecución ─────────────────────────────────────────────────────────────

async function main() {
    console.log('🔍 Generando datos...');
    const { ordenes, detalles } = generarOrdenes(300);

    console.log(`📊 Generadas ${ordenes.length} órdenes con ${detalles.length} detalles`);

    // ── Paso 1: Limpiar datos existentes ──────────────────────────────
    console.log('\n🗑️  Eliminando detalle_orden existente...');
    const { error: e1 } = await supabase.from('detalle_orden').delete().gte('id_orden', 0);
    if (e1) { console.error('Error eliminando detalles:', e1); return; }

    console.log('🗑️  Eliminando órdenes existentes...');
    const { error: e2 } = await supabase.from('orden').delete().gte('id_orden', 0);
    if (e2) { console.error('Error eliminando órdenes:', e2); return; }

    // Reiniciar secuencia del id_orden a 1
    console.log('🔄 Reiniciando secuencia de id_orden...');
    const { error: e3 } = await supabase.rpc('reiniciar_seq_orden');
    if (e3) {
        console.warn('⚠️  No existe la función reiniciar_seq_orden. Intentando con SQL directo...');
        // Si no existe la función RPC, se puede hacer via SQL en Supabase Dashboard:
        // ALTER SEQUENCE orden_id_orden_seq RESTART WITH 1;
        console.log('   Por favor ejecuta en el SQL Editor de Supabase:');
        console.log('   ALTER SEQUENCE orden_id_orden_seq RESTART WITH 1;');
        console.log('   Continuando de todos modos...');
    }

    // ── Paso 2: Insertar órdenes en lotes de 50 ─────────────────────
    console.log('\n📝 Insertando órdenes...');
    const BATCH = 50;
    for (let i = 0; i < ordenes.length; i += BATCH) {
        const batch = ordenes.slice(i, i + BATCH).map(o => {
            // Quitar id_orden para que use la secuencia
            const { id_orden, ...rest } = o;
            return rest;
        });
        const { data, error } = await supabase.from('orden').insert(batch).select('id_orden');
        if (error) {
            console.error(`Error insertando órdenes lote ${i / BATCH + 1}:`, error);
            return;
        }

        // Actualizar los id_orden reales para mapear a detalles
        for (let j = 0; j < data.length; j++) {
            const oldId = i + j + 1; // id_orden generado localmente
            const newId = data[j].id_orden;
            // Remap detalles
            detalles.filter(d => d.id_orden === oldId).forEach(d => d.id_orden = newId);
        }

        const progress = Math.min(i + BATCH, ordenes.length);
        process.stdout.write(`   ✅ ${progress}/${ordenes.length} órdenes\r`);
    }
    console.log('\n');

    // ── Paso 3: Insertar detalles en lotes de 100 ────────────────────
    console.log('📝 Insertando detalles de órdenes...');
    for (let i = 0; i < detalles.length; i += BATCH) {
        const batch = detalles.slice(i, i + BATCH);
        const { error } = await supabase.from('detalle_orden').insert(batch);
        if (error) {
            console.error(`Error insertando detalles lote ${i / BATCH + 1}:`, error);
            console.error('Primer detalle del lote:', batch[0]);
            return;
        }
        const progress = Math.min(i + BATCH, detalles.length);
        process.stdout.write(`   ✅ ${progress}/${detalles.length} detalles\r`);
    }
    console.log('\n');

    // ── Resumen ──────────────────────────────────────────────────────
    const { count: totalOrdenes } = await supabase.from('orden').select('*', { count: 'exact', head: true });
    const { count: totalDetalles } = await supabase.from('detalle_orden').select('*', { count: 'exact', head: true });

    console.log('═══════════════════════════════════════');
    console.log(`✅ ${totalOrdenes} órdenes insertadas`);
    console.log(`✅ ${totalDetalles} detalles insertados`);
    console.log('═══════════════════════════════════════');

    // Verificar primera y última orden
    const { data: primera } = await supabase.from('orden').select('*').order('id_orden', { ascending: true }).limit(1).single();
    const { data: ultima } = await supabase.from('orden').select('*').order('id_orden', { ascending: false }).limit(1).single();
    console.log('\nPrimera orden:', primera);
    console.log('Última orden:', ultima);
}

main().catch(console.error);
