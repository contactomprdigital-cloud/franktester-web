import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import { useAdminAuthStore } from '../../store/adminAuthStore'

export function AdminLogin() {
  const sessionChecked = useAdminAuthStore((s) => s.sessionChecked)
  const isAuthed = useAdminAuthStore((s) => s.isAuthed)
  const login = useAdminAuthStore((s) => s.login)
  const error = useAdminAuthStore((s) => s.error)
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')

  if (sessionChecked && isAuthed) return <Navigate to="/admin" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    login(email, passcode)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-forest-950 px-4">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-forest-800/60 p-8 ring-1 ring-white/10"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="FrankTester" className="h-16 w-16 rounded-full object-cover" />
          <h1 className="font-display text-3xl text-cream">Panel Admin</h1>
          <p className="text-sm text-cream/50">Acceso exclusivo para el equipo FrankTester</p>
        </div>

        <label className="mb-1.5 block text-xs uppercase tracking-wide text-cream/50" htmlFor="email">
          Correo
        </label>
        <div className="relative mb-4">
          <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoFocus
            autoComplete="username"
            className="h-12 w-full rounded-full bg-forest-950/70 pl-10 pr-4 text-sm text-cream outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-gold-400/60"
          />
        </div>

        <label className="mb-1.5 block text-xs uppercase tracking-wide text-cream/50" htmlFor="passcode">
          Clave de acceso
        </label>
        <div className="relative mb-2">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-12 w-full rounded-full bg-forest-950/70 pl-10 pr-4 text-sm text-cream outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-gold-400/60"
          />
        </div>
        {error && <p className="mb-3 text-xs text-red-300">{error}</p>}

        <button
          type="submit"
          className="mt-4 min-h-[48px] w-full rounded-full bg-gold-500 text-sm font-bold uppercase tracking-wide text-forest-950 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.97]"
        >
          Ingresar
        </button>
      </motion.form>
    </div>
  )
}
