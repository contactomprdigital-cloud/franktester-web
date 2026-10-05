import { ChevronDown } from 'lucide-react'
import type { ReactNode, SelectHTMLAttributes } from 'react'

// Estilos compartidos del panel. Texto de 16 px en el celular para que iOS no
// haga zoom al enfocar un campo.
export const inputClass =
  'h-11 w-full rounded-lg bg-forest-950/70 px-3 text-base text-cream outline-none ring-1 ring-white/10 transition-shadow placeholder:text-cream/30 focus:ring-2 focus:ring-gold-400/70 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/80 disabled:opacity-60 sm:text-sm'

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-[transform,background-color,color] duration-200 ease-lux active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

export const primaryButton = `${buttonBase} bg-gold-500 px-5 font-bold text-forest-950 hover:bg-gold-400`
export const secondaryButton = `${buttonBase} bg-white/5 text-cream ring-1 ring-white/15 hover:bg-white/10`
export const dangerButton = `${buttonBase} bg-transparent text-danger ring-1 ring-danger/40 hover:bg-danger/10`
export const successButton = `${buttonBase} bg-trebol/15 text-[#8fe0a5] ring-1 ring-trebol/40`

interface FieldProps {
  id: string
  label: string
  hint?: string
  className?: string
  children: ReactNode
}

/** Etiqueta visible + campo + ayuda opcional (enlazada con aria-describedby desde el campo) */
export function Field({ id, label, hint, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-muted">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-cream/55">
          {hint}
        </p>
      )}
    </div>
  )
}

/** <select> con el mismo estilo que los campos de texto */
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} appearance-none pr-9 [&>option]:bg-forest-900 ${className}`}>
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted"
      />
    </div>
  )
}
