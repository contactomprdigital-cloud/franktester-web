import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AdminAuthState {
  session: Session | null
  sessionChecked: boolean
  isAuthed: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const NOT_CONFIGURED = 'El panel no está disponible: falta configurar Supabase.'

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  session: null,
  sessionChecked: supabase === null,
  isAuthed: false,
  error: null,
  login: async (email, password) => {
    if (!supabase) {
      set({ error: NOT_CONFIGURED })
      return false
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      set({ error: 'Correo o clave incorrectos. Intenta nuevamente.' })
      return false
    }
    set({ session: data.session, isAuthed: true, error: null })
    return true
  },
  logout: async () => {
    try {
      await supabase?.auth.signOut()
    } finally {
      set({ session: null, isAuthed: false })
    }
  },
}))

if (supabase) {
  supabase.auth
    .getSession()
    .then(({ data }) => {
      useAdminAuthStore.setState({ session: data.session, isAuthed: data.session !== null, sessionChecked: true })
    })
    .catch(() => {
      useAdminAuthStore.setState({ session: null, isAuthed: false, sessionChecked: true })
    })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAdminAuthStore.setState({ session, isAuthed: session !== null, sessionChecked: true })
  })
}
