import { supabase } from './supabase'

/** Bucket público de Supabase Storage con las fotos de los productos */
export const IMAGE_BUCKET = 'product-images'
/** Peso máximo de la foto original, antes de reducirla */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024
/** Límite del bucket (file_size_limit en la migración) */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const MAX_SIDE = 1200
const QUALITIES = [0.85, 0.75, 0.65]
/** Fondo para zonas transparentes: el mismo de la tarjeta mientras carga la foto (forest-900) */
const BACKDROP = '#0d2818'
// WebP primero. Safari (también en iPhone) no sabe generar WebP desde un
// canvas y devuelve PNG: en ese caso se usa JPEG, que sí genera.
const FORMATS = [
  { type: 'image/webp', ext: 'webp' },
  { type: 'image/jpeg', ext: 'jpg' },
] as const

/** Error con un mensaje listo para mostrar al admin */
export class ImageError extends Error {
  name = 'ImageError'
}

const baseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')

/** Prefijo de las URLs públicas del bucket; null si Supabase no está configurado */
export const IMAGE_URL_PREFIX: string | null = baseUrl ? `${baseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/` : null

const SAFE_PATH = /^[A-Za-z0-9/_.-]{1,200}$/

/** Solo se aceptan fotos de nuestro bucket (nunca una URL arbitraria que venga de la BD). */
export function isProductImageUrl(v: unknown): v is string {
  if (typeof v !== 'string' || IMAGE_URL_PREFIX === null || !v.startsWith(IMAGE_URL_PREFIX)) return false
  const path = v.slice(IMAGE_URL_PREFIX.length)
  return SAFE_PATH.test(path) && !path.includes('..')
}

/** Ruta dentro del bucket de una URL pública nuestra (para borrarla) */
export function storagePathFromUrl(v: unknown): string | null {
  return isProductImageUrl(v) && IMAGE_URL_PREFIX ? v.slice(IMAGE_URL_PREFIX.length) : null
}

/** Revisión rápida antes de procesar la foto. Devuelve el problema o null. */
export function checkImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo no es una imagen. Elige una foto JPG, PNG o WebP.'
  if (file.size === 0) return 'La foto está vacía. Elige otra.'
  if (file.size > MAX_SOURCE_BYTES) return 'La foto pesa más de 15 MB. Elige una más liviana.'
  return null
}

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch {
      // Algunos navegadores no decodifican ciertos formatos así: se prueba con <img>
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

export interface PreparedImage {
  blob: Blob
  type: (typeof FORMATS)[number]['type']
  ext: (typeof FORMATS)[number]['ext']
}

/**
 * Reduce la foto a 1200 px como máximo y la vuelve a codificar (WebP, o JPEG
 * si el navegador no genera WebP). Al redibujarla en un canvas se descartan
 * los metadatos EXIF (ubicación, cámara) y baja mucho el peso.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const problem = checkImageFile(file)
  if (problem) throw new ImageError(problem)

  let decoded: Decoded
  try {
    decoded = await decode(file)
  } catch {
    throw new ImageError('No se pudo leer la foto. Prueba con otra en formato JPG o PNG.')
  }

  try {
    if (!decoded.width || !decoded.height) throw new ImageError('La foto no tiene un tamaño válido.')
    const scale = Math.min(1, MAX_SIDE / Math.max(decoded.width, decoded.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(decoded.width * scale))
    canvas.height = Math.max(1, Math.round(decoded.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('Tu navegador no pudo procesar la foto.')
    ctx.fillStyle = BACKDROP
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height)

    for (const format of FORMATS) {
      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, format.type, quality)
        // Si el navegador no sabe generar este formato, devuelve otro (PNG): se pasa al siguiente.
        if (!blob || blob.type !== format.type) break
        if (blob.size <= MAX_UPLOAD_BYTES) return { blob, type: format.type, ext: format.ext }
      }
    }
    throw new ImageError('No se pudo reducir la foto a menos de 2 MB. Prueba con otra.')
  } finally {
    decoded.close()
  }
}

/** Sube la foto ya procesada a products/<id>/<uuid>.<ext> y devuelve su ruta y URL pública. */
export async function uploadProductImage(productId: string, file: File): Promise<{ path: string; url: string }> {
  if (!supabase || !IMAGE_URL_PREFIX) throw new ImageError('Supabase no está configurado.')
  const image = await prepareImage(file)
  const path = `products/${productId}/${crypto.randomUUID()}.${image.ext}`
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, image.blob, {
    contentType: image.type,
    // Cada foto tiene un nombre único: se puede cachear sin miedo
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  return { path, url: `${IMAGE_URL_PREFIX}${path}` }
}

/** Borra fotos del bucket sin fallar: si no se puede, solo queda un archivo huérfano. */
export async function removeProductImages(paths: string[]): Promise<void> {
  if (!supabase || paths.length === 0) return
  try {
    await supabase.storage.from(IMAGE_BUCKET).remove(paths)
  } catch {
    // best effort
  }
}

/** Borra todas las fotos de un producto (incluidas las que quedaron de cambios anteriores). */
export async function removeProductFolder(productId: string, knownUrl?: unknown): Promise<void> {
  if (!supabase) return
  const paths = new Set<string>()
  const known = storagePathFromUrl(knownUrl)
  if (known) paths.add(known)
  try {
    const { data } = await supabase.storage.from(IMAGE_BUCKET).list(`products/${productId}`, { limit: 100 })
    for (const entry of data ?? []) if (entry.name) paths.add(`products/${productId}/${entry.name}`)
  } catch {
    // best effort: al menos se borra la foto conocida
  }
  await removeProductImages([...paths])
}
