import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useLayoutEffect, useRef, type RefObject } from 'react'

type SectionId = 'top' | 'hombre' | 'mujer' | 'nicho'

// Cada capa es un degradado CSS puro (nunca color plano) fijado a pantalla completa.
// El scroll solo anima `opacity` — nunca backgroundColor — para que el crossfade
// corra enteramente en el compositor (GPU) sin disparar paint.
const LAYERS: { id: SectionId; gradient: string }[] = [
  { id: 'top', gradient: 'radial-gradient(120% 90% at 50% -10%, #17331f 0%, #0f1f14 55%, #0a150d 100%)' },
  { id: 'hombre', gradient: 'radial-gradient(120% 90% at 85% 15%, #1e3a52 0%, #0f2f4f 55%, #081826 100%)' },
  { id: 'mujer', gradient: 'radial-gradient(120% 90% at 15% 15%, #c2359e 0%, #7c1d6f 45%, #2a0a24 100%)' },
  // hotspot más chico, más oscuro y más pegado a la esquina que el resto de las
  // capas: el mint claro pierde contraste contra el texto crema del heading si
  // se deja tan brillante/extendido como en las otras 3 secciones.
  { id: 'nicho', gradient: 'radial-gradient(90% 70% at 95% 8%, #5fd1a3 0%, #237e68 40%, #0b2420 100%)' },
]

// La capa entra durante el primer 15% del recorrido de su sección, se mantiene
// llena en el tramo central y sale en el último 15%. Con keyframes en 0/0.5/1
// una sección alta (grilla de 16 cards) tarda miles de px en llegar a opacidad
// 1; anclar el fade cerca de los bordes lo hace independiente del alto.
const FADE_IN = [0, 0.15, 0.85, 1]
const FADE_OUT = [0, 1, 1, 0]

function useSectionOpacity(sectionId: SectionId, reduceMotion: boolean): MotionValue<number> {
  const targetRef = useRef<HTMLElement | null>(null)

  // Las 4 secciones viven en otros componentes (Hero, ProductSection), así
  // que no hay forma de pasarles un ref por props sin tocarlos: se resuelven
  // por id. useLayoutEffect corre antes del primer paint, así que useScroll
  // (declarado justo después, mismo orden de hooks) ya ve el ref poblado.
  useLayoutEffect(() => {
    targetRef.current = document.getElementById(sectionId)
  }, [sectionId])

  const { scrollYProgress } = useScroll({
    target: targetRef as RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  })

  const rawOpacity = useTransform(scrollYProgress, FADE_IN, FADE_OUT)
  const springOpacity = useSpring(rawOpacity, { stiffness: 90, damping: 20 })

  return reduceMotion ? rawOpacity : springOpacity
}

export function ScrollBackground() {
  const reduceMotion = Boolean(useReducedMotion())

  // Hooks siempre en el mismo orden, nunca condicionales.
  const topOpacity = useSectionOpacity('top', reduceMotion)
  const hombreOpacity = useSectionOpacity('hombre', reduceMotion)
  const mujerOpacity = useSectionOpacity('mujer', reduceMotion)
  const nichoOpacity = useSectionOpacity('nicho', reduceMotion)

  const opacityById: Record<SectionId, MotionValue<number>> = {
    top: topOpacity,
    hombre: hombreOpacity,
    mujer: mujerOpacity,
    nicho: nichoOpacity,
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: LAYERS[0].gradient }}
      aria-hidden="true"
    >
      {LAYERS.map((layer) => (
        <motion.div
          key={layer.id}
          className="absolute inset-0"
          style={{ background: layer.gradient, opacity: opacityById[layer.id] }}
        />
      ))}
    </div>
  )
}
