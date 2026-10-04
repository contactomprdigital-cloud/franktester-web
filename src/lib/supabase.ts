import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sin variables (p. ej. un deploy preview sin configurar) la tienda sigue
// funcionando con el catálogo del código: solo el admin y la sincronización
// en vivo quedan desactivados, en vez de dejar la página en blanco.
//
// detectSessionInUrl: la app no usa magic links, OAuth ni recuperación de
// clave, así que no debe aceptar sesiones que lleguen en la URL (evita que un
// enlace con tokens de otra cuenta reemplace la sesión del admin).
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { detectSessionInUrl: false, flowType: 'pkce' } }) : null
