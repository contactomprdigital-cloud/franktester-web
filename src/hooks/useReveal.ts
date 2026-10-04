import { useEffect, useRef, useState } from 'react'

// Un solo IntersectionObserver para todos los elementos que se revelan al hacer scroll
const callbacks = new Map<Element, () => void>()
const observer =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            callbacks.get(entry.target)?.()
            callbacks.delete(entry.target)
            observer?.unobserve(entry.target)
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      )

/** Devuelve `shown = true` la primera vez que el elemento entra en pantalla (una sola vez). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(observer === null)

  useEffect(() => {
    const el = ref.current
    if (!el || !observer) return
    callbacks.set(el, () => setShown(true))
    observer.observe(el)
    return () => {
      callbacks.delete(el)
      observer.unobserve(el)
    }
  }, [])

  return { ref, shown }
}
