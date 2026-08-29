import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li'
}

const EASE_LUX = [0.22, 1, 0.36, 1] as const

export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: RevealProps) {
  const Component = motion[as]
  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE_LUX, delay }}
      className={className}
    >
      {children}
    </Component>
  )
}
