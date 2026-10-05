import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { SECTIONS, sectionInfo } from '../../data/sections'
import type { Badge, Product, Section } from '../../data/types'
import { checkImageFile } from '../../lib/image'
import { LIMITS, useCatalogStore } from '../../store/catalogStore'
import { Field, inputClass, primaryButton, secondaryButton, Select } from './AdminField'
import {
  BADGE_OPTIONS,
  errorMessage,
  type FormField,
  type FormProblem,
  type FormValues,
  notesFromValues,
  parsePrice,
  parseStock,
  validateForm,
} from './productForm'

interface AdminAddProductProps {
  initialSection: Section
  onCancel: () => void
  onCreated: (product: Product) => void
}

export function AdminAddProduct({ initialSection, onCancel, onCreated }: AdminAddProductProps) {
  const createProduct = useCatalogStore((s) => s.createProduct)
  const [section, setSection] = useState<Section>(initialSection)
  const [values, setValues] = useState<FormValues>({
    name: '',
    inspiration: '',
    volume: sectionInfo(initialSection).defaultVolume,
    price: '',
    stock: '',
    top: '',
    heart: '',
    base: '',
  })
  const [badge, setBadge] = useState<Badge>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [problem, setProblem] = useState<FormProblem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Candado síncrono: un doble toque no alcanza a ver el estado de React actualizado.
  const submittingRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const fieldRefs = useRef<Partial<Record<FormField, HTMLElement | null>>>({})

  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const set = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (problem?.field === key) setProblem(null)
  }

  const changeSection = (next: Section) => {
    // Si el volumen sigue siendo el sugerido de la categoría anterior, se cambia por el de la nueva.
    setValues((v) =>
      v.volume.trim() === '' || v.volume === sectionInfo(section).defaultVolume
        ? { ...v, volume: sectionInfo(next).defaultVolume }
        : v,
    )
    setSection(next)
  }

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    const issue = checkImageFile(picked)
    if (issue) {
      setProblem({ field: 'image', message: issue })
      return
    }
    if (problem?.field === 'image') setProblem(null)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const showProblem = (next: FormProblem) => {
    setProblem(next)
    const field = next.field
    if (field) requestAnimationFrame(() => fieldRefs.current[field]?.focus())
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    const invalid = validateForm(values)
    if (invalid) {
      showProblem(invalid)
      return
    }
    const price = parsePrice(values.price)
    const stock = parseStock(values.stock)
    if (price === null || stock === null) return
    if (!file) {
      showProblem({ field: 'image', message: 'Agrega una foto del perfume.' })
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setProblem(null)
    try {
      const product = await createProduct(
        {
          section,
          name: values.name.trim(),
          inspiration: values.inspiration.trim(),
          volume: values.volume.trim(),
          price,
          stock,
          notes: notesFromValues(values),
          badge,
        },
        file,
      )
      onCreated(product)
    } catch (err) {
      setProblem({ message: errorMessage(err, 'No se pudo agregar el perfume. Intenta de nuevo.') })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const invalid = (field: FormField) => (problem?.field === field ? true : undefined)
  const describedBy = (field: FormField, hint?: string) =>
    [hint, problem?.field === field ? 'add-error' : undefined].filter(Boolean).join(' ') || undefined
  const ref = (field: FormField) => (el: HTMLElement | null) => {
    fieldRefs.current[field] = el
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="add-title"
      aria-busy={submitting}
      className="rounded-2xl bg-forest-900 p-4 ring-1 ring-gold-500/30 motion-safe:animate-[fade-up_400ms_var(--ease-lux)_both] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="add-title" className="font-display text-2xl text-gold-300">
            Agregar perfume
          </h2>
          <p className="mt-0.5 text-sm text-cream-muted">Aparece en la tienda apenas lo guardes.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Cerrar formulario"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-cream-muted hover:bg-white/5 hover:text-cream disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:gap-6">
        {/* Foto */}
        <div>
          <span id="add-photo-label" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-muted">
            Foto
          </span>
          <button
            type="button"
            ref={ref('image')}
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            aria-labelledby="add-photo-label add-photo-action"
            aria-describedby={describedBy('image', 'add-photo-hint')}
            aria-invalid={invalid('image')}
            className={`group relative grid aspect-square w-full max-w-[220px] place-items-center overflow-hidden rounded-xl bg-forest-950/70 ring-1 transition-shadow hover:ring-gold-400/60 disabled:opacity-70 sm:max-w-none ${
              problem?.field === 'image' ? 'ring-2 ring-danger/80' : 'ring-white/10'
            }`}
          >
            {preview ? (
              <img src={preview} alt="Vista previa de la foto" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-center text-sm text-cream-muted">
                <ImagePlus size={28} aria-hidden="true" className="text-gold-400" />
                Elegir foto
              </span>
            )}
            <span
              id="add-photo-action"
              className={`absolute inset-x-2 bottom-2 rounded-full bg-forest-950/85 py-1.5 text-center text-xs font-semibold text-cream ${
                preview ? '' : 'sr-only'
              }`}
            >
              {preview ? 'Cambiar foto' : 'Elegir foto'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          <p id="add-photo-hint" className="mt-1.5 text-xs text-cream/55">
            JPG, PNG o WebP de hasta 15 MB. Se reduce y optimiza sola.
          </p>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-2 content-start gap-3 sm:gap-4">
          <Field id="add-name" label="Nombre" className="col-span-2">
            <input
              id="add-name"
              ref={(el) => {
                nameRef.current = el
                fieldRefs.current.name = el
              }}
              value={values.name}
              onChange={set('name')}
              maxLength={LIMITS.name}
              autoComplete="off"
              placeholder="Ej. Lingote Gold"
              aria-invalid={invalid('name')}
              aria-describedby={describedBy('name')}
              className={inputClass}
            />
          </Field>
          <Field id="add-inspiration" label="Inspirado en" className="col-span-2">
            <input
              id="add-inspiration"
              ref={ref('inspiration')}
              value={values.inspiration}
              onChange={set('inspiration')}
              maxLength={LIMITS.inspiration}
              autoComplete="off"
              placeholder="Ej. One Million Gold"
              aria-invalid={invalid('inspiration')}
              aria-describedby={describedBy('inspiration')}
              className={inputClass}
            />
          </Field>
          <Field id="add-section" label="Categoría">
            <Select id="add-section" value={section} onChange={(e) => changeSection(e.target.value as Section)}>
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="add-volume" label="Volumen">
            <input
              id="add-volume"
              ref={ref('volume')}
              value={values.volume}
              onChange={set('volume')}
              maxLength={LIMITS.volume}
              autoComplete="off"
              aria-invalid={invalid('volume')}
              aria-describedby={describedBy('volume')}
              className={inputClass}
            />
          </Field>
          <Field id="add-price" label="Precio (CLP)">
            <input
              id="add-price"
              ref={ref('price')}
              value={values.price}
              onChange={set('price')}
              inputMode="numeric"
              autoComplete="off"
              placeholder="6000"
              aria-invalid={invalid('price')}
              aria-describedby={describedBy('price')}
              className={inputClass}
            />
          </Field>
          <Field id="add-stock" label="Stock">
            <input
              id="add-stock"
              ref={ref('stock')}
              value={values.stock}
              onChange={set('stock')}
              inputMode="numeric"
              autoComplete="off"
              placeholder="20"
              aria-invalid={invalid('stock')}
              aria-describedby={describedBy('stock')}
              className={inputClass}
            />
          </Field>
          <Field id="add-badge" label="Etiqueta" className="col-span-2 sm:col-span-1">
            <Select id="add-badge" value={badge ?? ''} onChange={(e) => setBadge((e.target.value || null) as Badge)}>
              {BADGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="col-span-2 mt-1 grid gap-3 sm:grid-cols-3">
            <legend className="mb-2 text-sm text-cream">
              Notas olfativas <span className="text-xs text-cream-muted">(separadas por coma, opcionales)</span>
            </legend>
            {(
              [
                ['top', 'Salida', 'Bergamota, Limón'],
                ['heart', 'Corazón', 'Lavanda, Rosa'],
                ['base', 'Fondo', 'Vainilla, Ámbar'],
              ] as const
            ).map(([key, label, placeholder]) => (
              <Field key={key} id={`add-${key}`} label={label}>
                <input
                  id={`add-${key}`}
                  ref={ref(key)}
                  value={values[key]}
                  onChange={set(key)}
                  autoComplete="off"
                  placeholder={placeholder}
                  aria-invalid={invalid(key)}
                  aria-describedby={describedBy(key)}
                  className={inputClass}
                />
              </Field>
            ))}
          </fieldset>
        </div>
      </div>

      {problem && (
        <p id="add-error" role="alert" className="mt-4 text-sm text-danger">
          {problem.message}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={submitting} className={secondaryButton}>
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Subiendo foto y guardando…
            </>
          ) : (
            'Agregar perfume'
          )}
        </button>
      </div>
    </form>
  )
}
