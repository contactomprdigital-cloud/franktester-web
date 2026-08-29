import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { WHATSAPP_NUMBER } from '../config'
import type { OlfactoryNotes, Product } from '../data/types'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const EASE_LUX = [0.22, 1, 0.36, 1] as const

const NOTE_GROUPS: { key: keyof OlfactoryNotes; label: string; chip: string }[] = [
  { key: 'top', label: 'Notas de Salida', chip: 'bg-blue-500/20' },
  { key: 'heart', label: 'Notas de Corazón', chip: 'bg-pink-500/20' },
  { key: 'base', label: 'Notas de Base', chip: 'bg-amber-500/20' },
]

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const noteVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!product) return
    closeButtonRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [product, onClose])

  const handleWhatsApp = () => {
    if (!product) return
    const message = `Hola, me interesa el perfume ${product.name} de ${product.volume}`
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            onClick={onClose}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: EASE_LUX }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={product.name}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl bg-forest-900 ring-1 ring-white/10 shadow-2xl"
            >
              <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-forest-950 sm:aspect-video">
                <img
                  src={product.image}
                  alt={`${product.name} — inspirado en ${product.inspiration}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent" />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-cream backdrop-blur-sm transition-all hover:bg-black/60 active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.12em] text-gold-300">
                  Inspirado en {product.inspiration}
                </p>
                <h2 className="mt-1 font-display text-3xl text-cream sm:text-4xl">{product.name}</h2>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="font-display text-2xl text-gold-300">{clp.format(product.price)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-cream/70">
                    {product.volume}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      product.stock > 0 ? 'bg-gold-500/20 text-gold-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </span>
                </div>

                <motion.div initial="hidden" animate="visible" variants={listVariants} className="mt-6 space-y-6">
                  {NOTE_GROUPS.map((group) => (
                    <div key={group.key}>
                      <h3 className="mb-3 text-sm uppercase tracking-wide text-gold-300">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.notes[group.key].map((note) => (
                          <motion.span
                            key={note}
                            variants={noteVariants}
                            className={`rounded-full px-3 py-1.5 text-sm text-cream ${group.chip}`}
                          >
                            {note}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>

                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="mt-8 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold uppercase tracking-wide text-forest-950 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.97]"
                >
                  <WhatsAppIcon /> Consultar por WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.012 2C6.495 2 2.017 6.478 2.017 11.995c0 1.996.596 3.855 1.615 5.404L2 22l4.735-1.586a9.936 9.936 0 0 0 5.276 1.51h.004c5.516 0 9.994-4.478 9.994-9.995C22.01 6.412 17.53 2 12.012 2zm0 18.19h-.003a8.155 8.155 0 0 1-4.246-1.169l-.304-.181-3.15 1.055 1.07-3.086-.198-.316a8.153 8.153 0 0 1-1.264-4.398c0-4.514 3.673-8.187 8.196-8.187 2.189 0 4.246.855 5.793 2.406a8.13 8.13 0 0 1 2.402 5.789c0 4.514-3.673 8.187-8.196 8.187z" />
    </svg>
  )
}
