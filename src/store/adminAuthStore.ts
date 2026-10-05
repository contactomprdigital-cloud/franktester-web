import type { AuthError, Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AdminAuthState {
  session: Session | null
  sessionChecked: boolean
  /** Hay sesión y el JWT trae app_metadata.role = 'admin' */
  isAdmin: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const NOT_CONFIGURED = 'El panel no está disponible: falta configurar Supabase.'
const NOT_ADMIN ='Esta cuenta no tiene permisos de administrador.'

// app_metadata solo lo cambia el servidor (el usuario no puede editarlo). Es
// el mismo claim que exige la RLS; este chequeo es solo para la interfaz.
const isAdminSession = (s: Session | null) => s?.user.app_metadata?.role === 'admin'

function loginError(error: AuthError | null): string {
  if (error?.status === 429) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
  if (error && (error.status === 0 || error.name === 'AuthRetryableFetchError'))
    return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.'
  return 'Correo o clave incorrectos. Intenta nuevamente.'
}

let signingOut = false

/** Sesión válida pero sin rol admin: se cierra y se avisa. */
function rejectNonAdmin() {
  useAdminAuthStore.setState({ session: null, isAdmin: false, sessionChecked: true, error: NOT_ADMIN })
  if (signingOut || !supabase) return
  signingOut = true
  // Diferido: llamar a Supabase dentro de onAuthStateChange puede bloquearse.
  const client = supabase
  setTimeout(() => {
    client.auth
      .signOut()
      .catch(() => {})
      .finally(() => {
        signingOut = false
      })
  }, 0)
}

function applySession(session: Session | null) {
  if (session && !isAdminSession(session)) {
    rejectNonAdmin()
    return
  }
  useAdminAuthStore.setState({ session, isAdmin: session !== null, sessionChecked: true })
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  session: null,
  sessionChecked: supabase === null,
  isAdmin: false,
  error: null,
  login: async (email, password) => {
    if (!supabase) {
      set({ error: NOT_CONFIGURED })
      return false
    }
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.session) {
      set({ error: loginError(error) })
      return false
    }
    if (!isAdminSession(data.session)) {
      rejectNonAdmin()
      return false
    }
    set({ session: data.session, isAdmin: true, sessionChecked: true, error: null })
    return true
  },
  logout: async () => {
    try {
      await supabase?.auth.signOut()
    } catch {
      // signOut limpia la sesión local aunque falle la red
    } finally {
      set({ session: null, isAdmin: false, error: null })
    }
  },
}))

if (supabase) {
  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .catch(() => {
      useAdminAuthStore.setState({ session: null, isAdmin: false, sessionChecked: true })
    })

  // También cubre el refresco del token: si al admin le quitan el rol, el
  // siguiente JWT ya no lo trae y la sesión se cierra.
  const { data } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
  // Con HMR el módulo se recarga: se suelta el listener anterior para no duplicarlo.
  import.meta.hot?.dispose(() => data.subscription.unsubscribe())
}
