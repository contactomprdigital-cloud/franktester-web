import { useEffect, useState } from 'react'

/**
 * Sección en la que está el usuario: la última cuyo borde superior pasó el 40 %
 * de la pantalla. `null` mientras está en la portada (o si `enabled` es false).
 * `ids` debe ser estable (useMemo): cambiarlo vuelve a registrar los listeners.
 */
export function useActiveSection<T extends string>(ids: readonly T[], enabled: boolean) {
  const [active, setActive] = useState<T | null>(null)

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.4
      let current: T | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids, enabled])

  return enabled ? active : null
}
