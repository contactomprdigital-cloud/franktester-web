import { WHATSAPP_NUMBER } from '../config'
import type { Product } from '../data/types'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

/** Precio en pesos chilenos ($12.000). Se normalizan los espacios especiales que algunos navegadores agregan. */
export const formatClp = (amount: number) => clp.format(amount).replace(/[  ]/g, ' ')

// Único lugar que arma los enlaces wa.me
function waLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

// Nombre y volumen vienen de la BD: se aplanan los saltos de línea para no romper el formato del mensaje
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

export interface OrderLine {
  name: string
  volume: string
  price: number
  qty: number
}

/** Texto del pedido: una línea por producto, el total y los datos que el vendedor necesita para el despacho. */
export function orderMessage(lines: readonly OrderLine[]): string {
  const items = lines.map(
    (l) => `• ${l.qty} × ${oneLine(l.name)} (${oneLine(l.volume)}): ${formatClp(l.price * l.qty)}`,
  )
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  return [
    'Hola FrankTester, quiero hacer este pedido:',
    '',
    ...items,
    '',
    `Total: ${formatClp(total)}`,
    '',
    'Para coordinar el pago y el despacho:',
    'Nombre:',
    'Comuna:',
  ].join('\n')
}

/** Enlace para pedir lo que hay en el carrito */
export const orderLink = (lines: readonly OrderLine[]) => waLink(orderMessage(lines))

/** Consulta desde la ficha del producto; si está agotado, pide el aviso de reposición */
export const productLink = (p: Pick<Product, 'name' | 'volume' | 'price' | 'stock'>) =>
  waLink(
    p.stock > 0
      ? `Hola, me interesa el perfume ${oneLine(p.name)} (${oneLine(p.volume)}, ${formatClp(p.price)})`
      : `Hola, avísame cuando vuelva ${oneLine(p.name)} (${oneLine(p.volume)})`,
  )

/** Enlace general (pie de página): abre el chat con un saludo */
export const generalLink = () => waLink('Hola FrankTester, tengo una consulta sobre sus perfumes.')
