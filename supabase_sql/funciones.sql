--- Stored Procedures

-- Estadisticas Productos

-- Stats Productos (General)

CREATE FUNCTION stats_productos(fecha_inicio DATE, fecha_fin DATE)
RETURNS TABLE (
  id_producto INT,
  nombre TEXT,
  url_imagen TEXT,
  cantidad BIGINT,
  ventas NUMERIC
)
AS $$
SELECT 
  p.id_producto,
  p.nombre,
  p.url_imagen,
  SUM(d.cantidad) AS cantidad,
  SUM(d.cantidad * p.precio_unitario) AS ventas
FROM detalle_orden d
JOIN producto p ON p.id_producto = d.id_producto
JOIN orden o ON o.id_orden = d.id_orden
WHERE 
  o.estado = 'confirmada'
  AND o.fecha_realizada BETWEEN fecha_inicio AND fecha_fin
GROUP BY p.id_producto, p.nombre, p.url_imagen;
$$ LANGUAGE SQL;

-- Stats Productos por ID

CREATE FUNCTION stats_producto_by_id(
  p_id_producto INT,
  fecha_inicio DATE,
  fecha_fin DATE
)
RETURNS TABLE (
  id_producto INT,
  nombre TEXT,
  url_imagen TEXT,
  cantidad BIGINT,
  ventas NUMERIC
)
AS $$
SELECT 
  p.id_producto,
  p.nombre,
  p.url_imagen,
  COALESCE(SUM(d.cantidad), 0) AS cantidad,
  COALESCE(SUM(d.cantidad * p.precio_unitario), 0) AS ventas
FROM producto p
JOIN detalle_orden d ON d.id_producto = p.id_producto
JOIN orden o ON o.id_orden = d.id_orden
WHERE 
  p.id_producto = p_id_producto
  AND o.estado = 'confirmada'
  AND o.fecha_realizada BETWEEN fecha_inicio AND fecha_fin
GROUP BY p.id_producto, p.nombre, p.url_imagen;
$$ LANGUAGE SQL;


-- Stats Productos por Semana

CREATE FUNCTION ordenes_por_dia_semana(
  fecha_inicio DATE,
  fecha_fin DATE,
  p_id_producto INT
)
RETURNS TABLE (
  dia TEXT,
  cantidad BIGINT,
  orden INT
)
AS $$
SELECT 
  TRIM(TO_CHAR(o.fecha_realizada, 'Day')) AS dia,
  SUM(d.cantidad) AS cantidad,
  EXTRACT(DOW FROM o.fecha_realizada) AS orden
FROM detalle_orden d
JOIN orden o ON o.id_orden = d.id_orden
WHERE 
  d.id_producto = p_id_producto
  AND o.estado = 'confirmada'
  AND o.fecha_realizada BETWEEN fecha_inicio AND fecha_fin
GROUP BY dia, orden
ORDER BY orden;
$$ LANGUAGE SQL;

-- Stats Productos por Mes

CREATE FUNCTION ordenes_por_dia_mes(
  fecha_inicio DATE,
  fecha_fin DATE,
  p_id_producto INT
)
RETURNS TABLE (
  dia INT,
  cantidad BIGINT
)
AS $$
WITH dias AS (
  SELECT generate_series(fecha_inicio, fecha_fin, interval '1 day') AS fecha
)
SELECT 
  EXTRACT(DAY FROM dias.fecha) AS dia,
  COALESCE(SUM(d.cantidad), 0) AS cantidad
FROM dias
LEFT JOIN orden o 
  ON DATE(o.fecha_realizada) = dias.fecha
  AND o.estado = 'confirmada'
LEFT JOIN detalle_orden d 
  ON d.id_orden = o.id_orden
  AND d.id_producto = p_id_producto
GROUP BY dias.fecha
ORDER BY dias.fecha;
$$ LANGUAGE SQL;



-- Transacciones

-- Realizar Orden

create function confirmar_orden(p_id_usuario int)
returns json as $$
declare
    v_orden_id int;
    v_subtotal numeric := 0;
    v_folio text;
    v_sucursal int;
    v_productos json;
begin
    select id_orden, id_sucursal
    into v_orden_id, v_sucursal
    from orden
    where id_usuario = p_id_usuario
      and estado = 'carrito'
    limit 1;

    if v_orden_id is null then
        raise exception 'No hay carrito';
    end if;

    -- Obtener productos
    select json_agg(json_build_object(
        'nombre', p.nombre,
        'cantidad', d.cantidad,
        'precio', p.precio_unitario,
        'total', (p.precio_unitario * d.cantidad)
    ))
    into v_productos
    from detalle_orden d
    join producto p on p.id_producto = d.id_producto
    where d.id_orden = v_orden_id;

    if v_productos is null then
        raise exception 'Carrito vacío';
    end if;

    select sum(p.precio_unitario * d.cantidad)
    into v_subtotal
    from detalle_orden d
    join producto p on p.id_producto = d.id_producto
    where d.id_orden = v_orden_id;

    -- Generar folio
    v_folio := 'A' || lpad(v_orden_id::text, 4, '0');

    -- Confirmar orden
    update orden
    set estado = 'confirmada',
        subtotal = v_subtotal,
        folio = v_folio,
        fecha_realizada = now() AT TIME ZONE 'America/Mexico_City'
    where id_orden = v_orden_id;

    return json_build_object(
        'folio', v_folio,
        'subtotal', v_subtotal,
        'productos', v_productos
    );

end;
language plpgsql




-- Cancelar Orden

create or replace function cancelar_orden(p_id_orden int)
returns text as $$
declare
    v_orden record;
    v_config record;
    v_ahora timestamp;
    v_diferencia_minutos numeric;
begin
    -- Obtener orden
    select * into v_orden
    from orden
    where id_orden = p_id_orden;

    if not found then
        return 'ORDEN_NO_EXISTE';
    end if;

    -- Obtener configuración activa
    select * into v_config
    from configuraciones
    where activo = true
    limit 1;

    -- Hora actual México
    v_ahora := timezone('America/Mexico_City', now());

    -- Calcular diferencia en minutos (+20 segundos)
    v_diferencia_minutos := extract(epoch from (v_ahora + interval '20 seconds' - v_orden.fecha_realizada)) / 60;

    if v_diferencia_minutos <= v_config.tiempo_de_cancelacion then
        
        update orden
        set estado = 'cancelada'
        where id_orden = p_id_orden;

        return 'OK';
    else
        return 'TIEMPO_EXPIRADO';
    end if;
end;
$$ language plpgsql;


-- Agregar Producto al Carrito

create function agregar_item_carrito (
    p_id_usuario int,
    p_id_producto int,
    p_cantidad int
)
returns int as $$
declare
    v_carrito_id int;
    v_producto record;
begin
    -- Buscar carrito existente
    select id_orden into v_carrito_id
    from orden
    where id_usuario = p_id_usuario
    and estado = 'carrito'
    limit 1;

    -- Si no existe, crearlo
    if v_carrito_id is null then
        insert into orden (id_usuario, estado, fecha_realizada)
        values (p_id_usuario, 'carrito')
        returning id_orden into v_carrito_id;
    end if;

    -- Buscar producto en el carrito 
    select * into v_producto
    from detalle_orden
    where id_orden = v_carrito_id
    and id_producto = p_id_producto
    for update;

    -- Si ya existe 
    if found then
        update detalle_orden
        set cantidad = cantidad + p_cantidad
        where id_orden = v_carrito_id
        and id_producto = p_id_producto;

    else
        -- Si no existe 
        insert into detalle_orden (id_orden, id_producto, cantidad)
        values (v_carrito_id, p_id_producto, p_cantidad);
    end if;

    return v_carrito_id;
end;
$$ language plpgsql;

