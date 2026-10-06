-- =====================================================================
-- Catálogo FrankTester: escritura solo para el admin (C1), integridad de
-- datos (M2, M3), productos agregados desde el panel y bucket de fotos.
--
-- Proyecto: xqjzlypifyftdgaophvh · Tabla: public.products (42 filas reales)
--
-- - No destructiva: no borra filas ni columnas. `price` pasa de numeric a
--   integer redondeando (hoy todos los precios son enteros).
-- - Idempotente: se puede volver a correr. Borra y recrea sus propios checks,
--   políticas, funciones y trigger.
-- - Córrela COMPLETA y de una vez (SQL Editor o `supabase db push`): todo va en
--   una sola transacción; si algo falla, no se aplica nada.
-- - Antes, asigna el rol admin a la cuenta del panel (ver supabase/README.md).
--   Sin ese rol, nadie podrá editar el catálogo después de esta migración.
-- =====================================================================

-- El cambio de tipo de `price` toma un bloqueo exclusivo: si la tabla está
-- ocupada, mejor fallar a los 5 s que dejar en cola las lecturas de la tienda.
set local lock_timeout = '5s';


-- ---------------------------------------------------------------------
-- 0) Comprobación previa: si alguna fila no cumple las reglas nuevas, se
--    aborta sin tocar nada y el error dice qué filas revisar.
-- ---------------------------------------------------------------------
do $$
declare
  malas text;
begin
  select string_agg(id, ', ' order by id) into malas
  from public.products
  where id is null
     or id !~ '^[a-z0-9-]{1,60}$'
     or section is null
     or section not in ('hombre', 'mujer', 'nicho', 'ml50')
     or name is null
     or char_length(name) not between 1 and 80
     or inspiration is null
     or char_length(inspiration) > 80
     or volume is null
     or char_length(volume) > 20
     or price is null
     or round(price::numeric) not between 1 and 1000000
     or price <> round(price)
     or stock is null
     or stock not between 0 and 100000
     or notes is null
     or jsonb_typeof(notes) is distinct from 'object'
     or jsonb_typeof(notes -> 'top') is distinct from 'array'
     or jsonb_typeof(notes -> 'heart') is distinct from 'array'
     or jsonb_typeof(notes -> 'base') is distinct from 'array'
     or char_length(notes::text) > 4000
     or (badge is not null and badge not in ('bestseller', 'new'));

  if malas is not null then
    raise exception 'Hay productos que no cumplen las reglas nuevas: %', malas
      using hint = 'Corrígelos en el Table Editor (precio entre 1 y 1.000.000, notas con top/heart/base, etc.) y vuelve a correr la migración.';
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 1) Esquema privado (no expuesto por la API) para las funciones auxiliares.
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ¿El JWT de la petición es de un admin? El rol vive en app_metadata, que el
-- usuario no puede modificar (user_metadata sí). `(select auth.jwt())` se
-- evalúa una sola vez por consulta.
create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- updated_at lo fija la base de datos, no el navegador.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- 2) Columnas: precio entero y columnas nuevas.
-- ---------------------------------------------------------------------

-- Los CHECK actuales tienen nombres de fábrica que no conocemos: se quitan
-- todos y se recrean abajo, con nombres propios y reglas más estrictas.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.products drop constraint %I', c.conname);
  end loop;
end
$$;

-- PostgREST devuelve numeric como string ("8000"); integer llega como número.
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  ) <> 'integer' then
    alter table public.products
      alter column price type integer using round(price)::integer;
  end if;
end
$$;

alter table public.products
  add column if not exists image_url text,
  add column if not exists hidden boolean not null default false,
  add column if not exists custom boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

alter table public.products
  alter column section set not null,
  alter column name set not null,
  alter column inspiration set not null,
  alter column price set not null,
  alter column volume set not null,
  alter column notes set not null,
  alter column stock set not null,
  alter column stock set default 0,
  alter column updated_at set default now();


-- ---------------------------------------------------------------------
-- 3) Integridad: segunda barrera aunque el cliente falle (M2, M3).
-- ---------------------------------------------------------------------
alter table public.products
  add constraint products_id_format
    check (id ~ '^[a-z0-9-]{1,60}$'),
  add constraint products_section_valid
    check (section in ('hombre', 'mujer', 'nicho', 'ml50')),
  add constraint products_name_length
    check (char_length(name) between 1 and 80),
  add constraint products_name_not_blank
    check (btrim(name) <> ''),
  -- Un producto agregado desde el panel sin foto, inspiración o volumen el
  -- cliente lo descarta (también en el panel) y ya no se podría editar.
  add constraint products_custom_complete
    check (not custom or (image_url is not null and btrim(inspiration) <> '' and btrim(volume) <> '')),
  add constraint products_inspiration_length
    check (char_length(inspiration) <= 80),
  add constraint products_volume_length
    check (char_length(volume) <= 20),
  add constraint products_price_range
    check (price between 1 and 1000000),
  add constraint products_stock_range
    check (stock between 0 and 100000),
  add constraint products_badge_valid
    check (badge is null or badge in ('bestseller', 'new')),
  -- coalesce: si falta una clave, jsonb_typeof da NULL y un CHECK que da
  -- NULL se considera cumplido; así queda en false.
  add constraint products_notes_shape
    check (
      coalesce(
        jsonb_typeof(notes) = 'object'
        and jsonb_typeof(notes -> 'top') = 'array'
        and jsonb_typeof(notes -> 'heart') = 'array'
        and jsonb_typeof(notes -> 'base') = 'array'
        and char_length(notes::text) <= 4000,
        false
      )
    ),
  -- Solo fotos del bucket público de este proyecto; sin "..", espacios,
  -- query ni fragmento (no se puede apuntar a otro bucket ni a otro sitio).
  add constraint products_image_url_bucket
    check (
      image_url is null
      or (
        image_url ~ '^https://xqjzlypifyftdgaophvh\.supabase\.co/storage/v1/object/public/product-images/[A-Za-z0-9/_.-]{1,200}$'
        and strpos(image_url, '..') = 0
      )
    );


-- ---------------------------------------------------------------------
-- 4) Trigger de updated_at.
-- ---------------------------------------------------------------------
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function private.set_updated_at();


-- ---------------------------------------------------------------------
-- 5) RLS: lectura pública; escritura solo admin (C1).
--    La tienda lee también las filas ocultas (filtra en el cliente) para no
--    volver a mostrar la versión del código de un producto oculto.
-- ---------------------------------------------------------------------
alter table public.products enable row level security;

-- Políticas actuales (la de UPDATE es el hallazgo C1).
drop policy if exists "Authenticated can update products" on public.products;
drop policy if exists "Public can read products" on public.products;
-- Las de esta migración, por si se vuelve a correr.
drop policy if exists products_select_public on public.products;
drop policy if exists products_insert_admin on public.products;
drop policy if exists products_update_admin on public.products;
drop policy if exists products_delete_admin on public.products;

create policy products_select_public
  on public.products
  for select
  to anon, authenticated
  using (true);

-- El admin solo puede crear productos "agregados a mano".
create policy products_insert_admin
  on public.products
  for insert
  to authenticated
  with check ((select private.is_admin()) and custom = true);

create policy products_update_admin
  on public.products
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Solo se pueden borrar los agregados a mano, nunca los 42 del catálogo base.
create policy products_delete_admin
  on public.products
  for delete
  to authenticated
  using ((select private.is_admin()) and custom = true);


-- ---------------------------------------------------------------------
-- 6) Privilegios: se quitan los de fábrica (TRUNCATE, TRIGGER, REFERENCES,
--    escritura para anon...) y se dejan solo los que usa la app. RLS decide
--    quién escribe. INSERT y UPDATE van por columna: nadie puede cambiar id,
--    custom, created_at ni updated_at desde la API (así un producto del
--    catálogo base no puede marcarse como "custom" para luego borrarlo).
-- ---------------------------------------------------------------------
revoke all on table public.products from public, anon, authenticated;

grant select on table public.products to anon, authenticated;

grant insert (id, section, name, inspiration, price, volume, notes, badge, stock, image_url, hidden, custom)
  on table public.products to authenticated;

grant update (section, name, inspiration, price, volume, notes, badge, stock, image_url, hidden)
  on table public.products to authenticated;

grant delete on table public.products to authenticated;


-- ---------------------------------------------------------------------
-- 7) Storage: bucket público de fotos de productos.
--    Público = las URLs /object/public/... se sirven sin política SELECT.
--    No se agrega SELECT público: permitiría listar todos los archivos.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  2097152, -- 2 MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Permisos que exige cada operación del SDK (documentación de Supabase):
--   upload sin upsert -> INSERT
--   upload con upsert -> SELECT + INSERT + UPDATE (la app no lo usa: cada foto
--                        lleva un nombre nuevo, por eso no hay política UPDATE)
--   remove            -> SELECT + DELETE
--   list              -> SELECT
drop policy if exists product_images_admin_insert on storage.objects;
drop policy if exists product_images_admin_select on storage.objects;
drop policy if exists product_images_admin_delete on storage.objects;

create policy product_images_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (select private.is_admin())
    and (storage.foldername(name))[1] = 'products'
    and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png')
  );

create policy product_images_admin_select
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

create policy product_images_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
