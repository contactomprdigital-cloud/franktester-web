import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useRef } from 'react'
import type { Review } from '../data/types'
import { Reveal } from './Reveal'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-gold-400" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={15} fill={i < rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </div>
  )
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <section id="resenas" className="relative bg-forest-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Testimonios</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl text-cream">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="grid h-11 w-11 place-items-center rounded-full text-cream ring-1 ring-white/15 hover:bg-white/10 active:scale-90 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Siguiente"
              className="grid h-11 w-11 place-items-center rounded-full text-cream ring-1 ring-white/15 hover:bg-white/10 active:scale-90 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </Reveal>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex w-[82%] shrink-0 snap-start flex-col gap-3 rounded-2xl bg-forest-800/60 p-6 ring-1 ring-white/10 sm:w-[360px]"
            >
              <Stars rating={review.rating} />
              <p className="flex-1 text-[15px] leading-relaxed text-cream/80">&ldquo;{review.comment}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-500/15 font-display text-lg text-gold-300">
                  {review.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-cream">{review.name}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
