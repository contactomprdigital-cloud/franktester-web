import { Check, ChevronDown, Eye, EyeOff, ImageUp, LoaderCircle, Trash2 } from 'lucide-react'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { SECTIONS } from '../../data/sections'
import type { Badge, Product, Section } from '../../data/types'
import { checkImageFile } from '../../lib/image'
import { LIMITS, type ProductPatch, useCatalogStore } from '../../store/catalogStore'
import { dangerButton, Field, inputClass, primaryButton, secondaryButton, Select, successButton } from './AdminField'
import {
  BADGE_OPTIONS,
  errorMessage,
  type FormField,
  type FormValues,
  notesFromValues,
  parsePrice,
  parseStock,
  toText,
  validateForm,
} from './productForm'

interface AdminProductRowProps {
  product: Product
  /** Mensaje breve para la barra de avisos del panel */
  onNotice: (message: string) => void
}

type Busy = null | 'save' | 'image' | 'visibility' | 'delete'

const valuesFrom = (p: Product): FormValues => ({
  name: p.name,
  inspiration: p.inspiration,
  volume: p.volume,
  price: String(p.price),
  stock: String(p.stock),
  top: toText(p.notes.top),
  heart: toText(p.notes.heart),
  base: toText(p.notes.base),
})

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/** ¿Cambió un número? Si el texto no es válido cuenta como cambio, para que al guardar se vea el error. */
const numberChanged = (text: string, parsed: number | null, original: number) =>
  parsed === null ? text.trim() !== String(original) : parsed !== original

export function AdminProductRow({ product, onNotice }: AdminProductRowProps) {
  const updateProduct = useCatalogStore((s) => s.updateProduct)
  const replaceImage = useCatalogStore((s) => s.replaceImage)
  const deleteProduct = useCatalogStore((s) => s.deleteProduct)

  // `original` es la versión del producto sobre la que se está editando: solo
  // se envían los campos que cambiaron respecto de ella, para no pisar en la BD
  // valores que otro dispositivo haya actualizado entretanto.
  const [original, setOriginal] = useState(product)
  const [values, setValues] = useState<FormValues>(() => valuesFrom(product))
  const [section, setSection] = useState<Section>(product.section)
  const [badge, setBadge] = useState<Badge>(product.badge)
  const [busy, setBusy] = useState<Busy>(null)
  const [saved, setSaved] = useState(false)
  const [problem, setProblem] = useState<{ field?: FormField; message: string } | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fieldRefs = useRef<Partial<Record<FormField, HTMLInputElement | HTMLSelectElement | null>>>({})

  const custom = product.custom === true
  const id = product.id
  const price = parsePrice(values.price)
  const stock = parseStock(values.stock)
  const notes = notesFromValues(values)

  const dirty =
    values.name.trim() !== original.name ||
    numberChanged(values.price, price, original.price) ||
    numberChanged(values.stock, stock, original.stock) ||
    !sameList(notes.top, original.notes.top) ||
    !sameList(notes.heart, original.notes.heart) ||
    !sameList(notes.base, original.notes.base) ||
    badge !== original.badge ||
    (custom &&
      (values.inspiration.trim() !== original.inspiration ||
        values.volume.trim() !== original.volume ||
        section !== original.section))

  // Llegó una versión nueva del producto (carga desde la BD, Realtime o el
  // propio guardado): si la fila no tiene ediciones pendientes, se muestra.
  if (product !== original && !dirty) {
    setOriginal(product)
    setValues(valuesFrom(product))
    setSection(product.section)
    setBadge(product.badge)
  }

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 1800)
    return () => clearTimeout(t)
  }, [saved])

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const set = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (problem?.field === key) setProblem(null)
  }

  const showProblem = (next: { field?: FormField; message: string }) => {
    setProblem(next)
    const field = next.field
    if (!field) return
    if (field === 'top' || field === 'heart' || field === 'base') setNotesOpen(true)
    requestAnimationFrame(() => fieldRefs.current[field]?.focus())
  }

  const handleSave = async () => {
    if (busy) return
    setProblem(null)
    const invalid = validateForm(
      custom
        ? values
        : { name: values.name, price: values.price, stock: values.stock, top: values.top, heart: values.heart, base: values.base },
    )
    if (invalid) {
      showProblem(invalid)
      return
    }
    const patch: ProductPatch = {}
    if (values.name.trim() !== original.name) patch.name = values.name.trim()
    if (price !== null && price !== original.price) patch.price = price
    if (stock !== null && stock !== original.stock) patch.stock = stock
    if (JSON.stringify(notes) !== JSON.stringify(original.notes)) patch.notes = notes
    if (badge !== original.badge) patch.badge = badge
    if (custom) {
      if (values.inspiration.trim() !== original.inspiration) patch.inspiration = values.inspiration.trim()
      if (values.volume.trim() !== original.volume) patch.volume = values.volume.trim()
      if (section !== original.section) patch.section = section
    }
    if (Object.keys(patch).length === 0) {
      // Solo cambió el formato (p. ej. "6.000"): se normaliza el texto
      setValues(valuesFrom(original))
      return
    }
    setBusy('save')
    try {
      await updateProduct(id, patch)
      setOriginal({ ...original, ...patch })
      setSaved(true)
    } catch (e) {
      setProblem({ message: errorMessage(e, 'No se pudo guardar. Intenta de nuevo.') })
    } finally {
      setBusy(null)
    }
  }

  const toggleHidden = async () => {
    if (busy) return
    setProblem(null)
    setBusy('visibility')
    const hide = !product.hidden
    try {
      await updateProduct(id, { hidden: hide })
      onNotice(hide ? `«${product.name}» quedó oculto en la tienda.` : `«${product.name}» vuelve a verse en la tienda.`)
    } catch (e) {
      setProblem({ message: errorMessage(e, 'No se pudo cambiar la visibilidad. Intenta de nuevo.') })
    } finally {
      setBusy(null)
    }
  }

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file || busy) return
    const issue = checkImageFile(file)
    if (issue) {
      setProblem({ message: issue })
      return
    }
    setProblem(null)
    setPreview(URL.createObjectURL(file))
    setBusy('image')
    try {
      await replaceImage(id, file)
      onNotice(`Foto de «${product.name}» actualizada.`)
    } catch (err) {
      setProblem({ message: errorMessage(err, 'No se pudo cambiar la foto. Intenta de nuevo.') })
    } finally {
      setPreview(null)
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    if (busy || !custom) return
    const ok = window.confirm(
      `¿Eliminar «${product.name}»?\n\nSe borra de la tienda y del panel, junto con su foto. No se puede deshacer.`,
    )
    if (!ok) return
    setProblem(null)
    setBusy('delete')
    try {
      await deleteProduct(id)
      onNotice(`«${product.name}» se eliminó.`)
    } catch (e) {
      setProblem({ message: errorMessage(e, 'No se pudo eliminar. Intenta de nuevo.') })
      setBusy(null)
    }
  }

  const invalid = (field: FormField) => (problem?.field === field ? true : undefined)
  const errorId = `${id}-error`
  const describedBy = (field: FormField) => (problem?.field === field ? errorId : undefined)
  const ref = (field: FormField) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    fieldRefs.current[field] = el
  }

  return (
    <article
      aria-labelledby={`${id}-title`}
      aria-busy={busy !== null}
      className="rounded-2xl bg-forest-800 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:p-5"
    >
      <div className="flex gap-3.5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-forest-900 sm:h-24 sm:w-24">
          <img
            src={preview ?? product.image}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            className={`h-full w-full object-cover ${product.hidden ? 'opacity-45 grayscale' : ''}`}
          />
          {busy === 'image' && (
            <div className="absolute inset-0 grid place-items-center bg-forest-950/60">
              <LoaderCircle size={22} className="animate-spin text-gold-300" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {product.hidden && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-cream">Oculto</span>
            )}
            {custom && (
              <span className="rounded-full bg-trebol/20 px-2 py-0.5 text-[11px] font-semibold text-[#8fe0a5]">
                Agregado a mano
              </span>
            )}
            {original.stock === 0 && (
              <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">Agotado</span>
            )}
          </div>
          <h3 id={`${id}-title`} className="sr-only">
            {product.name}
          </h3>
          <label className="sr-only" htmlFor={`${id}-name`}>
            Nombre
          </label>
          <input
            id={`${id}-name`}
            ref={ref('name')}
            value={values.name}
            onChange={set('name')}
            maxLength={LIMITS.name}
            aria-invalid={invalid('name')}
            aria-describedby={describedBy('name')}
            className={`${inputClass} font-semibold`}
          />
          {!custom && (
            <p className="mt-1.5 truncate text-xs text-cream-muted">
              Inspirado en {product.inspiration} · {product.volume}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field id={`${id}-price`} label="Precio (CLP)">
          <input
            id={`${id}-price`}
            ref={ref('price')}
            value={values.price}
            onChange={set('price')}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid('price')}
            aria-describedby={describedBy('price')}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-stock`} label="Stock">
          <input
            id={`${id}-stock`}
            ref={ref('stock')}
            value={values.stock}
            onChange={set('stock')}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid('stock')}
            aria-describedby={describedBy('stock')}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-badge`} label="Etiqueta" className={custom ? '' : 'col-span-2 sm:col-span-1'}>
          <Select id={`${id}-badge`} value={badge ?? ''} onChange={(e) => setBadge((e.target.value || null) as Badge)}>
            {BADGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        {custom && (
          <>
            <Field id={`${id}-section`} label="Categoría">
              <Select id={`${id}-section`} value={section} onChange={(e) => setSection(e.target.value as Section)}>
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id={`${id}-inspiration`} label="Inspirado en" className="col-span-2 sm:col-span-3">
              <input
                id={`${id}-inspiration`}
                ref={ref('inspiration')}
                value={values.inspiration}
                onChange={set('inspiration')}
                maxLength={LIMITS.inspiration}
                aria-invalid={invalid('inspiration')}
                aria-describedby={describedBy('inspiration')}
                className={inputClass}
              />
            </Field>
            <Field id={`${id}-volume`} label="Volumen" className="col-span-2 sm:col-span-1">
              <input
                id={`${id}-volume`}
                ref={ref('volume')}
                value={values.volume}
                onChange={set('volume')}
                maxLength={LIMITS.volume}
                aria-invalid={invalid('volume')}
                aria-describedby={describedBy('volume')}
                className={inputClass}
              />
            </Field>
          </>
        )}
      </div>

      <details
        open={notesOpen}
        onToggle={(e) => setNotesOpen(e.currentTarget.open)}
        className="group mt-3.5 rounded-xl bg-forest-950/40 px-3.5 py-1 ring-1 ring-white/5"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm text-cream [&::-webkit-details-marker]:hidden">
          <span>
            Notas olfativas
            <span className="ml-1.5 text-xs text-cream-muted">
              {notes.top.length + notes.heart.length + notes.base.length} notas
            </span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-cream-muted transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 pb-3 pt-1 sm:grid-cols-3">
          {(
            [
              ['top', 'Salida'],
              ['heart', 'Corazón'],
              ['base', 'Fondo'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} id={`${id}-${key}`} label={label}>
              <input
                id={`${id}-${key}`}
                ref={ref(key)}
                value={values[key]}
                onChange={set(key)}
                placeholder="Separadas por coma"
                aria-invalid={invalid(key)}
                aria-describedby={describedBy(key)}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </details>

      {problem && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-danger">
          {problem.message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={(!dirty && !saved) || busy !== null}
          // Dorado solo cuando hay algo que guardar
          className={`${saved ? successButton : dirty || busy === 'save' ? primaryButton : secondaryButton} grow basis-full sm:basis-auto sm:grow-0`}
        >
          {busy === 'save' ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Guardando…
            </>
          ) : saved ? (
            <>
              <Check size={16} aria-hidden="true" /> Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className={`${secondaryButton} grow sm:grow-0`}
        >
          <ImageUp size={16} aria-hidden="true" /> {busy === 'image' ? 'Subiendo…' : 'Cambiar foto'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <button
          type="button"
          onClick={toggleHidden}
          disabled={busy !== null}
          className={`${secondaryButton} grow sm:grow-0`}
        >
          {busy === 'visibility' ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          ) : product.hidden ? (
            <Eye size={16} aria-hidden="true" />
          ) : (
            <EyeOff size={16} aria-hidden="true" />
          )}
          {product.hidden ? 'Mostrar' : 'Ocultar'}
        </button>
        {custom && (
          <button type="button" onClick={handleDelete} disabled={busy !== null} className={`${dangerButton} grow sm:grow-0`}>
            {busy === 'delete' ? (
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}

