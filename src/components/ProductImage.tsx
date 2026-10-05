import { useState, type ImgHTMLAttributes, type Ref } from 'react'
import { CloverIcon } from './icons'

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Asset del build o URL pública de Supabase Storage */
  src: string
  alt: string
  ref?: Ref<HTMLImageElement>
}

/**
 * Foto de producto con respaldo: si falta o no carga (URL rota, Storage caído),
 * muestra el trébol de la marca en el mismo espacio en lugar del ícono roto.
 */
export function ProductImage({ src, alt, className = '', ref, onError, ...rest }: ProductImageProps) {
  // Se guarda la URL que falló: si el producto cambia de foto, se vuelve a intentar
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`img-fallback ${className}`}
      >
        <CloverIcon className="h-auto w-1/3 max-w-14 text-gold-500/35" />
      </span>
    )
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      decoding="async"
      {...rest}
      onError={(e) => {
        setFailedSrc(src)
        onError?.(e)
      }}
      className={className}
    />
  )
}
