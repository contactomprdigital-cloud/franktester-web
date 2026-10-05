import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { SectionInfo } from '../data/sections'
import type { Product, Section } from '../data/types'
import { useIntroReady } from '../hooks/useIntroReady'
import { shortLabel, useVisibleSections } from '../hooks/useVisibleSections'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { useCatalogStore } from '../store/catalogStore'
import { useProductModalStore } from '../store/productModalStore'
import { CloverIcon } from './icons'
import { ProductImage } from './ProductImage'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties

const WORDS = ['Testea', 'tu', 'suerte']
// Pocos destellos y solo en la portada: se pausan cuando sale de pantalla
const SPARKS = [
  { left: '12%', top: '30%', delay: '1.4s', size: 9 },
  { left: '84%', top: '26%', delay: '2.3s', size: 12 },
  { left: '72%', top: '46%', delay: '3.1s', size: 7 },
  { left: '24%', top: '52%', delay: '3.8s', size: 8 },
  { left: '90%', top: '62%', delay: '1.9s', size: 10 },
  { left: '6%', top: '70%', delay: '4.4s', size: 7 },
]
// Columnas de los botones de colección en móvil (el dorado ocupa la fila completa)
const CTA_COLS = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4']

/** Formatos a la venta para el chip del hero: "30 ml", o "30 y 50 ml" cuando hay de los dos. */
function volumesLabel(products: Product[]) {
  const volumes = [...new Set(products.map((p) => p.volume.trim()))]
  if (volumes.length === 0) return ''
  const amounts = volumes.map((v) => /^(\d+) ?ml$/i.exec(v)?.[1])
  if (amounts.every(Boolean)) {
    const sorted = (amounts as string[]).map(Number).sort((a, b) => a - b)
    return `${sorted.slice(0, -1).join(', ')}${sorted.length > 1 ? ' y ' : ''}${sorted[sorted.length - 1]} ml`
  }
  return volumes.join(' · ')
}

/** Un más vendido con stock por colección visible, en el orden de las colecciones. */
function pickBestsellers(products: Product[], sections: readonly SectionInfo[]) {
  return sections
    .map((section) => products.find((p) => p.section === section.id && p.badge === 'bestseller' && p.stock > 0))
    .filter((p): p is Product => p !== undefined)
}

export function Hero({ onNavigate }: { onNavigate: (id: Section) => void }) {
  const play = useIntroReady()
  const [paused, setPaused] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const cloverRef = useRef<SVGSVGElement>(null)
  const products = useCatalogStore((s) => s.products)
  const sections = useVisibleSections()
  const openModal = useProductModalStore((s) => s.open)
  const bestsellers = pickBestsellers(products, sections)
  const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : null
  const volumes = volumesLabel(products)

  // El brillo ambiental no corre mientras la portada no está en pantalla
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // "Testea tu suerte": el trébol gira y se abre un perfume al azar
  const onLucky = () => {
    const pool = products.filter((p) => p.stock > 0)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (!pick) return
    if (prefersReducedMotion()) {
      openModal(pick, true)
      return
    }
    cloverRef.current?.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(540deg) scale(1.25)', offset: 0.6 },
        { transform: 'rotate(720deg) scale(1)' },
      ],
      { duration: 900, easing: EASE_OUT },
    )
    setTimeout(() => openModal(pick, true), 620)
  }

  return (
    <section
      ref={heroRef}
      id="top"
      className={`hero relative isolate -mt-[104px] overflow-hidden px-5 pb-10 pt-[140px] md:px-6 md:pb-20 md:pt-[190px] md:text-center ${
        play ? 'play' : ''
      } ${paused ? 'paused' : ''}`}
    >
      <div className="hero-glow-wrap pointer-events-none absolute inset-0 -z-10">
        <div className="hero-glow absolute left-1/2 top-[-280px] -ml-[340px] h-[680px] w-[680px] rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.30),rgba(201,162,39,0.08)_55%,transparent_75%)]" />
        <div className="hero-glow g2 absolute -bottom-[260px] -left-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(47,168,79,0.18),transparent_75%)]" />
      </div>
      {SPARKS.map((s) => (
        <span
          key={`${s.left}-${s.top}`}
          className="spark pointer-events-none absolute bg-gold-300"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}

      <div className="hero-content mx-auto max-w-[1200px]">
        <div className="fu" style={cssVars({ '--d': '60ms' })}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-forest-950/45 px-3.5 py-[7px] text-[12.5px] font-semibold text-gold-300">
            <CloverIcon className="h-3.5 w-3.5 text-trebol" />
            Envíos a todo Chile{volumes && ` · ${volumes}`}
          </span>
        </div>

        <h1 className="relative mb-1.5 mt-[18px] inline-block text-[clamp(54px,15vw,112px)] leading-[0.95] tracking-[-0.015em] text-gold-300">
          {WORDS.map((word, i) => (
            <Fragment key={word}>
              <span className="hero-word">
                <span style={cssVars({ '--i': i })}>{word}</span>
              </span>
              {i < WORDS.length - 1 && ' '}
            </Fragment>
          ))}
          {/* Copia del título que recorre un destello dorado, una sola vez */}
          <span className="hero-shine pointer-events-none absolute inset-0 text-[#fffaeb]" aria-hidden="true">
            {WORDS.map((word, i) => (
              <Fragment key={word}>
                <span className="hero-word">
                  <span>{word}</span>
                </span>
                {i < WORDS.length - 1 && ' '}
              </Fragment>
            ))}
          </span>
        </h1>

        <svg
          className="hero-orn mb-[18px] mt-1 block h-[26px] w-[260px] text-gold-500 md:mx-auto md:mb-[22px] md:w-[320px]"
          viewBox="0 0 320 26"
          aria-hidden="true"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path pathLength={1} d="M146 13 C 120 13, 110 3, 88 7 S 50 19, 30 12 S 10 9, 4 13" />
            <path pathLength={1} d="M174 13 C 200 13, 210 3, 232 7 S 270 19, 290 12 S 310 9, 316 13" />
          </g>
          <g className="clv" fill="currentColor">
            <circle cx="156.5" cy="9.5" r="3.6" />
            <circle cx="163.5" cy="9.5" r="3.6" />
            <circle cx="156.5" cy="16.5" r="3.6" />
            <circle cx="163.5" cy="16.5" r="3.6" />
          </g>
        </svg>

        <p
          className="fu max-w-[34ch] text-[17px] leading-normal text-cream-muted md:mx-auto md:text-[19px]"
          style={cssVars({ '--d': '380ms' })}
        >
          Inspirados en los grandes íconos de la perfumería.
          {minPrice !== null && (
            <>
              {' '}
              <strong className="font-extrabold text-cream">Desde {clp.format(minPrice)}.</strong>
            </>
          )}
        </p>

        <div
          className={`mt-[26px] grid max-w-[460px] gap-2 md:flex md:max-w-none md:justify-center ${
            CTA_COLS[Math.max(0, Math.min(sections.length, CTA_COLS.length) - 1)]
          }`}
        >
          <button
            type="button"
            onClick={onLucky}
            className="btn-gold press fu col-span-full inline-flex h-[54px] items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-extrabold text-forest-950"
            style={cssVars({ '--d': '480ms' })}
          >
            <CloverIcon ref={cloverRef} className="h-5 w-5" />
            Testea tu suerte
          </button>
          {sections.map((section, i) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className="press fu h-[54px] min-w-0 rounded-full border border-white/[0.12] bg-forest-800/75 px-2 text-[14.5px] font-bold transition-[background-color,border-color,transform] duration-150 hover:border-gold-300/35 hover:bg-forest-800 md:px-[22px]"
              style={cssVars({ '--d': `${540 + i * 50}ms` })}
            >
              {shortLabel(section)}
            </button>
          ))}
        </div>

        {bestsellers.length > 0 && (
          <>
            <div
              className="fu mb-3 mt-[34px] flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-trebol md:justify-center"
              style={cssVars({ '--d': '700ms' })}
            >
              <span aria-hidden="true" className="hidden h-px w-12 bg-gradient-to-l from-trebol/70 to-transparent md:block" />
              Más vendidos
              <span aria-hidden="true" className="h-px w-12 bg-gradient-to-r from-trebol/70 to-transparent" />
            </div>
            <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 pt-0.5 [scrollbar-width:none] md:mx-0 md:justify-center md:overflow-visible md:px-0">
              {bestsellers.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openModal(p)}
                  className="press fu w-[142px] shrink-0 snap-start overflow-hidden rounded-2xl bg-forest-800 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] md:w-[190px]"
                  style={cssVars({ '--d': `${760 + i * 60}ms` })}
                >
                  {/* Arriba del pliegue: carga normal, sin lazy */}
                  <ProductImage
                    src={p.image}
                    alt=""
                    width={500}
                    height={500}
                    className="aspect-square w-full object-cover"
                  />
                  <span className="block px-[11px] pb-[11px] pt-[9px] text-[13.5px] font-bold">
                    {p.name}
                    <span className="mt-0.5 block font-extrabold text-gold-300">{clp.format(p.price)}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
