# Supabase: catálogo y panel admin

La tienda es un sitio estático: toda escritura sale del navegador con la clave pública (anon). La seguridad real está aquí, en Auth + RLS:

- Cualquiera puede **leer** `public.products`.
- Solo el **admin** puede crear, editar y borrar productos, y subir o borrar fotos del bucket `product-images`. Solo se pueden borrar los productos agregados desde el panel (`custom = true`).
- El admin se reconoce por el claim `app_metadata.role = 'admin'` de su JWT. El usuario no puede modificar `app_metadata` (a diferencia de `user_metadata`).

## Orden para aplicarlo

1. **Ajustes de Auth** (panel de Supabase):
   - *Authentication → Sign In / Providers*: desactiva **Allow new users to sign up** y deja **Anonymous sign-ins** desactivado. Así nadie puede crearse una cuenta con la clave pública.
   - *Authentication → Attack Protection*: activa **Prevent use of leaked passwords** (requiere plan Pro). Usa una clave de 12 caracteres o más.
   - *Authentication → Users*: revisa que solo existan cuentas conocidas.
2. **Asignar el rol admin** a la cuenta del panel, en el SQL Editor (cambia el correo de ejemplo por el real; no lo guardes en el repo, que es público):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
   where email = 'admin@ejemplo.cl';
   ```

3. **Aplicar la migración** `migrations/20261005120000_products_admin_storage.sql`: pégala completa en el SQL Editor y córrela de una vez, o usa `supabase db push`. Si alguna fila no cumple las reglas nuevas, se detiene sin cambiar nada y dice qué productos revisar.
4. **Verificar** con `verify.sql` (solo lectura): la primera consulta tiene que dar `true` en todas las columnas.
5. **Cerrar sesión y volver a entrar** en `/admin`. El claim se copia al JWT al iniciar sesión, así que una sesión abierta antes del paso 2 no lo trae. El panel cierra solo las sesiones sin rol admin y muestra "Esta cuenta no tiene permisos de administrador".

## Quitar el rol admin

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'role'
where email = 'admin@ejemplo.cl';
```

El JWT ya emitido sigue valiendo hasta que vence (1 hora por defecto). Para cortarlo antes, cierra las sesiones de ese usuario desde *Authentication → Users*.

## Fotos

- Bucket público `product-images`: máximo 2 MB por archivo, solo WebP, JPEG o PNG.
- El panel reduce las fotos a 1200 px y las convierte a WebP (o a JPEG si el navegador no sabe generar WebP, como Safari en iPhone). Así se eliminan los metadatos EXIF, como la ubicación. Las guarda en `products/<id>/<uuid>.webp`.
- No hay política SELECT pública: las URLs `/object/public/...` se sirven igual, pero nadie fuera del admin puede listar los archivos.
