import { LoaderCircle, Lock, Mail } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LogoMark } from '../../components/Logo'
import { useAdminAuthStore } from '../../store/adminAuthStore'

const fieldClass =
  'h-12 w-full rounded-full bg-forest-950/70 pl-10 pr-4 text-base text-cream outline-none ring-1 ring-white/10 placeholder:text-cream/30 focus:ring-2 focus:ring-gold-400/60 disabled:opacity-60 sm:text-sm'

export function AdminLogin() {
  const sessionChecked = useAdminAuthStore((s) => s.sessionChecked)
  const isAdmin = useAdminAuthStore((s) => s.isAdmin)
  const login = useAdminAuthStore((s) => s.login)
  const error = useAdminAuthStore((s) => s.error)
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Candado síncrono contra el doble envío
  const submittingRef = useRef(false)

  if (sessionChecked && isAdmin) return <Navigate to="/admin" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      await login(email, passcode)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-forest-950 px-4 py-10 [color-scheme:dark]">
      <form
        onSubmit={onSubmit}
        aria-labelledby="login-title"
        aria-busy={submitting}
        className="w-full max-w-sm rounded-2xl bg-forest-800 p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] motion-safe:animate-[fade-up_600ms_var(--ease-lux)_both] sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark className="h-16 w-16 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" />
          <h1 id="login-title" className="font-display text-3xl text-cream">
            Panel admin
          </h1>
          <p className="text-sm text-cream-muted">Acceso exclusivo para el equipo FrankTester</p>
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-muted" htmlFor="email">
          Correo
        </label>
        <div className="relative mb-4">
          <Mail
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted"
          />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoFocus
            autoComplete="username"
            required
            disabled={submitting}
            className={fieldClass}
          />
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-muted" htmlFor="passcode">
          Clave
        </label>
        <div className="relative">
          <Lock
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted"
          />
          <input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={submitting}
            aria-describedby={error ? 'login-error' : undefined}
            className={fieldClass}
          />
        </div>

        <div aria-live="assertive">
          {error && (
            <p id="login-error" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold-500 text-sm font-bold uppercase tracking-wide text-forest-950 transition-[transform,background-color] duration-200 ease-lux hover:bg-gold-400 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {submitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Ingresando…
            </>
          ) : (
            'Ingresar'
          )}
        </button>
      </form>
    </div>
  )
}
