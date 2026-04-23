-- Ejecutar en el SQL Editor de Supabase
-- Agrega columnas de configuración de campaña a la tabla existente

ALTER TABLE public.configuraciones
  ADD COLUMN IF NOT EXISTS fecha_fin_campania  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS campania_activa     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_login_url    VARCHAR,
  ADD COLUMN IF NOT EXISTS banner_timer_url    VARCHAR,
  ADD COLUMN IF NOT EXISTS color_tema          VARCHAR DEFAULT '#002736',
  ADD COLUMN IF NOT EXISTS nombre_campania     VARCHAR;

-- Si la tabla está vacía, inserta una fila base
INSERT INTO public.configuraciones (nombre, activo, campania_activa, color_tema, nombre_campania, fecha_fin_campania)
SELECT 'Configuración principal', true, false, '#002736', 'Campaña Mundial 2026', '2026-06-11 00:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.configuraciones);
