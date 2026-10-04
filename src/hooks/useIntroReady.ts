import { useEffect, useState } from 'react'

/**
 * true cuando la portada puede arrancar su intro: lo avisa public/boot.js al
 * retirar la apertura de marca (o de inmediato, si ya había fuentes cargadas).
 */
export function useIntroReady() {
  const [ready, setReady] = useState(() => window.__ftIntro === true)

  useEffect(() => {
    if (ready) return
    const go = () => setReady(true)
    if (window.__ftIntro) {
      go()
      return
    }
    window.addEventListener('ft:intro', go, { once: true })
    // Por si boot.js no está (p. ej. una prueba aislada): nunca dejar la portada oculta
    const fallback = setTimeout(go, 3000)
    return () => {
      window.removeEventListener('ft:intro', go)
      clearTimeout(fallback)
    }
  }, [ready])

  return ready
}
