import { motion } from 'framer-motion'
import logo from '../assets/logo.webp'

const EASE_LUX = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* color de fondo: aportado por <ScrollBackground /> (fixed, capa "top") */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,162,39,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-noise mix-blend-overlay" />

      {/* floating gold particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-gold-400/70"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
            animate={{ opacity: [0.15, 0.8, 0.15], y: [0, -16, 0] }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i % 7) * 0.4,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUX }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-gold-500/25 blur-3xl" />
          <img
            src={logo}
            alt="FrankTester"
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover ring-1 ring-gold-400/40 shadow-[0_0_60px_rgba(201,162,39,0.35)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_LUX, delay: 0.15 }}
          className="mb-3 text-xs sm:text-sm uppercase tracking-[0.35em] text-gold-400"
        >
          Perfumería inspirada · 30&nbsp;ml
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUX, delay: 0.25 }}
          className="shimmer-gold text-balance font-display text-5xl sm:text-7xl leading-[1.05]"
        >
          Testea tu suerte
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUX, delay: 0.4 }}
          className="mt-6 max-w-xl text-balance text-base sm:text-lg text-cream/75"
        >
          Fragancias inspiradas en los grandes íconos del perfume, a un precio que no
          esperabas. Hombre, mujer y nicho — todo a $6.000 y $8.000 los 30&nbsp;ml, con
          envíos a todo Chile.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUX, delay: 0.55 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="#hombre"
            className="min-h-[44px] rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-forest-950 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04] hover:bg-gold-400 active:scale-[0.97]"
          >
            Explorar catálogo
          </a>
          <a
            href="#nicho"
            className="min-h-[44px] rounded-full border border-gold-400/50 px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-300 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04] hover:border-gold-300 hover:bg-white/5 active:scale-[0.97]"
          >
            Línea Nicho
          </a>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-9 w-5 rounded-full border border-gold-400/50 p-1">
          <div className="h-1.5 w-1.5 rounded-full bg-gold-400" />
        </div>
      </motion.div>
    </section>
  )
}
