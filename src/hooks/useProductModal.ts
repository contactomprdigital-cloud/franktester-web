import { useProductModalStore } from '../store/productModalStore'

export function useProductModal() {
  const selectedProduct = useProductModalStore((s) => s.selectedProduct)
  const lucky = useProductModalStore((s) => s.lucky)
  const openModal = useProductModalStore((s) => s.open)
  const closeModal = useProductModalStore((s) => s.close)
  return { selectedProduct, lucky, openModal, closeModal }
}
