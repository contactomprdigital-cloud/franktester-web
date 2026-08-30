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

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  session: null,
  sessionChecked: false,
  isAuthed: false,
  error: null,
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      set({ error: 'Correo o clave incorrectos. Intenta nuevamente.' })
      return false
    }
    set({ session: data.session, isAuthed: true, error: null })
    return true
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, isAuthed: false })
  },
}))

supabase.auth.getSession().then(({ data }) => {
  useAdminAuthStore.setState({ session: data.session, isAuthed: data.session !== null, sessionChecked: true })
})

supabase.auth.onAuthStateChange((_event, session) => {
  useAdminAuthStore.setState({ session, isAuthed: session !== null, sessionChecked: true })
})
