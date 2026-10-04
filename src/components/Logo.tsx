import { useId } from 'react'

const LEAF = 'M0 -1.7 C -1.7 -6.9 -13.8 -9.2 -13.2 -17.8 C -12.7 -24.2 -5.2 -25.3 0 -19.6 C 5.2 -25.3 12.7 -24.2 13.2 -17.8 C 13.8 -9.2 1.7 -6.9 0 -1.7 Z'

/**
 * Versión web del logo (vector): trébol dorado de cuatro hojas-corazón sobre el
 * disco verde de la marca. El degradado de las hojas es radial y centrado, así
 * que se ve igual en las cuatro aunque cada una esté rotada.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg viewBox="-33 -33 66 66" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-leaf`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="27">
          <stop offset="0" stopColor="#8f610c" />
          <stop offset=".3" stopColor="#d4a530" />
          <stop offset=".72" stopColor="#f6dc84" />
          <stop offset="1" stopColor="#c99a1e" />
        </radialGradient>
        <radialGradient id={`${id}-disc`} gradientUnits="userSpaceOnUse" cx="0" cy="-8" r="36">
          <stop offset="0" stopColor="#36b858" />
          <stop offset=".6" stopColor="#1f9a3c" />
          <stop offset="1" stopColor="#11702a" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0b0" />
          <stop offset=".5" stopColor="#d9ab35" />
          <stop offset="1" stopColor="#9a6a0f" />
        </linearGradient>
      </defs>
      <circle r="31" fill={`url(#${id}-disc)`} stroke={`url(#${id}-ring)`} strokeWidth="1.6" />
      <path d="M0 2 C 0 14 1 22 7 29.5" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="2.4" strokeLinecap="round" />
      {[45, 135, 225, 315].map((deg) => (
        <path
          key={deg}
          d={LEAF}
          transform={`rotate(${deg})`}
          fill={`url(#${id}-leaf)`}
          stroke="#6e4a0a"
          strokeWidth=".6"
        />
      ))}
      <circle r="2.2" fill="#f6dc84" />
    </svg>
  )
}

/** Símbolo + nombre, como en el header y el footer. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />
      <span className="font-display text-[25px] font-semibold leading-none text-gold-300">
        Frank<span className="text-gold-500">Tester</span>
      </span>
    </span>
  )
}
