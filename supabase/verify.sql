-- =====================================================================
-- Verificación de la migración 20261005120000_products_admin_storage.sql
-- SOLO LECTURA: no modifica nada. Córrelo en el SQL Editor después de
-- aplicar la migración. La consulta 1 resume todo en verdadero/falso; las
-- demás muestran el detalle para revisar a mano.
-- =====================================================================


-- 1) Resumen: todas las columnas deben salir en `true`.
select
  -- Datos: siguen las 42 filas del catálogo base
  (select count(*) from public.products where not custom) = 42                     as filas_base_42,
  (select count(*) from public.products where price < 1 or price > 1000000) = 0    as precios_en_rango,

  -- Columnas
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price') = 'integer'
                                                                                    as price_integer,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name in ('image_url', 'hidden', 'custom', 'created_at')) = 4      as columnas_nuevas,

  -- CHECK propios (10)
  (select count(*) from pg_constraint
    where conrelid = 'public.products'::regclass and contype = 'c'
      and conname in ('products_id_format', 'products_section_valid', 'products_name_length',
                      'products_inspiration_length', 'products_volume_length', 'products_price_range',
                      'products_stock_range', 'products_badge_valid', 'products_notes_shape',
                      'products_image_url_bucket')) = 10                            as checks_ok,

  -- Trigger de updated_at
  exists (select 1 from pg_trigger
    where tgrelid = 'public.products'::regclass and tgname = 'products_set_updated_at' and tgenabled = 'O')
                                                                                    as trigger_ok,

  -- RLS activo y políticas
  (select relrowsecurity from pg_class where oid = 'public.products'::regclass)    as rls_activo,
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and policyname = 'Authenticated can update products')                        as politica_c1_borrada,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'products') = 4                    as cuatro_politicas,
  -- Ninguna política de escritura queda abierta (sin is_admin)
  not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products' and cmd <> 'SELECT'
      and coalesce(qual, '') || coalesce(with_check, '') not like '%is_admin()%')  as escritura_solo_admin,
  -- DELETE e INSERT exigen custom = true
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'products' and cmd in ('DELETE', 'INSERT')
      and coalesce(qual, '') || coalesce(with_check, '') like '%custom = true%') = 2
                                                                                    as delete_insert_solo_custom,

  -- Privilegios de tabla: anon solo lee; authenticated lee y borra (RLS filtra);
  -- INSERT/UPDATE de authenticated solo por columna.
  not has_table_privilege('anon', 'public.products', 'INSERT')
    and not has_table_privilege('anon', 'public.products', 'UPDATE')
    and not has_table_privilege('anon', 'public.products', 'DELETE')
    and not has_table_privilege('anon', 'public.products', 'TRUNCATE')
    and has_table_privilege('anon', 'public.products', 'SELECT')                   as grants_anon_ok,
  not has_table_privilege('authenticated', 'public.products', 'TRUNCATE')
    and not has_table_privilege('authenticated', 'public.products', 'TRIGGER')
    and not has_table_privilege('authenticated', 'public.products', 'REFERENCES')
    and not has_column_privilege('authenticated', 'public.products', 'id', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.products', 'custom', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.products', 'created_at', 'INSERT')
    and has_column_privilege('authenticated', 'public.products', 'hidden', 'UPDATE')
    and has_table_privilege('authenticated', 'public.products', 'DELETE')          as grants_authenticated_ok,

  -- Funciones privadas: anon no puede ejecutarlas; private no está expuesto
  not has_function_privilege('anon', 'private.is_admin()', 'EXECUTE')
    and has_function_privilege('authenticated', 'private.is_admin()', 'EXECUTE')   as is_admin_grants_ok,
  not has_schema_privilege('anon', 'private', 'USAGE')                             as private_sin_anon,

  -- Bucket
  exists (select 1 from storage.buckets
    where id = 'product-images' and public
      and file_size_limit = 2097152
      and allowed_mime_types @> array['image/webp', 'image/jpeg', 'image/png']
      and array_length(allowed_mime_types, 1) = 3)                                 as bucket_ok,
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('product_images_admin_insert', 'product_images_admin_select',
                         'product_images_admin_delete')) = 3                       as storage_politicas_ok,
  -- Nadie fuera del admin puede listar el bucket (sin SELECT para anon/public)
  not exists (select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('SELECT', 'ALL')
      and (roles && array['anon', 'public']::name[])
      and (coalesce(qual, '') like '%product-images%' or coalesce(qual, '') = 'true'))
                                                                                    as bucket_no_listable,

  -- Realtime sigue publicando la tabla
  exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products')
                                                                                    as realtime_ok;


-- 2) Filas por categoría y estado (deben seguir las 42 del catálogo base).
select section, custom, hidden, count(*) as filas, min(price) as precio_min, max(price) as precio_max
from public.products
group by section, custom, hidden
order by section, custom, hidden;


-- 3) Columnas y tipos.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'products'
order by ordinal_position;


-- 4) CHECK y demás restricciones.
select conname, contype, pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.products'::regclass
order by conname;


-- 5) Políticas de products.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'products'
order by policyname;


-- 6) Privilegios de tabla y de columna para anon y authenticated.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'products' and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select grantee, privilege_type, string_agg(column_name, ', ' order by column_name) as columnas
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'products' and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE')
group by grantee, privilege_type
order by grantee, privilege_type;


-- 7) Trigger.
select tgname, tgenabled, pg_get_triggerdef(oid) as definicion
from pg_trigger
where tgrelid = 'public.products'::regclass and not tgisinternal;


-- 8) Bucket y políticas de Storage del bucket.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and (coalesce(qual, '') || coalesce(with_check, '')) like '%product-images%'
order by policyname;


-- 9) Usuarios con rol admin (solo cuenta; no muestra correos).
select count(*) as admins
from auth.users
where raw_app_meta_data ->> 'role' = 'admin';


-- 10) Simulación del claim (no escribe nada; se revierte al final).
--     Deben salir: true para el JWT admin y false para el de un usuario común.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"admin"}}', true);
select private.is_admin() as jwt_admin_es_admin;
select set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"provider":"email"}}', true);
select private.is_admin() as jwt_comun_es_admin;
rollback;
