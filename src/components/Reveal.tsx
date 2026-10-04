import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

interface RevealProps {
  children: ReactNode
  /** Posición en una cascada: cada paso suma 70 ms de retraso */
  index?: number
  className?: string
}

/** Aparece con un fundido hacia arriba la primera vez que entra en pantalla. */
export function Reveal({ children, index = 0, className = '' }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ '--i': index } as CSSProperties}>
      {children}
    </div>
  )
}
