import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { Section } from '../data/types'

type SectionId = 'top' | 'hombre' | 'mujer' | 'nicho' | 'resultados'

const TOP_GRADIENT = 'radial-gradient(120% 90% at 50% -10%, #17331f 0%, #0f1f14 55%, #0a150d 100%)'

// Los degradados de hombre/mujer/nicho se comparten con la capa "resultados":
// cuando el filtro activo corresponde a una sola sección, "resultados" debe
// verse idéntico a como se ve esa sección fuera de modo filtro.
const SECTION_GRADIENTS: Record<Section, string> = {
  hombre: 'radial-gradient(120% 90% at 85% 15%, #1e3a52 0%, #0f2f4f 55%, #081826 100%)',
  mujer: 'radial-gradient(120% 90% at 15% 15%, #c2359e 0%, #7c1d6f 45%, #2a0a24 100%)',
  // hotspot más chico, más oscuro y más pegado a la esquina que el resto de las
  // capas: el mint claro pierde contraste contra el texto crema del heading si
  // se deja tan brillante/extendido como en las otras 3 secciones.
  nicho: 'radial-gradient(90% 70% at 95% 8%, #5fd1a3 0%, #237e68 40%, #0b2420 100%)',
}

// Cada capa es un degradado CSS puro (nunca color plano) fijado a pantalla completa.
// El scroll solo anima `opacity` — nunca backgroundColor — para que el crossfade
// corra enteramente en el compositor (GPU) sin disparar paint.
const LAYERS: { id: SectionId; gradient: string }[] = [
  { id: 'top', gradient: TOP_GRADIENT },
  { id: 'hombre', gradient: SECTION_GRADIENTS.hombre },
  { id: 'mujer', gradient: SECTION_GRADIENTS.mujer },
  { id: 'nicho', gradient: SECTION_GRADIENTS.nicho },
  // El color real de "resultados" se resuelve en el render (ver resultSection):
  // acá solo queda un valor de respaldo por si algo lo renderiza sin props.
  { id: 'resultados', gradient: TOP_GRADIENT },
]

// La capa entra durante el primer 15% del recorrido de su sección, se mantiene
// llena en el tramo central y sale en el último 15%. Con keyframes en 0/0.5/1
// una sección alta (grilla de 16 cards) tarda miles de px en llegar a opacidad
// 1; anclar el fade cerca de los bordes lo hace independiente del alto.
const FADE_IN = [0, 0.15, 0.85, 1]
const FADE_OUT = [0, 1, 1, 0]

function useSectionOpacity(sectionId: SectionId, reduceMotion: boolean): MotionValue<number> {
  const targetRef = useRef<HTMLElement | null>(null)

  // La sección vive en otro componente (Hero, ProductSection), así que no hay
  // forma de pasarle un ref por props sin tocarlo: se resuelve por id.
  // useLayoutEffect corre antes del primer paint, así que useScroll (declarado
  // justo después, mismo orden de hooks) ya ve el ref poblado en este mismo commit.
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

// framer-motion's useScroll binds a scroll listener to `target.current` a
// single time, at mount — it never re-checks the ref afterwards. If
// ProductSection unmounts/remounts (filtros on/off) the resuelto id changes
// but useScroll keeps tracking the old, now-detached node forever, so the
// layer freezes at opacity 0. `remountKey` (passed by the parent as the
// layer's React `key`) forces a full unmount+remount of this component so
// useScroll re-binds to whichever node currently matches the id.
function SectionLayer({
  id,
  gradient,
  reduceMotion,
}: {
  id: SectionId
  gradient: string
  reduceMotion: boolean
}) {
  const opacity = useSectionOpacity(id, reduceMotion)
  return <motion.div className="absolute inset-0" style={{ background: gradient, opacity }} />
}

export function ScrollBackground({
  isFiltering,
  resultSection,
}: {
  isFiltering: boolean
  // Sección cuyo color debe mostrar la capa "resultados" mientras se filtra
  // (ej. filtro de sección = "mujer", o notas cuyos resultados son todos de
  // una misma sección). null = resultados mezclados, usa el degradado neutro.
  resultSection: Section | null
}) {
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: LAYERS[0].gradient }}
      aria-hidden="true"
    >
      {LAYERS.map((layer) => (
        <SectionLayer
          key={`${layer.id}-${isFiltering}`}
          id={layer.id}
          gradient={layer.id === 'resultados' ? (resultSection ? SECTION_GRADIENTS[resultSection] : TOP_GRADIENT) : layer.gradient}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  )
}
